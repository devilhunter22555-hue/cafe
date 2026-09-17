const Bill = require('../models/Bill');
const InventoryItem = require('../models/InventoryItem');
const PurchaseOrder = require('../models/PurchaseOrder');
const Recipe = require('../models/Recipe');
const Order = require('../models/Order');
const StockLog = require('../models/StockLog');
const { generateInsightSummary } = require('../utils/geminiClient');

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function safePercentChange(currentValue, previousValue) {
  if (previousValue === 0 || previousValue === null || previousValue === undefined) {
    return 0;
  }
  return ((currentValue - previousValue) / previousValue) * 100;
}

function parseDate(value, fieldName) {
  if (!value) {
    throw createError(`${fieldName} is required`, 400);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw createError(`Invalid ${fieldName}`, 400);
  }

  return date;
}

function normalizeFoodCostResult(result) {
  const totalRevenue = toNumber(result.totalRevenue);
  const estimatedFoodCost = toNumber(result.estimatedFoodCost);
  const foodCostPercentage = totalRevenue > 0 ? (estimatedFoodCost / totalRevenue) * 100 : 0;

  return {
    totalRevenue,
    estimatedFoodCost,
    foodCostPercentage,
    itemsWithUnknownCost: result.itemsWithUnknownCost || []
  };
}

async function getLatestPriceMap(restaurantId, branchId) {
  const purchaseOrders = await PurchaseOrder.find({
    restaurantId,
    branchId,
    status: 'received'
  }).lean();

  const latestByInventoryId = new Map();

  purchaseOrders.forEach((purchaseOrder) => {
    const purchasedAt = new Date(purchaseOrder.receivedAt || purchaseOrder.createdAt);

    (purchaseOrder.items || []).forEach((item) => {
      const inventoryItemId = String(item.inventoryItemId);
      const currentEntry = latestByInventoryId.get(inventoryItemId);
      const candidateDate = new Date(purchasedAt);

      if (!currentEntry || candidateDate > new Date(currentEntry.purchasedAt)) {
        latestByInventoryId.set(inventoryItemId, {
          unitPrice: Number(item.unitPrice) || 0,
          purchasedAt: candidateDate
        });
      }
    });
  });

  return latestByInventoryId;
}

async function calculateFoodCostWindow(restaurantId, branchId, fromDate, toDate) {
  const bills = await Bill.find({
    restaurantId,
    branchId,
    createdAt: { $gte: fromDate, $lte: toDate }
  }).lean();

  const orderIds = [...new Set(bills.map((bill) => String(bill.orderId)).filter(Boolean))];
  const orders = orderIds.length
    ? await Order.find({
        _id: { $in: orderIds },
        restaurantId,
        branchId
      }).lean()
    : [];

  const orderById = new Map(orders.map((order) => [String(order._id), order]));
  const menuItemIds = [...new Set(
    orders.flatMap((order) => (order.items || []).map((item) => String(item.menuItemId)).filter(Boolean))
  )];

  const recipes = menuItemIds.length
    ? await Recipe.find({
        restaurantId,
        branchId,
        menuItemId: { $in: menuItemIds }
      }).lean()
    : [];

  const recipeByMenuItemId = new Map(
    recipes.map((recipe) => [String(recipe.menuItemId), recipe])
  );

  const ingredientIds = [...new Set(
    recipes.flatMap((recipe) => (recipe.ingredients || []).map((ingredient) => String(ingredient.inventoryItemId)))
  )];

  const inventoryItems = ingredientIds.length
    ? await InventoryItem.find({
        _id: { $in: ingredientIds },
        restaurantId,
        branchId
      }).lean()
    : [];

  const inventoryById = new Map(
    inventoryItems.map((item) => [String(item._id), item])
  );

  const latestPrices = await getLatestPriceMap(restaurantId, branchId);
  let totalRevenue = 0;
  let estimatedFoodCost = 0;
  const itemsWithUnknownCost = [];

  const addUnknownCostItem = (name, reason) => {
    const key = `${name}|${reason}`;
    if (!itemsWithUnknownCost.some((item) => `${item.name}|${item.reason || ''}` === key)) {
      itemsWithUnknownCost.push({ name, reason });
    }
  };

  bills.forEach((bill) => {
    totalRevenue += toNumber(bill.total);

    const order = orderById.get(String(bill.orderId));
    const orderItems = order?.items || [];

    (bill.items || []).forEach((billItem) => {
      const matchedOrderItem = orderItems.find((orderItem) =>
        String(orderItem.name) === String(billItem.name)
      );

      const menuItemId = matchedOrderItem?.menuItemId;
      if (!menuItemId) {
        addUnknownCostItem(billItem.name || 'Unknown item', 'No recipe is linked to this billed item yet');
        return;
      }

      const recipe = recipeByMenuItemId.get(String(menuItemId));
      if (!recipe) {
        addUnknownCostItem(billItem.name || 'Unknown item', 'No recipe exists for this billed item');
        return;
      }

      (recipe.ingredients || []).forEach((ingredient) => {
        const inventoryItemId = String(ingredient.inventoryItemId);
        const latestPriceEntry = latestPrices.get(inventoryItemId);

        if (!latestPriceEntry || !latestPriceEntry.unitPrice) {
          const inventoryItem = inventoryById.get(inventoryItemId);
          addUnknownCostItem(
            inventoryItem?.name || 'Unknown inventory item',
            'No purchase price history recorded for this ingredient yet'
          );
          return;
        }

        const ingredientCost = latestPriceEntry.unitPrice * Number(ingredient.quantityPerUnit || 0) * Number(billItem.qty || 0);
        estimatedFoodCost += ingredientCost;
      });
    });
  });

  return normalizeFoodCostResult({
    totalRevenue,
    estimatedFoodCost,
    itemsWithUnknownCost: itemsWithUnknownCost.filter((entry, index, arr) =>
      arr.findIndex((item) => String(item.inventoryItemId) === String(entry.inventoryItemId)) === index
    )
  });
}

async function buildPriceTrendsContext(restaurantId, branchId, days = 30) {
  const lookbackDays = Number.isFinite(days) && days > 0 ? days : 30;
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - lookbackDays);

  const inventoryItems = await InventoryItem.find({
    restaurantId,
    branchId,
    isActive: true
  }).lean();

  const purchaseOrders = await PurchaseOrder.find({
    restaurantId,
    branchId,
    status: 'received',
    createdAt: { $gte: fromDate }
  }).lean();

  return inventoryItems
    .map((inventoryItem) => {
      const itemPurchases = [];

      purchaseOrders.forEach((order) => {
        (order.items || []).forEach((orderItem) => {
          const itemId = String(orderItem.inventoryItemId);
          if (String(inventoryItem._id) !== itemId) {
            return;
          }

          itemPurchases.push({
            unitPrice: Number(orderItem.unitPrice) || 0,
            purchasedAt: new Date(order.receivedAt || order.createdAt)
          });
        });
      });

      itemPurchases.sort((first, second) => new Date(first.purchasedAt) - new Date(second.purchasedAt));

      if (itemPurchases.length < 2) {
        return null;
      }

      const currentPrice = itemPurchases[itemPurchases.length - 1].unitPrice;
      const previousPrice = itemPurchases[itemPurchases.length - 2].unitPrice;
      const percentChange = safePercentChange(currentPrice, previousPrice);

      return {
        inventoryItemId: inventoryItem._id,
        name: inventoryItem.name,
        unit: inventoryItem.unit,
        currentPrice,
        previousPrice,
        percentChange,
        lastPurchasedAt: itemPurchases[itemPurchases.length - 1].purchasedAt
      };
    })
    .filter(Boolean)
    .sort((first, second) => Math.abs(second.percentChange) - Math.abs(first.percentChange));
}

async function buildFoodCostSummaryContext(restaurantId, branchId, fromDate, toDate) {
  const currentSummary = await calculateFoodCostWindow(restaurantId, branchId, fromDate, toDate);
  const rangeLength = toDate.getTime() - fromDate.getTime();
  const previousFrom = new Date(fromDate.getTime() - rangeLength);
  const previousTo = new Date(toDate.getTime() - rangeLength);

  const previousSummary = await calculateFoodCostWindow(
    restaurantId,
    branchId,
    previousFrom,
    previousTo
  );

  const previousFoodCostPercentage = Number(previousSummary.foodCostPercentage || 0);
  const comparisonToPreviousPeriod = previousFoodCostPercentage === 0
    ? 0
    : safePercentChange(currentSummary.foodCostPercentage, previousFoodCostPercentage);

  return {
    totalRevenue: currentSummary.totalRevenue,
    estimatedFoodCost: currentSummary.estimatedFoodCost,
    foodCostPercentage: currentSummary.foodCostPercentage,
    comparisonToPreviousPeriod,
    itemsWithUnknownCost: currentSummary.itemsWithUnknownCost
  };
}

async function buildLowStockContext(restaurantId, branchId) {
  const inventoryItems = await InventoryItem.find({
    restaurantId,
    branchId,
    isActive: true
  }).lean();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const stockLogs = await StockLog.find({
    restaurantId,
    branchId,
    changeType: 'order_deduction',
    createdAt: { $gte: sevenDaysAgo }
  }).lean();

  const logsByInventoryId = new Map();
  stockLogs.forEach((log) => {
    const key = String(log.inventoryItemId);
    const existing = logsByInventoryId.get(key) || [];
    existing.push(log);
    logsByInventoryId.set(key, existing);
  });

  return inventoryItems
    .map((inventoryItem) => {
      const relevantLogs = logsByInventoryId.get(String(inventoryItem._id)) || [];
      const totalReduction = relevantLogs.reduce((sum, log) => sum + Math.abs(Number(log.quantityChange) || 0), 0);
      const avgDailyConsumption = totalReduction / 7;

      if (avgDailyConsumption <= 0) {
        return null;
      }

      const estimatedDaysRemaining = inventoryItem.currentStock / avgDailyConsumption;

      if (estimatedDaysRemaining >= 3) {
        return null;
      }

      return {
        name: inventoryItem.name,
        currentStock: inventoryItem.currentStock,
        unit: inventoryItem.unit,
        avgDailyConsumption,
        estimatedDaysRemaining
      };
    })
    .filter(Boolean)
    .sort((first, second) => first.estimatedDaysRemaining - second.estimatedDaysRemaining);
}

async function getPriceTrends(req, res, next) {
  try {
    const days = Number(req.query.days ?? 30);
    const trends = await buildPriceTrendsContext(req.restaurantId, req.branchId, days);

    res.json({
      success: true,
      data: trends,
      message: 'Price trends fetched successfully'
    });
  } catch (error) {
    next(error);
  }
}

async function getFoodCostSummary(req, res, next) {
  try {
    const fromDate = parseDate(req.query.from, 'from');
    const toDate = parseDate(req.query.to, 'to');

    if (toDate < fromDate) {
      throw createError('The to date must be after the from date', 400);
    }

    const summary = await buildFoodCostSummaryContext(req.restaurantId, req.branchId, fromDate, toDate);

    const responsePayload = {
      success: true,
      data: {
        totalRevenue: summary.totalRevenue,
        estimatedFoodCost: summary.estimatedFoodCost,
        foodCostPercentage: summary.foodCostPercentage,
        comparisonToPreviousPeriod: summary.comparisonToPreviousPeriod,
        itemsWithUnknownCost: summary.itemsWithUnknownCost
      },
      message: 'Food cost summary fetched successfully'
    };

    res.json(responsePayload);
  } catch (error) {
    next(error);
  }
}

async function getLowStockForecast(req, res, next) {
  try {
    const flaggedItems = await buildLowStockContext(req.restaurantId, req.branchId);

    res.json({
      success: true,
      data: flaggedItems,
      message: 'Low stock forecast fetched successfully'
    });
  } catch (error) {
    next(error);
  }
}

async function getAISummary(req, res, next) {
  try {
    const fromDate = parseDate(req.query.from, 'from');
    const toDate = parseDate(req.query.to, 'to');

    if (toDate < fromDate) {
      throw createError('The to date must be after the from date', 400);
    }

    const foodCost = await buildFoodCostSummaryContext(req.restaurantId, req.branchId, fromDate, toDate);
    const priceTrends = await buildPriceTrendsContext(req.restaurantId, req.branchId, 30);
    const lowStock = await buildLowStockContext(req.restaurantId, req.branchId);

    const summary = await generateInsightSummary({
      foodCost,
      priceTrends,
      lowStock
    });

    res.json({
      success: true,
      data: {
        summary,
        rawData: {
          foodCost,
          priceTrends,
          lowStock
        }
      },
      message: 'AI summary generated successfully'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getPriceTrends,
  getFoodCostSummary,
  getLowStockForecast,
  getAISummary
};

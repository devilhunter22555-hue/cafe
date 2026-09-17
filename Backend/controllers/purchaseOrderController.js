const mongoose = require('mongoose');
const InventoryItem = require('../models/InventoryItem');
const PurchaseOrder = require('../models/PurchaseOrder');
const StockLog = require('../models/StockLog');
const Supplier = require('../models/Supplier');
const getNextSequence = require('../utils/getNextSequence');

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function createPurchaseOrder(req, res, next) {
  const session = await mongoose.startSession();
  try {
    const { supplierId, items, notes } = req.body;
    if (!supplierId) throw createError('supplierId is required', 400);
    if (!Array.isArray(items) || items.length === 0) {
      throw createError('items array is required', 400);
    }

    let supplier;
    let inventoryItems;

    await session.withTransaction(async () => {
      supplier = await Supplier.findOne({
        _id: supplierId,
        restaurantId: req.restaurantId,
        branchId: req.branchId,
        isActive: true
      }).session(session);
      if (!supplier) throw createError('Supplier not found', 404);

      const itemIds = items.map((item) => item.inventoryItemId);
      inventoryItems = await InventoryItem.find({
        _id: { $in: itemIds },
        restaurantId: req.restaurantId,
        branchId: req.branchId,
        isActive: true
      }).session(session);

      if (inventoryItems.length !== itemIds.length) {
        throw createError('One or more inventory items are invalid', 400);
      }

      const enrichedItems = items.map((item) => {
        const inventoryItem = inventoryItems.find((existing) => String(existing._id) === String(item.inventoryItemId));
        if (!inventoryItem) {
          throw createError('One or more inventory items are invalid', 400);
        }

        const quantity = Number(item.quantity);
        const unitPrice = Number(item.unitPrice);
        if (!Number.isFinite(quantity) || quantity <= 0) {
          throw createError('Each item quantity must be a positive number', 400);
        }
        if (!Number.isFinite(unitPrice) || unitPrice < 0) {
          throw createError('Each item unitPrice must be a valid non-negative number', 400);
        }

        const lineTotal = quantity * unitPrice;
        return {
          inventoryItemId: item.inventoryItemId,
          quantity,
          unitPrice,
          lineTotal
        };
      });

      const totalAmount = enrichedItems.reduce((sum, item) => sum + item.lineTotal, 0);
      const poNumber = `PO-${String(await getNextSequence({
        restaurantId: req.restaurantId,
        branchId: req.branchId,
        name: 'po',
        session
      })).padStart(6, '0')}`;

      const purchaseOrder = await PurchaseOrder.create([{
        supplierId,
        poNumber,
        items: enrichedItems,
        totalAmount,
        status: 'pending',
        orderedBy: req.user.userId || req.user._id,
        notes,
        restaurantId: req.restaurantId,
        branchId: req.branchId
      }], { session });

      res.status(201).json({
        success: true,
        data: purchaseOrder[0],
        message: 'Purchase order created successfully'
      });
    });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
}

async function getPurchaseOrders(req, res, next) {
  try {
    const filter = {
      restaurantId: req.restaurantId,
      branchId: req.branchId,
      status: { $ne: 'cancelled' }
    };

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const orders = await PurchaseOrder.find(filter)
      .populate('supplierId', 'name contactPerson phone email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: orders, message: 'Purchase orders fetched successfully' });
  } catch (error) {
    next(error);
  }
}

async function getPurchaseOrderById(req, res, next) {
  try {
    const order = await PurchaseOrder.findOne({
      _id: req.params.id,
      restaurantId: req.restaurantId,
      branchId: req.branchId
    })
      .populate('supplierId', 'name contactPerson phone email address')
      .populate('items.inventoryItemId', 'name unit currentStock');

    if (!order) throw createError('Purchase order not found', 404);

    res.json({ success: true, data: order, message: 'Purchase order fetched successfully' });
  } catch (error) {
    next(error);
  }
}

async function markAsReceived(req, res, next) {
  const session = await mongoose.startSession();
  try {
    let order;
    await session.withTransaction(async () => {
      order = await PurchaseOrder.findOne({
        _id: req.params.id,
        restaurantId: req.restaurantId,
        branchId: req.branchId
      }).session(session);

      if (!order) throw createError('Purchase order not found', 404);
      if (order.status !== 'pending') {
        throw createError('Only pending purchase orders can be marked as received', 400);
      }

      for (const item of order.items) {
        const inventoryItem = await InventoryItem.findOne({
          _id: item.inventoryItemId,
          restaurantId: req.restaurantId,
          branchId: req.branchId,
          isActive: true
        }).session(session);

        if (!inventoryItem) throw createError('Inventory item not found for this purchase order', 404);

        const previousStock = inventoryItem.currentStock;
        const newStock = previousStock + item.quantity;
        inventoryItem.currentStock = newStock;
        await inventoryItem.save({ session });

        await StockLog.create([{
          inventoryItemId: inventoryItem._id,
          changeType: 'purchase',
          quantityChange: item.quantity,
          previousStock,
          newStock,
          note: `Purchase order ${order.poNumber}`,
          createdBy: req.user.userId || req.user._id,
          restaurantId: req.restaurantId,
          branchId: req.branchId
        }], { session });
      }

      order.status = 'received';
      order.receivedAt = new Date();
      await order.save({ session });
    });

    res.json({ success: true, data: order, message: 'Purchase order marked as received' });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
}

async function cancelPurchaseOrder(req, res, next) {
  try {
    const order = await PurchaseOrder.findOne({
      _id: req.params.id,
      restaurantId: req.restaurantId,
      branchId: req.branchId
    });

    if (!order) throw createError('Purchase order not found', 404);
    if (order.status !== 'pending') {
      throw createError('Only pending purchase orders can be cancelled', 400);
    }

    order.status = 'cancelled';
    await order.save();

    res.json({ success: true, data: order, message: 'Purchase order cancelled successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  markAsReceived,
  cancelPurchaseOrder
};

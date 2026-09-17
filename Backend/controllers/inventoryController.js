const mongoose = require('mongoose');
const InventoryItem = require('../models/InventoryItem');
const StockLog = require('../models/StockLog');

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function itemFields(body) {
  return {
    name: body.name,
    unit: body.unit,
    lowStockThreshold: body.lowStockThreshold
  };
}

function validateChange(changeType, quantityChange) {
  if (!['purchase', 'wastage', 'manual_adjustment'].includes(changeType)) {
    throw createError('Invalid stock change type', 400);
  }
  if (!Number.isFinite(quantityChange) || quantityChange === 0) {
    throw createError('quantityChange must be a non-zero number', 400);
  }
  if (changeType === 'purchase' && quantityChange < 0) {
    throw createError('Purchase quantityChange must be positive', 400);
  }
  if (changeType === 'wastage' && quantityChange > 0) {
    throw createError('Wastage quantityChange must be negative', 400);
  }
}

async function createInventoryItem(req, res, next) {
  try {
    const { name, unit, currentStock, lowStockThreshold } = req.body;
    const item = await InventoryItem.create({
      name,
      unit,
      currentStock: currentStock === undefined ? 0 : currentStock,
      lowStockThreshold: lowStockThreshold === undefined ? 5 : lowStockThreshold,
      restaurantId: req.restaurantId,
      branchId: req.branchId
    });
    res.status(201).json({ success: true, data: item, message: 'Inventory item created successfully' });
  } catch (error) {
    next(error);
  }
}

async function getInventoryItems(req, res, next) {
  try {
    const items = await InventoryItem.find({
      restaurantId: req.restaurantId,
      branchId: req.branchId,
      isActive: true
    }).sort({ name: 1 }).lean();
    const data = items.map((item) => ({
      ...item,
      isLowStock: item.currentStock <= item.lowStockThreshold
    }));
    res.json({ success: true, data, message: 'Inventory items fetched successfully' });
  } catch (error) {
    next(error);
  }
}

async function updateInventoryItem(req, res, next) {
  try {
    const item = await InventoryItem.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.restaurantId, branchId: req.branchId, isActive: true },
      { $set: itemFields(req.body) },
      { new: true, runValidators: true }
    );
    if (!item) throw createError('Inventory item not found', 404);
    res.json({ success: true, data: item, message: 'Inventory item updated successfully' });
  } catch (error) {
    next(error);
  }
}

async function adjustStock(req, res, next) {
  const session = await mongoose.startSession();
  try {
    const { changeType, note } = req.body;
    const quantityChange = Number(req.body.quantityChange);
    validateChange(changeType, quantityChange);

    let item;
    let log;
    await session.withTransaction(async () => {
      item = await InventoryItem.findOne({
        _id: req.params.id,
        restaurantId: req.restaurantId,
        branchId: req.branchId,
        isActive: true
      }).session(session);
      if (!item) throw createError('Inventory item not found', 404);

      const previousStock = item.currentStock;
      const newStock = previousStock + quantityChange;
      if (newStock < 0) throw createError('Stock cannot go below zero', 400);

      item.currentStock = newStock;
      await item.save({ session });
      [log] = await StockLog.create([{
        inventoryItemId: item._id,
        changeType,
        quantityChange,
        previousStock,
        newStock,
        note,
        createdBy: req.user.userId,
        restaurantId: req.restaurantId,
        branchId: req.branchId
      }], { session });
    });

    res.json({ success: true, data: { item, log }, message: 'Stock adjusted successfully' });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
}

async function getStockLogs(req, res, next) {
  try {
    const item = await InventoryItem.findOne({
      _id: req.params.id,
      restaurantId: req.restaurantId,
      branchId: req.branchId,
      isActive: true
    });
    if (!item) throw createError('Inventory item not found', 404);

    const logs = await StockLog.find({
      inventoryItemId: item._id,
      restaurantId: req.restaurantId,
      branchId: req.branchId
    }).populate('createdBy', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, data: logs, message: 'Stock logs fetched successfully' });
  } catch (error) {
    next(error);
  }
}

async function deleteInventoryItem(req, res, next) {
  try {
    const item = await InventoryItem.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.restaurantId, branchId: req.branchId, isActive: true },
      { $set: { isActive: false } },
      { new: true }
    );
    if (!item) throw createError('Inventory item not found', 404);
    res.json({ success: true, data: item, message: 'Inventory item deleted successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createInventoryItem,
  getInventoryItems,
  updateInventoryItem,
  adjustStock,
  getStockLogs,
  deleteInventoryItem
};

const { nanoid } = require('nanoid');
const Table = require('../models/Table');

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function createTable(req, res, next) {
  try {
    let qrToken;
    do {
      qrToken = nanoid(10);
    } while (await Table.exists({ qrToken, restaurantId: req.restaurantId }));

    const table = await Table.create({
      tableNumber: req.body.tableNumber,
      capacity: req.body.capacity,
      status: 'free',
      qrToken,
      restaurantId: req.restaurantId,
      branchId: req.branchId
    });

    res.status(201).json({ success: true, data: table, message: 'Table created successfully' });
  } catch (error) {
    next(error);
  }
}

async function getTables(req, res, next) {
  try {
    const tables = await Table.find({
      restaurantId: req.restaurantId,
      branchId: req.branchId,
      isActive: true
    }).sort({ tableNumber: 1 });

    res.json({ success: true, data: tables, message: 'Tables fetched successfully' });
  } catch (error) {
    next(error);
  }
}

async function updateTable(req, res, next) {
  try {
    const table = await Table.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.restaurantId, branchId: req.branchId },
      { $set: { tableNumber: req.body.tableNumber, capacity: req.body.capacity } },
      { new: true, runValidators: true }
    );
    if (!table) throw createError('Table not found', 404);

    res.json({ success: true, data: table, message: 'Table updated successfully' });
  } catch (error) {
    next(error);
  }
}

async function updateTableStatus(req, res, next) {
  try {
    const table = await Table.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.restaurantId, branchId: req.branchId },
      { $set: { status: req.body.status } },
      { new: true, runValidators: true }
    );
    if (!table) throw createError('Table not found', 404);

    res.json({ success: true, data: table, message: 'Table status updated successfully' });
  } catch (error) {
    next(error);
  }
}

async function deleteTable(req, res, next) {
  try {
    const table = await Table.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.restaurantId, branchId: req.branchId },
      { $set: { isActive: false } },
      { new: true, runValidators: true }
    );
    if (!table) throw createError('Table not found', 404);

    res.json({ success: true, data: table, message: 'Table deleted successfully' });
  } catch (error) {
    next(error);
  }
}

async function getQrCodeUrl(req, res, next) {
  try {
    const table = await Table.findOne({
      _id: req.params.id,
      restaurantId: req.restaurantId,
      branchId: req.branchId,
      isActive: true
    });
    if (!table) throw createError('Table not found', 404);

    res.json({
      success: true,
      data: { url: `${process.env.CUSTOMER_APP_URL}/t/${table.qrToken}` },
      message: 'QR code URL generated successfully'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { createTable, getTables, updateTable, updateTableStatus, deleteTable, getQrCodeUrl };
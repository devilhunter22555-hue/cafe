const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const Table = require('../models/Table');
const calculateOrderTotals = require('../utils/orderCalculations');

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function createOrder(req, res, next) {
  const session = await mongoose.startSession();

  try {
    const { orderType, tableId, items } = req.body;
    const discount = Number(req.body.discount) || 0;

    if (!['dine-in', 'takeaway'].includes(orderType)) {
      throw createError('A valid order type is required', 400);
    }
    if (!Array.isArray(items) || items.length === 0) {
      throw createError('At least one order item is required', 400);
    }
    if (discount < 0) {
      throw createError('Discount cannot be negative', 400);
    }
    if (orderType === 'dine-in' && !mongoose.Types.ObjectId.isValid(tableId)) {
      throw createError('A valid table is required for dine-in orders', 400);
    }

    let table;
    if (orderType === 'dine-in') {
      table = await Table.findOne({
        _id: tableId,
        restaurantId: req.restaurantId,
        branchId: req.branchId,
        isActive: true
      }).session(session);
      if (!table) throw createError('Table not found', 404);
    }

    const menuItemIds = items.map((item) => item.menuItemId);
    if (menuItemIds.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
      throw createError('Each order item must reference a valid menu item', 400);
    }

    const menuItems = await MenuItem.find({
      _id: { $in: menuItemIds },
      restaurantId: req.restaurantId,
      branchId: req.branchId,
      isAvailable: true
    }).session(session);
    const menuItemsById = new Map(menuItems.map((item) => [item._id.toString(), item]));

    const orderItems = items.map((item) => {
      const menuItem = menuItemsById.get(item.menuItemId.toString());
      if (!menuItem) throw createError(`Menu item not found: ${item.menuItemId}`, 404);

      const quantity = Number(item.qty);
      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw createError('Item quantity must be a positive integer', 400);
      }

      return {
        menuItemId: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        taxSlab: menuItem.taxSlab,
        qty: quantity,
        selectedModifiers: Array.isArray(item.selectedModifiers)
          ? item.selectedModifiers.map((modifier) => ({
              name: modifier.name,
              priceDelta: Number(modifier.priceDelta) || 0
            }))
          : [],
        notes: item.notes
      };
    });

    const totals = calculateOrderTotals(orderItems, discount);
    let order;

    await session.withTransaction(async () => {
      [order] = await Order.create([{
        orderType,
        tableId: orderType === 'dine-in' ? table._id : undefined,
        items: orderItems,
        subtotal: totals.subtotal,
        cgst: totals.cgst,
        sgst: totals.sgst,
        discount,
        total: totals.total,
        source: 'staff',
        createdBy: req.user._id,
        restaurantId: req.restaurantId,
        branchId: req.branchId
      }], { session });

      if (orderType === 'dine-in') {
        await Table.updateOne(
          { _id: table._id, restaurantId: req.restaurantId, branchId: req.branchId },
          { $set: { status: 'occupied' } },
          { session }
        );
      }
    });

    const io = req.app.get('io');
    if (io) io.to(`branch_${req.branchId}`).emit('new-order', order);

    res.status(201).json({ success: true, data: order, message: 'Order created successfully' });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
}

async function getOrders(req, res, next) {
  try {
    const filter = {
      restaurantId: req.restaurantId,
      branchId: req.branchId
    };
    if (req.query.status) filter.status = req.query.status;

    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: orders, message: 'Orders fetched successfully' });
  } catch (error) {
    next(error);
  }
}

async function getOrderById(req, res, next) {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      restaurantId: req.restaurantId,
      branchId: req.branchId
    }).populate('tableId').populate('items.menuItemId');
    if (!order) throw createError('Order not found', 404);

    res.json({ success: true, data: order, message: 'Order fetched successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = { createOrder, getOrders, getOrderById };
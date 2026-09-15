const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const Table = require('../models/Table');
const Bill = require('../models/Bill');
const calculateOrderTotals = require('../utils/orderCalculations');
const getNextSequence = require('../utils/getNextSequence');

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
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
      const kotNumber = await getNextSequence({
        restaurantId: req.restaurantId,
        branchId: req.branchId,
        name: 'kot',
        dateKey: todayKey(),
        session
      });
      orderItems.forEach((item) => { item.kotNumber = kotNumber; });

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

async function addItemsToOrder(req, res, next) {
  const session = await mongoose.startSession();

  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      throw createError('At least one order item is required', 400);
    }

    const order = await Order.findOne({
      _id: req.params.id,
      restaurantId: req.restaurantId,
      branchId: req.branchId
    }).session(session);
    if (!order) throw createError('Order not found', 404);
    if (order.status !== 'open') throw createError('Only open orders can receive new items', 400);

    const menuItemIds = items.map((item) => item.menuItemId);
    if (menuItemIds.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
      throw createError('Each order item must reference a valid menu item', 400);
    }

    const menuItems = await MenuItem.find({
      _id: { $in: menuItemIds },
      restaurantId: req.restaurantId,
      branchId: req.branchId,
      isAvailable: true
    });
    const menuItemsById = new Map(menuItems.map((item) => [item._id.toString(), item]));
    const newItems = items.map((item) => {
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
        notes: item.notes,
        status: 'pending'
      };
    });

    await session.withTransaction(async () => {
      const kotNumber = await getNextSequence({
        restaurantId: req.restaurantId,
        branchId: req.branchId,
        name: 'kot',
        dateKey: todayKey(),
        session
      });
      newItems.forEach((item) => { item.kotNumber = kotNumber; });
      order.items.push(...newItems);
      const totals = calculateOrderTotals(order.items, order.discount);
      order.set(totals);
      await order.save({ session });
    });

    const io = req.app.get('io');
    if (io) io.to(`branch_${req.branchId}`).emit('new-kot', {
      orderId: order._id,
      kotNumber: newItems[0].kotNumber,
      newItems: order.items.slice(-newItems.length),
      order
    });

    res.json({ success: true, data: order, message: 'Items added to order successfully' });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
}

async function updateItemStatus(req, res, next) {
  try {
    const allowedStatuses = ['pending', 'preparing', 'ready', 'served'];
    const { status } = req.body;
    if (!allowedStatuses.includes(status)) {
      throw createError('Invalid item status', 400);
    }

    const order = await Order.findOne({
      _id: req.params.id,
      restaurantId: req.restaurantId,
      branchId: req.branchId
    });
    if (!order) throw createError('Order not found', 404);

    const item = order.items.id(req.params.itemId);
    if (!item) throw createError('Order item not found', 404);
    item.status = status;
    await order.save();

    const io = req.app.get('io');
    if (io) io.to(`branch_${req.branchId}`).emit('item-status-update', {
      orderId: order._id,
      itemId: item._id,
      newStatus: status
    });

    res.json({ success: true, data: order, message: 'Item status updated successfully' });
  } catch (error) {
    next(error);
  }
}

async function cancelItem(req, res, next) {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      restaurantId: req.restaurantId,
      branchId: req.branchId
    });
    if (!order) throw createError('Order not found', 404);

    const item = order.items.id(req.params.itemId);
    if (!item) throw createError('Order item not found', 404);
    if (item.status !== 'pending') {
      throw createError('Only pending items can be cancelled', 400);
    }

    item.status = 'cancelled';
    order.set(calculateOrderTotals(order.items, order.discount));
    await order.save();

    const io = req.app.get('io');
    if (io) io.to(`branch_${req.branchId}`).emit('item-cancelled', {
      orderId: order._id,
      itemId: item._id
    });

    res.json({ success: true, data: order, message: 'Item cancelled successfully' });
  } catch (error) {
    next(error);
  }
}

async function generateBill(req, res, next) {
  const session = await mongoose.startSession();

  try {
    const { paymentMode } = req.body;
    if (!['cash', 'card', 'upi'].includes(paymentMode)) {
      throw createError('A valid payment mode is required: cash, card, or upi', 400);
    }

    const discount = Number(req.body.discount) || 0;
    if (discount < 0) throw createError('Discount cannot be negative', 400);

    let order;
    let totals;
    let bill;
    await session.withTransaction(async () => {
      order = await Order.findOne({
        _id: req.params.id,
        restaurantId: req.restaurantId,
        branchId: req.branchId
      }).session(session);
      if (!order) throw createError('Order not found', 404);
      if (order.status !== 'open') throw createError('Only open orders can be billed', 400);

      if (!order.items.some((item) => item.status !== 'cancelled')) {
        throw createError('Cannot bill an order with no active items', 400);
      }

      totals = calculateOrderTotals(order.items, discount);
      order.set({ ...totals, discount, status: 'billed' });
      await order.save({ session });

      const billSequence = await getNextSequence({
        restaurantId: req.restaurantId,
        branchId: req.branchId,
        name: 'bill',
        dateKey: null,
        session
      });
      const billItems = order.items
        .filter((item) => item.status !== 'cancelled')
        .map((item) => {
          const modifierTotal = (item.selectedModifiers || []).reduce(
            (sum, modifier) => sum + (Number(modifier.priceDelta) || 0),
            0
          );
          return {
            name: item.name,
            qty: item.qty,
            price: item.price,
            lineTotal: (Number(item.price) + modifierTotal) * Number(item.qty)
          };
        });

      [bill] = await Bill.create([{
        orderId: order._id,
        billNumber: `INV-${String(billSequence).padStart(6, '0')}`,
        items: billItems,
        ...totals,
        paymentMode,
        customerPhone: order.customerPhone,
        billedBy: req.user._id,
        restaurantId: req.restaurantId,
        branchId: req.branchId
      }], { session });

      if (order.orderType === 'dine-in' && order.tableId) {
        await Table.updateOne(
          { _id: order.tableId, restaurantId: req.restaurantId, branchId: req.branchId },
          { $set: { status: 'free' } },
          { session }
        );
      }
    });

    res.json({
      success: true,
      data: { order, bill, breakdown: totals },
      message: 'Bill generated successfully'
    });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
}

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  addItemsToOrder,
  updateItemStatus,
  cancelItem,
  generateBill
};
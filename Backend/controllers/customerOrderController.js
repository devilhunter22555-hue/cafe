const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const Table = require('../models/Table');
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

async function snapshotItems(items, restaurantId, branchId, session) {
  if (!Array.isArray(items) || items.length === 0) {
    throw createError('At least one order item is required', 400);
  }
  if (items.some((item) => !mongoose.Types.ObjectId.isValid(item.menuItemId))) {
    throw createError('Each order item must reference a valid menu item', 400);
  }

  const menuItems = await MenuItem.find({
    _id: { $in: items.map((item) => item.menuItemId) },
    restaurantId,
    branchId,
    isAvailable: true
  }).session(session);
  const menuItemsById = new Map(menuItems.map((item) => [item._id.toString(), item]));

  return items.map((item) => {
    const menuItem = menuItemsById.get(item.menuItemId.toString());
    if (!menuItem) throw createError(`Menu item not found: ${item.menuItemId}`, 404);

    const qty = Number(item.qty);
    if (!Number.isInteger(qty) || qty <= 0) {
      throw createError('Item quantity must be a positive integer', 400);
    }

    return {
      menuItemId: menuItem._id,
      name: menuItem.name,
      price: menuItem.price,
      taxSlab: menuItem.taxSlab,
      qty,
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
}

async function placeOrder(req, res, next) {
  const session = await mongoose.startSession();

  try {
    const { restaurantId, branchId, tableId, phone } = req.customer;
    if (!mongoose.Types.ObjectId.isValid(tableId)) {
      throw createError('Customer table context is invalid', 400);
    }

    let order;
    let newItems;
    let isNewOrder = false;
    await session.withTransaction(async () => {
      const table = await Table.findOne({
        _id: tableId,
        restaurantId,
        branchId,
        isActive: true
      }).session(session);
      if (!table) throw createError('Table not found', 404);

      newItems = await snapshotItems(req.body.items, restaurantId, branchId, session);
      const kotNumber = await getNextSequence({
        restaurantId,
        branchId,
        name: 'kot',
        dateKey: todayKey(),
        session
      });
      newItems.forEach((item) => { item.kotNumber = kotNumber; });
      order = await Order.findOne({
        _id: { $exists: true },
        tableId,
        restaurantId,
        branchId,
        status: 'open'
      }).session(session);

      if (order) {
        order.items.push(...newItems);
        order.set(calculateOrderTotals(order.items, order.discount));
        await order.save({ session });
      } else {
        const totals = calculateOrderTotals(newItems);
        [order] = await Order.create([{
          orderType: 'dine-in',
          tableId,
          items: newItems,
          ...totals,
          source: 'customer',
          customerPhone: phone,
          createdBy: null,
          restaurantId,
          branchId
        }], { session });
        await Table.updateOne(
          { _id: tableId, restaurantId, branchId },
          { $set: { status: 'occupied' } },
          { session }
        );
        isNewOrder = true;
      }
    });

    const io = req.app.get('io');
    if (io) {
      if (isNewOrder) {
        io.to(`branch_${branchId}`).emit('new-order', order);
      } else {
        io.to(`branch_${branchId}`).emit('new-kot', {
          orderId: order._id,
          kotNumber: newItems[0].kotNumber,
          newItems: order.items.slice(-newItems.length),
          order
        });
      }
    }

    res.status(isNewOrder ? 201 : 200).json({
      success: true,
      data: order,
      message: isNewOrder ? 'Order placed successfully' : 'Items added to order successfully'
    });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
}

async function getMyOrderStatus(req, res, next) {
  try {
    const order = await Order.findOne({
      tableId: req.customer.tableId,
      restaurantId: req.customer.restaurantId,
      branchId: req.customer.branchId,
      status: 'open'
    }).sort({ createdAt: -1 });

    if (!order) {
      res.json({ success: true, data: null, message: 'No active order' });
      return;
    }

    res.json({ success: true, data: order, message: 'Order status fetched successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = { placeOrder, getMyOrderStatus };
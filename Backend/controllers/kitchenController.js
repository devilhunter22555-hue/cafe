const Order = require('../models/Order');

async function getKitchenOrders(req, res, next) {
  try {
    const orders = await Order.find({
      restaurantId: req.restaurantId,
      branchId: req.branchId,
      status: 'open',
      items: { $elemMatch: { status: { $in: ['pending', 'preparing'] } } }
    })
      .populate('tableId', 'tableNumber')
      .sort({ createdAt: 1 })
      .lean();

    const kitchenOrders = orders.map((order) => ({
      _id: order._id,
      tableNumber: order.tableId ? order.tableId.tableNumber : null,
      orderType: order.orderType,
      items: order.items.filter((item) => ['pending', 'preparing'].includes(item.status))
    }));

    res.json({
      success: true,
      data: kitchenOrders,
      message: 'Kitchen orders fetched successfully'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getKitchenOrders };
const Restaurant = require('../models/Restaurant');
const Branch = require('../models/Branch');
const User = require('../models/User');
const Bill = require('../models/Bill');
const Order = require('../models/Order');

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function getAllRestaurants(req, res, next) {
  try {
    const restaurants = await Restaurant.find()
      .populate('ownerId', 'name email')
      .lean();

    const enhanced = await Promise.all(restaurants.map(async (restaurant) => {
      const [branchCount, staffCount] = await Promise.all([
        Branch.countDocuments({ restaurantId: restaurant._id }),
        User.countDocuments({ restaurantId: restaurant._id, role: { $ne: 'owner' } })
      ]);

      return {
        ...restaurant,
        branchCount,
        staffCount,
        owner: restaurant.ownerId ? {
          id: restaurant.ownerId._id,
          name: restaurant.ownerId.name,
          email: restaurant.ownerId.email
        } : null
      };
    }));

    res.json({
      success: true,
      data: enhanced,
      message: 'Restaurants fetched successfully'
    });
  } catch (error) {
    next(error);
  }
}

async function getRestaurantDetails(req, res, next) {
  try {
    const { id } = req.params;
    const restaurant = await Restaurant.findById(id).populate('ownerId', 'name email').lean();
    if (!restaurant) throw createError('Restaurant not found', 404);

    const [branches, staffCount, orderStats, revenueStats] = await Promise.all([
      Branch.find({ restaurantId: id }).lean(),
      User.countDocuments({ restaurantId: id, role: { $ne: 'owner' } }),
      Order.aggregate([
        { $match: { restaurantId: restaurant._id } },
        { $group: { _id: null, totalOrders: { $sum: 1 } } }
      ]),
      Bill.aggregate([
        { $match: { restaurantId: restaurant._id } },
        { $group: { _id: null, totalRevenue: { $sum: '$total' } } }
      ])
    ]);

    const totalOrders = orderStats[0]?.totalOrders || 0;
    const totalRevenue = revenueStats[0]?.totalRevenue || 0;

    res.json({
      success: true,
      data: {
        ...restaurant,
        branches,
        staffCount,
        totalOrders,
        totalRevenue,
        owner: restaurant.ownerId ? {
          id: restaurant.ownerId._id,
          name: restaurant.ownerId.name,
          email: restaurant.ownerId.email
        } : null
      },
      message: 'Restaurant details fetched successfully'
    });
  } catch (error) {
    next(error);
  }
}

async function updateRestaurantStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') throw createError('isActive is required and must be a boolean', 400);

    const restaurant = await Restaurant.findByIdAndUpdate(id, { isActive }, { new: true });
    if (!restaurant) throw createError('Restaurant not found', 404);

    res.json({
      success: true,
      data: restaurant,
      message: isActive ? 'Restaurant reactivated successfully' : 'Restaurant suspended successfully'
    });
  } catch (error) {
    next(error);
  }
}

async function updateRestaurantPlan(req, res, next) {
  try {
    const { id } = req.params;
    const { plan } = req.body;
    const validPlans = ['trial', 'basic', 'pro'];
    if (!plan || !validPlans.includes(plan)) throw createError('Valid plan is required: trial, basic, pro', 400);

    const restaurant = await Restaurant.findByIdAndUpdate(id, { plan }, { new: true });
    if (!restaurant) throw createError('Restaurant not found', 404);

    res.json({
      success: true,
      data: restaurant,
      message: 'Restaurant plan updated successfully'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getAllRestaurants, getRestaurantDetails, updateRestaurantStatus, updateRestaurantPlan };

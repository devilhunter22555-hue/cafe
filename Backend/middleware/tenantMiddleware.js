const Restaurant = require('../models/Restaurant');
const User = require('../models/User');

async function tenantMiddleware(req, res, next) {
  try {
    if (!req.user || !req.user.restaurantId) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Tenant context missing'
      });
    }

    const restaurant = await Restaurant.findById(req.user.restaurantId)
      .select('isActive status')
      .lean();

    if (!restaurant || restaurant.isActive === false || restaurant.status === 'INACTIVE') {
      return res.status(403).json({
        success: false,
        data: null,
        message: 'This café account is currently inactive. Please contact the system administrator.'
      });
    }

    if (req.user.userId) {
      const activeUser = await User.findById(req.user.userId)
        .select('isActive restaurantId')
        .lean();

      if (!activeUser || activeUser.isActive === false) {
        return res.status(403).json({
          success: false,
          data: null,
          message: 'Your café account has been deactivated. Please contact the system administrator.'
        });
      }

      if (String(activeUser.restaurantId) !== String(req.user.restaurantId)) {
        return res.status(403).json({
          success: false,
          data: null,
          message: 'Forbidden: cross-tenant access denied'
        });
      }
    }

    req.restaurantId = req.user.restaurantId;
    req.cafeId = req.user.restaurantId;
    req.branchId = req.user.branchId;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = tenantMiddleware;

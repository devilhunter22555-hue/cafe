const jwt = require('jsonwebtoken');
const Restaurant = require('../models/Restaurant');

async function customerAuthMiddleware(req, res, next) {
  try {
    const authorization = req.headers.authorization;
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Customer authentication required'
      });
    }

    const decoded = jwt.verify(authorization.split(' ')[1], process.env.JWT_ACCESS_SECRET);

    if (decoded?.restaurantId) {
      const restaurant = await Restaurant.findById(decoded.restaurantId)
        .select('isActive status')
        .lean();
      if (!restaurant || restaurant.isActive === false || restaurant.status === 'INACTIVE') {
        return res.status(403).json({
          success: false,
          data: null,
          message: 'This café account is currently inactive. Please contact the system administrator.'
        });
      }
    }

    req.customer = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      data: null,
      message: 'Invalid or expired customer token'
    });
  }
}

module.exports = customerAuthMiddleware;

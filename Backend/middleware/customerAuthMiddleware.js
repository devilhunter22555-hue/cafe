const jwt = require('jsonwebtoken');

function customerAuthMiddleware(req, res, next) {
  try {
    const authorization = req.headers.authorization;
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Customer authentication required'
      });
    }

    req.customer = jwt.verify(authorization.split(' ')[1], process.env.JWT_ACCESS_SECRET);
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
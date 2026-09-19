const jwt = require('jsonwebtoken');

function superAdminMiddleware(req, res, next) {
  try {
    const authorization = req.headers.authorization;
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Authentication required'
      });
    }

    const token = authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.SUPER_ADMIN_JWT_SECRET);

    if (!decoded || decoded.isSuperAdmin !== true) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Invalid super admin token'
      });
    }

    req.superAdmin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      data: null,
      message: 'Invalid or expired super admin token'
    });
  }
}

module.exports = superAdminMiddleware;

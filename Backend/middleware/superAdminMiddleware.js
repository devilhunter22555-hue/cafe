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
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.SUPER_ADMIN_JWT_SECRET);
    } catch (verifyErr) {
      // Check if it was a valid regular user token trying to access super-admin routes
      if (process.env.JWT_ACCESS_SECRET) {
        try {
          const regularDecoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
          if (regularDecoded && regularDecoded.role !== 'SUPER_ADMIN') {
            return res.status(403).json({
              success: false,
              data: null,
              message: 'Forbidden: SUPER_ADMIN role required'
            });
          }
        } catch {
          // ignore
        }
      }
      throw verifyErr;
    }

    if (!decoded || (decoded.isSuperAdmin !== true && decoded.role !== 'SUPER_ADMIN')) {
      return res.status(403).json({
        success: false,
        data: null,
        message: 'Forbidden: SUPER_ADMIN role required'
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

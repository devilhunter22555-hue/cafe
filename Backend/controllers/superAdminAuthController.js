const jwt = require('jsonwebtoken');
const SuperAdmin = require('../models/SuperAdmin');

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw createError('email and password are required', 400);
    }

    const superAdmin = await SuperAdmin.findOne({ email: String(email).toLowerCase().trim() });
    if (!superAdmin) {
      throw createError('Invalid super admin credentials', 401);
    }

    const isPasswordValid = await superAdmin.comparePassword(password);
    if (!isPasswordValid) {
      throw createError('Invalid super admin credentials', 401);
    }

    if (superAdmin.isActive === false) {
      throw createError('Super admin account has been deactivated', 403);
    }

    const token = jwt.sign({
      superAdminId: superAdmin._id,
      isSuperAdmin: true
    }, process.env.SUPER_ADMIN_JWT_SECRET, { expiresIn: '8h' });

    res.json({
      success: true,
      data: {
        token,
        superAdmin: {
          id: superAdmin._id,
          name: superAdmin.name,
          email: superAdmin.email
        }
      },
      message: 'Super admin login successful'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { login };

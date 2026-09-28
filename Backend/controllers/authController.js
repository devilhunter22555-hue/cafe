const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Restaurant = require('../models/Restaurant');
const Branch = require('../models/Branch');
const User = require('../models/User');
const {
  generateAccessToken,
  generateRefreshToken
} = require('../utils/generateTokens');

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000
};

function publicUser(user) {
  return {
    id: user._id,
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    role: user.role,
    roleLabel: user.role === 'owner' ? 'ADMIN' : String(user.role || '').toUpperCase(),
    restaurantId: user.restaurantId,
    cafeId: user.restaurantId,
    branchId: user.branchId || null,
    lastLoginAt: user.lastLoginAt || null
  };
}

function authPayload(user) {
  return {
    userId: user._id,
    restaurantId: user.restaurantId,
    cafeId: user.restaurantId,
    branchId: user.branchId || null,
    role: user.role
  };
}

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function validatePassword(password) {
  if (typeof password !== 'string') return false;
  if (password.length < 8) return false;
  if (!/[A-Za-z]/.test(password)) return false;
  if (!/\d/.test(password)) return false;
  return true;
}

async function register(req, res, next) {
  return res.status(403).json({
    success: false,
    data: null,
    message: 'Public registration is disabled. Contact us to get started.'
  });

  let session;
  try {
    session = await mongoose.startSession();
    const { restaurantName, ownerName, email, password } = req.body;
    if (!restaurantName || !ownerName || !email || !password) {
      throw createError('restaurantName, ownerName, email, and password are required', 400);
    }
    if (!validatePassword(password)) {
      throw createError('Password must be at least 8 characters long and include at least one letter and one number', 400);
    }

    let createdUser;
    await session.withTransaction(async () => {
      const [restaurant] = await Restaurant.create([{ name: restaurantName }], { session });
      const [branch] = await Branch.create([
        { restaurantId: restaurant._id, name: 'Main Branch' }
      ], { session });
      [createdUser] = await User.create([{
        restaurantId: restaurant._id,
        branchId: branch._id,
        name: ownerName,
        email,
        password,
        role: 'owner'
      }], { session });
    });

    const accessToken = generateAccessToken(authPayload(createdUser));
    const refreshToken = generateRefreshToken(authPayload(createdUser));
    res.cookie('refreshToken', refreshToken, refreshCookieOptions);
    res.status(201).json({
      success: true,
      data: { user: publicUser(createdUser), accessToken },
      message: 'Registration successful'
    });
  } catch (error) {
    next(error);
  } finally {
    if (session) await session.endSession();
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw createError('email and password are required', 400);
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      throw createError('Invalid credentials', 401);
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw createError('Invalid credentials', 401);
    }

    if (user.isActive === false) {
      throw createError(
        'This admin/staff account is currently inactive. Please contact the system administrator.',
        403
      );
    }

    const restaurant = await Restaurant.findById(user.restaurantId);
    if (!restaurant || restaurant.isActive === false || restaurant.status === 'INACTIVE') {
      throw createError(
        'This café account is currently inactive. Please contact the system administrator.',
        403
      );
    }

    const now = new Date();
    user.lastLoginAt = now;
    await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: now } });

    const accessToken = generateAccessToken(authPayload(user));
    const refreshToken = generateRefreshToken(authPayload(user));
    res.cookie('refreshToken', refreshToken, refreshCookieOptions);
    res.json({
      success: true,
      data: { user: publicUser(user), accessToken },
      message: 'Login successful'
    });
  } catch (error) {
    next(error);
  }
}

async function refreshToken(req, res, next) {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      throw createError('Refresh token required', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw createError('User not found', 401);
    }

    if (user.isActive === false) {
      throw createError(
        'This admin/staff account is currently inactive. Please contact the system administrator.',
        403
      );
    }

    const restaurant = await Restaurant.findById(user.restaurantId);
    if (!restaurant || restaurant.isActive === false || restaurant.status === 'INACTIVE') {
      throw createError(
        'This café account is currently inactive. Please contact the system administrator.',
        403
      );
    }

    const accessToken = generateAccessToken(authPayload(user));
    res.json({
      success: true,
      data: { accessToken, user: publicUser(user) },
      message: 'Token refreshed'
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      error.statusCode = 401;
      error.message = 'Invalid or expired refresh token';
    }
    next(error);
  }
}

module.exports = { register, login, refreshToken };

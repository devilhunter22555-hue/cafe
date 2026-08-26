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
  maxAge: 7 * 24 * 60 * 60 * 1000
};

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    restaurantId: user.restaurantId,
    branchId: user.branchId || null
  };
}

function authPayload(user) {
  return {
    userId: user._id,
    restaurantId: user.restaurantId,
    branchId: user.branchId || null,
    role: user.role
  };
}

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function register(req, res, next) {
  let session;
  try {
    session = await mongoose.startSession();
    const { restaurantName, ownerName, email, password } = req.body;
    if (!restaurantName || !ownerName || !email || !password) {
      throw createError('restaurantName, ownerName, email, and password are required', 400);
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

    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.isActive || !(await user.comparePassword(password))) {
      throw createError('Invalid credentials', 401);
    }

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
    if (!user || !user.isActive) {
      throw createError('User not found or inactive', 401);
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

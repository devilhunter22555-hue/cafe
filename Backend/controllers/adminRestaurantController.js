const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant');
const Branch = require('../models/Branch');
const User = require('../models/User');
const Bill = require('../models/Bill');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');
const Category = require('../models/Category');
const SuperAdminAuditLog = require('../models/SuperAdminAuditLog');
const EmailVerificationOtp = require('../models/EmailVerificationOtp');
const { sendCafeWelcomeEmail, sendEmailVerificationOtp } = require('../utils/emailService');

const OTP_EXPIRY_MINUTES = 5;
const OTP_EXPIRY_MS = OTP_EXPIRY_MINUTES * 60 * 1000;
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const OTP_RESEND_COOLDOWN_MS = OTP_RESEND_COOLDOWN_SECONDS * 1000;
const OTP_MAX_ATTEMPTS = 5;
const VERIFIED_SESSION_TTL_MS = 30 * 60 * 1000;

function createError(message, statusCode, extras = {}) {
  const error = new Error(message);
  error.statusCode = statusCode;
  Object.assign(error, extras);
  return error;
}

function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

async function isEmailAlreadyRegistered(normalizedEmail) {
  if (!normalizedEmail) return false;
  const [existingUser, existingRestaurant] = await Promise.all([
    User.findOne({ email: normalizedEmail }).select('_id').lean(),
    Restaurant.findOne({ email: normalizedEmail }).select('_id').lean()
  ]);
  return Boolean(existingUser || existingRestaurant);
}

function validatePassword(password) {
  if (typeof password !== 'string') return false;
  if (password.length < 8) return false;
  if (!/[A-Za-z]/.test(password)) return false;
  if (!/\d/.test(password)) return false;
  return true;
}

// Case-insensitive exact match on café name (and city, when given).
// Uses a collation instead of a regex, so user input is never turned into a
// pattern and this file needs no regex-escaping code.
function findDuplicateCafe({ name, city, excludeId }) {
  const filter = { name };
  if (city) filter.city = city;
  if (excludeId) filter._id = { $ne: excludeId };
  return Restaurant.findOne(filter)
    .collation({ locale: 'en', strength: 2 })
    .lean();
}

async function logSuperAdminAction(req, { action, cafeId = null, cafeName = '', details = '' }) {
  try {
    await SuperAdminAuditLog.create({
      action,
      performedBy: req.superAdmin?.superAdminId || null,
      performedByEmail: req.superAdmin?.email || 'Super Admin',
      cafeId,
      cafeName,
      details
    });
  } catch (err) {
    console.warn('[AuditLog] Failed to record super admin action:', err.message);
  }
}

function formatAdminPublic(user) {
  if (!user) return null;
  return {
    id: user._id,
    _id: user._id,
    name: user.name,
    email: user.email,
    emailVerified: Boolean(user.emailVerified),
    emailVerifiedAt: user.emailVerifiedAt || null,
    phone: user.phone || '',
    role: user.role || 'owner',
    roleLabel: 'ADMIN',
    isActive: user.isActive !== false,
    status: user.isActive !== false ? 'ACTIVE' : 'INACTIVE',
    lastLoginAt: user.lastLoginAt || null,
    restaurantId: user.restaurantId,
    cafeId: user.restaurantId,
    branchId: user.branchId || null,
    createdAt: user.createdAt || null
  };
}

function formatCafeResponse(restaurant, extras = {}) {
  const isActive = restaurant.isActive !== false && restaurant.status !== 'INACTIVE';
  const status = isActive ? 'ACTIVE' : 'INACTIVE';
  return {
    ...restaurant,
    cafeId: restaurant._id,
    isActive,
    status,
    ...extras
  };
}

// ========================================================
// EMAIL VERIFICATION FLOW FOR CREATE CAFÉ (Super Admin Only)
// ========================================================

async function sendCafeEmailVerificationOtp(req, res, next) {
  try {
    const body = req.body || {};
    const rawEmail = body.email ?? body.adminEmail ?? body.ownerEmail ?? '';
    const email = String(rawEmail).trim().toLowerCase();
    const cafeName = String(body.cafeName || body.restaurantName || body.name || '').trim();
    const adminName = String(body.adminName || body.ownerName || '').trim();

    if (!email || !isValidEmail(email)) {
      throw createError('Please enter a valid email address.', 400);
    }

    // Check whether this email is already registered with any Café or User/Admin
    const alreadyRegistered = await isEmailAlreadyRegistered(email);
    if (alreadyRegistered) {
      throw createError(
        'This email is already associated with an existing café account.',
        409
      );
    }

    // Check 60-second resend cooldown on the most recent active OTP record
    const latestActive = await EmailVerificationOtp.findOne({
      email,
      invalidated: false,
      consumedAt: null
    })
      .sort({ createdAt: -1 })
      .lean();

    if (latestActive && latestActive.lastSentAt) {
      const elapsedMs = Date.now() - new Date(latestActive.lastSentAt).getTime();
      if (elapsedMs < OTP_RESEND_COOLDOWN_MS) {
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsedMs) / 1000)
        );
        return res.status(429).json({
          success: false,
          message: `Please wait ${retryAfterSeconds} seconds before requesting a new OTP.`,
          retryAfterSeconds
        });
      }
    }

    // Invalidate all previous OTP records for this email so old OTPs become invalid immediately
    await EmailVerificationOtp.updateMany(
      { email, invalidated: false },
      { $set: { invalidated: true } }
    );

    // Generate cryptographically random 6-digit OTP and hash with bcrypt (never store plain text)
    const otp = String(crypto.randomInt(100000, 1000000));
    const otpHash = await bcrypt.hash(otp, 10);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MS);

    const createdOtpDoc = await EmailVerificationOtp.create({
      email,
      otpHash,
      attempts: 0,
      maxAttempts: OTP_MAX_ATTEMPTS,
      verified: false,
      verifiedAt: null,
      verificationExpiresAt: null,
      invalidated: false,
      consumedAt: null,
      lastSentAt: now,
      expiresAt,
      createdBy: mongoose.Types.ObjectId.isValid(req.superAdmin?.superAdminId)
        ? req.superAdmin.superAdminId
        : null
    });

    const emailResult = await sendEmailVerificationOtp({
      email,
      otp,
      cafeName,
      adminName,
      expiresInMinutes: OTP_EXPIRY_MINUTES
    });

    if (!emailResult.sent) {
      createdOtpDoc.invalidated = true;
      await createdOtpDoc.save();
      throw createError(
        emailResult.error ||
          'Unable to send verification email. Please check your email service configuration.',
        502
      );
    }

    await logSuperAdminAction(req, {
      action: 'EMAIL_OTP_SENT',
      cafeName,
      details: `Sent 6-digit email verification OTP to ${email}`
    });

    // Never return the OTP in the API response
    res.status(200).json({
      success: true,
      data: {
        email,
        emailVerified: false,
        expiresInSeconds: OTP_EXPIRY_MINUTES * 60,
        resendCooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS
      },
      message: `OTP sent to ${email}`
    });
  } catch (error) {
    next(error);
  }
}

async function verifyCafeEmailOtp(req, res, next) {
  try {
    const body = req.body || {};
    const rawEmail = body.email ?? body.adminEmail ?? body.ownerEmail ?? '';
    const email = String(rawEmail).trim().toLowerCase();
    const otp = String(body.otp || '').trim();

    if (!email || !isValidEmail(email)) {
      throw createError('Please enter a valid email address.', 400);
    }

    if (!/^\d{6}$/.test(otp)) {
      throw createError('Please enter a valid 6-digit verification code.', 400);
    }

    const alreadyRegistered = await isEmailAlreadyRegistered(email);
    if (alreadyRegistered) {
      throw createError(
        'This email is already associated with an existing café account.',
        409
      );
    }

    const record = await EmailVerificationOtp.findOne({
      email,
      invalidated: false,
      consumedAt: null
    }).sort({ createdAt: -1 });

    if (!record) {
      const latestAny = await EmailVerificationOtp.findOne({
        email,
        consumedAt: null
      }).sort({ createdAt: -1 });

      if (latestAny && latestAny.attempts >= (latestAny.maxAttempts || OTP_MAX_ATTEMPTS)) {
        throw createError(
          'Maximum verification attempts (5) exceeded. Please request a new OTP.',
          429
        );
      }

      if (latestAny && new Date() > new Date(latestAny.expiresAt)) {
        throw createError(
          'Verification code has expired. Please request a new OTP.',
          400
        );
      }

      throw createError(
        'No active verification code found for this email. Please send a new OTP.',
        400
      );
    }

    if (record.verified) {
      return res.status(200).json({
        success: true,
        data: {
          email,
          emailVerified: true,
          verifiedAt: record.verifiedAt
        },
        message: 'Email verified successfully'
      });
    }

    if (record.attempts >= (record.maxAttempts || OTP_MAX_ATTEMPTS)) {
      record.invalidated = true;
      await record.save();
      throw createError(
        'Maximum verification attempts (5) exceeded. Please request a new OTP.',
        429
      );
    }

    if (new Date() > new Date(record.expiresAt)) {
      record.invalidated = true;
      await record.save();
      throw createError(
        'Verification code has expired. Please request a new OTP.',
        400
      );
    }

    const isMatch = await record.compareOtp(otp);
    if (!isMatch) {
      record.attempts += 1;
      const maxAllowed = record.maxAttempts || OTP_MAX_ATTEMPTS;
      const remainingAttempts = Math.max(0, maxAllowed - record.attempts);

      if (record.attempts >= maxAllowed) {
        record.invalidated = true;
        await record.save();
        throw createError(
          'Maximum verification attempts (5) exceeded. Please request a new OTP.',
          429
        );
      }

      await record.save();
      throw createError(
        `Invalid verification code. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.`,
        400
      );
    }

    const verifiedAt = new Date();
    record.verified = true;
    record.verifiedAt = verifiedAt;
    record.verificationExpiresAt = new Date(verifiedAt.getTime() + VERIFIED_SESSION_TTL_MS);
    await record.save();

    await logSuperAdminAction(req, {
      action: 'EMAIL_VERIFIED',
      details: `Verified café admin email ${email}`
    });

    res.status(200).json({
      success: true,
      data: {
        email,
        emailVerified: true,
        verifiedAt
      },
      message: 'Email verified successfully'
    });
  } catch (error) {
    next(error);
  }
}

async function createRestaurant(req, res, next) {
  let session;
  try {
    const body = req.body || {};

    // Support both new Create Café fields and legacy createRestaurant fields
    const cafeName = String(body.cafeName || body.restaurantName || body.name || '').trim();
    const logo = String(body.logo || '').trim();
    const ownerName = String(body.ownerName || body.adminName || '').trim();
    const adminName = String(body.adminName || body.ownerName || '').trim();
    const adminEmail = String(body.adminEmail || body.ownerEmail || body.email || '').toLowerCase().trim();
    const cafeEmail = String(body.email || body.cafeEmail || adminEmail || '').toLowerCase().trim();
    const phone = String(body.phone || body.adminPhone || '').trim();
    const adminPhone = String(body.adminPhone || body.phone || '').trim();
    const temporaryPassword = body.temporaryPassword || body.adminPassword || body.ownerPassword;
    const address = String(body.address || '').trim();
    const city = String(body.city || '').trim();
    const state = String(body.state || '').trim();
    const pincode = String(body.pincode || '').trim();
    const plan = String(body.plan || body.subscriptionPlan || 'trial').toLowerCase().trim();

    if (!cafeName || !ownerName || !adminName || !adminEmail || !temporaryPassword) {
      throw createError(
        'Café Name, Owner/Admin Name, Admin Email, and Temporary Password are required',
        400
      );
    }

    if (!isValidEmail(adminEmail)) {
      throw createError('Please provide a valid Admin Email address', 400);
    }

    if (cafeEmail && !isValidEmail(cafeEmail)) {
      throw createError('Please provide a valid Café Email address', 400);
    }

    const validPlans = ['trial', 'basic', 'pro'];
    if (!validPlans.includes(plan)) {
      throw createError('Valid plan is required: trial, basic, pro', 400);
    }

    if (!validatePassword(temporaryPassword)) {
      throw createError(
        'Password must be at least 8 characters long and include at least one letter and one number',
        400
      );
    }

    // Check duplicate admin/business email across User and Restaurant collections
    const emailAlreadyTaken = await isEmailAlreadyRegistered(adminEmail);
    if (emailAlreadyTaken) {
      throw createError(
        'This email is already associated with an existing café account.',
        409
      );
    }
    if (cafeEmail && cafeEmail !== adminEmail) {
      const cafeEmailTaken = await isEmailAlreadyRegistered(cafeEmail);
      if (cafeEmailTaken) {
        throw createError(
          'This email is already associated with an existing café account.',
          409
        );
      }
    }

    // Server-side Email Verification Check — NEVER trust client-supplied emailVerified: true
    const verifiedOtpRecord = await EmailVerificationOtp.findOne({
      email: adminEmail,
      verified: true,
      invalidated: false,
      consumedAt: null
    }).sort({ verifiedAt: -1 });

    if (
      !verifiedOtpRecord ||
      (verifiedOtpRecord.verificationExpiresAt &&
        new Date() > new Date(verifiedOtpRecord.verificationExpiresAt))
    ) {
      throw createError(
        'Email verification is required before creating a café account. Please verify the email address via OTP first.',
        400
      );
    }

    // Check duplicate café name (case-insensitive, scoped to the same city when given)
    const existingCafe = await findDuplicateCafe({ name: cafeName, city });
    if (existingCafe) {
      throw createError(
        city
          ? `A café named "${cafeName}" in ${city} already exists`
          : `A café named "${cafeName}" already exists`,
        409
      );
    }

    const rawSettings = body.settings || {};
    const cafeSettings = {
      currency: String(rawSettings.currency || body.currency || 'INR').trim(),
      currencySymbol: String(rawSettings.currencySymbol || body.currencySymbol || '₹').trim(),
      taxPercent: Number(rawSettings.taxPercent ?? body.taxPercent ?? 5),
      gstNumber: String(rawSettings.gstNumber || body.gstNumber || '').trim(),
      openingTime: String(rawSettings.openingTime || body.openingTime || '09:00').trim(),
      closingTime: String(rawSettings.closingTime || body.closingTime || '23:00').trim(),
      timezone: String(rawSettings.timezone || body.timezone || 'Asia/Kolkata').trim(),
      orderSettings: {
        allowDineIn: rawSettings.orderSettings?.allowDineIn ?? body.allowDineIn ?? true,
        allowTakeaway: rawSettings.orderSettings?.allowTakeaway ?? body.allowTakeaway ?? true,
        allowQrOrdering: rawSettings.orderSettings?.allowQrOrdering ?? body.allowQrOrdering ?? true
      }
    };

    const verifiedTimestamp = verifiedOtpRecord.verifiedAt || new Date();

    session = await mongoose.startSession();
    let createdRestaurant;
    let createdBranch;
    let createdUser;

    await session.withTransaction(async () => {
      [createdRestaurant] = await Restaurant.create([
        {
          name: cafeName,
          logo,
          ownerName,
          email: cafeEmail,
          emailVerified: true,
          emailVerifiedAt: verifiedTimestamp,
          phone,
          address,
          city,
          state,
          pincode,
          plan,
          isActive: true,
          status: 'ACTIVE',
          settings: cafeSettings
        }
      ], { session });

      [createdBranch] = await Branch.create([
        {
          restaurantId: createdRestaurant._id,
          name: 'Main Branch',
          address: [address, city, state, pincode].filter(Boolean).join(', '),
          gstNumber: cafeSettings.gstNumber,
          timezone: cafeSettings.timezone || 'Asia/Kolkata',
          isActive: true
        }
      ], { session });

      [createdUser] = await User.create([{
        restaurantId: createdRestaurant._id,
        branchId: createdBranch._id,
        name: adminName,
        email: adminEmail,
        emailVerified: true,
        emailVerifiedAt: verifiedTimestamp,
        phone: adminPhone,
        password: temporaryPassword,
        role: 'owner',
        isActive: true
      }], { session });

      createdRestaurant.ownerId = createdUser._id;
      await createdRestaurant.save({ session });
    });

    // Consume the verified OTP session so it cannot be replayed
    verifiedOtpRecord.consumedAt = new Date();
    verifiedOtpRecord.invalidated = true;
    await verifiedOtpRecord.save();

    const ownerInfo = formatAdminPublic(createdUser);
    const restaurantData = formatCafeResponse(createdRestaurant.toObject(), {
      emailVerified: true,
      emailVerifiedAt: verifiedTimestamp,
      owner: ownerInfo,
      admin: ownerInfo,
      branchCount: 1,
      staffCount: 0,
      adminCount: 1,
      totalOrders: 0,
      totalRevenue: 0,
      totalCustomers: 0,
      menuItemCount: 0
    });

    await logSuperAdminAction(req, {
      action: 'CAFE_CREATED',
      cafeId: createdRestaurant._id,
      cafeName: createdRestaurant.name,
      details: `Created café "${createdRestaurant.name}" with verified admin ${adminEmail} (${plan.toUpperCase()} plan)`
    });

    // Optional non-blocking welcome email
    sendCafeWelcomeEmail({
      cafeName: createdRestaurant.name,
      adminName: createdUser.name,
      adminEmail: createdUser.email
    }).catch(() => null);

    res.status(201).json({
      success: true,
      data: {
        ...restaurantData,
        cafe: restaurantData,
        restaurant: restaurantData,
        owner: ownerInfo,
        admin: ownerInfo,
        branch: createdBranch.toObject()
      },
      message: 'Café and Admin account created successfully'
    });
  } catch (error) {
    next(error);
  } finally {
    if (session) await session.endSession();
  }
}

async function getAllRestaurants(req, res, next) {
  try {
    const restaurants = await Restaurant.find()
      .populate('ownerId', 'name email phone role isActive lastLoginAt createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const [
      branchCounts,
      userCounts,
      orderCounts,
      billSums,
      customerCounts,
      menuCounts
    ] = await Promise.all([
      Branch.aggregate([
        { $group: { _id: '$restaurantId', count: { $sum: 1 } } }
      ]),
      User.aggregate([
        {
          $group: {
            _id: '$restaurantId',
            adminCount: { $sum: { $cond: [{ $eq: ['$role', 'owner'] }, 1, 0] } },
            staffCount: { $sum: { $cond: [{ $ne: ['$role', 'owner'] }, 1, 0] } }
          }
        }
      ]),
      Order.aggregate([
        { $group: { _id: '$restaurantId', totalOrders: { $sum: 1 } } }
      ]),
      Bill.aggregate([
        { $group: { _id: '$restaurantId', totalRevenue: { $sum: '$total' } } }
      ]),
      Customer.aggregate([
        { $group: { _id: '$restaurantId', totalCustomers: { $sum: 1 } } }
      ]),
      MenuItem.aggregate([
        { $group: { _id: '$restaurantId', menuItemCount: { $sum: 1 } } }
      ])
    ]);

    const branchMap = new Map(branchCounts.map((r) => [String(r._id), r.count]));
    const userMap = new Map(userCounts.map((r) => [String(r._id), r]));
    const orderMap = new Map(orderCounts.map((r) => [String(r._id), r.totalOrders]));
    const billMap = new Map(billSums.map((r) => [String(r._id), r.totalRevenue]));
    const customerMap = new Map(customerCounts.map((r) => [String(r._id), r.totalCustomers]));
    const menuMap = new Map(menuCounts.map((r) => [String(r._id), r.menuItemCount]));

    // Lookup fallback owner user if restaurant.ownerId wasn't populated
    const missingOwnerRestaurantIds = restaurants
      .filter((r) => !r.ownerId)
      .map((r) => r._id);
    const fallbackOwners = missingOwnerRestaurantIds.length > 0
      ? await User.find({
          restaurantId: { $in: missingOwnerRestaurantIds },
          role: 'owner'
        })
          .select('name email phone role isActive lastLoginAt restaurantId createdAt')
          .lean()
      : [];
    const fallbackOwnerMap = new Map(
      fallbackOwners.map((u) => [String(u.restaurantId), u])
    );

    const enhanced = restaurants.map((restaurant) => {
      const idStr = String(restaurant._id);
      const uStats = userMap.get(idStr) || { adminCount: 0, staffCount: 0 };
      const rawOwner = restaurant.ownerId || fallbackOwnerMap.get(idStr) || null;
      const ownerObj = rawOwner ? formatAdminPublic(rawOwner) : null;

      return formatCafeResponse(restaurant, {
        ownerName: restaurant.ownerName || ownerObj?.name || '',
        email: restaurant.email || ownerObj?.email || '',
        phone: restaurant.phone || ownerObj?.phone || '',
        branchCount: branchMap.get(idStr) || 0,
        staffCount: uStats.staffCount || 0,
        adminCount: uStats.adminCount || (ownerObj ? 1 : 0),
        totalOrders: orderMap.get(idStr) || 0,
        totalRevenue: billMap.get(idStr) || 0,
        totalCustomers: customerMap.get(idStr) || 0,
        menuItemCount: menuMap.get(idStr) || 0,
        owner: ownerObj,
        admin: ownerObj
      });
    });

    const summary = {
      totalCafes: enhanced.length,
      activeCafes: enhanced.filter((r) => r.isActive).length,
      inactiveCafes: enhanced.filter((r) => !r.isActive).length,
      totalCafeAdmins: enhanced.reduce((sum, r) => sum + (Number(r.adminCount) || 0), 0),
      totalStaff: enhanced.reduce((sum, r) => sum + (Number(r.staffCount) || 0), 0),
      totalOrders: enhanced.reduce((sum, r) => sum + (Number(r.totalOrders) || 0), 0),
      totalRevenue: enhanced.reduce((sum, r) => sum + (Number(r.totalRevenue) || 0), 0),
      totalCustomers: enhanced.reduce((sum, r) => sum + (Number(r.totalCustomers) || 0), 0)
    };

    res.json({
      success: true,
      data: enhanced,
      summary,
      message: 'Cafés fetched successfully'
    });
  } catch (error) {
    next(error);
  }
}

async function getRestaurantDetails(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createError('Valid café ID is required', 400);
    }

    const restaurant = await Restaurant.findById(id)
      .populate('ownerId', 'name email phone role isActive lastLoginAt createdAt')
      .lean();
    if (!restaurant) throw createError('Café not found', 404);

    const [
      branches,
      allUsers,
      orderStats,
      revenueStats,
      customerCount,
      menuItemCount,
      tableCount,
      auditLogs
    ] = await Promise.all([
      Branch.find({ restaurantId: id }).lean(),
      User.find({ restaurantId: id })
        .select('name email phone role isActive lastLoginAt branchId createdAt')
        .sort({ createdAt: 1 })
        .lean(),
      Order.aggregate([
        { $match: { restaurantId: restaurant._id } },
        { $group: { _id: null, totalOrders: { $sum: 1 } } }
      ]),
      Bill.aggregate([
        { $match: { restaurantId: restaurant._id } },
        { $group: { _id: null, totalRevenue: { $sum: '$total' } } }
      ]),
      Customer.countDocuments({ restaurantId: restaurant._id }),
      MenuItem.countDocuments({ restaurantId: restaurant._id }),
      Table.countDocuments({ restaurantId: restaurant._id }),
      SuperAdminAuditLog.find({ cafeId: restaurant._id })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean()
    ]);

    const admins = allUsers.filter((u) => u.role === 'owner').map(formatAdminPublic);
    const staffMembers = allUsers.filter((u) => u.role !== 'owner');
    const primaryAdmin = restaurant.ownerId
      ? formatAdminPublic(restaurant.ownerId)
      : admins[0] || null;

    const totalOrders = orderStats[0]?.totalOrders || 0;
    const totalRevenue = revenueStats[0]?.totalRevenue || 0;

    const data = formatCafeResponse(restaurant, {
      ownerName: restaurant.ownerName || primaryAdmin?.name || '',
      email: restaurant.email || primaryAdmin?.email || '',
      phone: restaurant.phone || primaryAdmin?.phone || '',
      branches,
      branchCount: branches.length,
      staffCount: staffMembers.length,
      adminCount: admins.length,
      staff: staffMembers,
      admins,
      totalOrders,
      totalRevenue,
      totalCustomers: customerCount,
      menuItemCount,
      tableCount,
      owner: primaryAdmin,
      admin: primaryAdmin,
      auditLogs
    });

    res.json({
      success: true,
      data,
      message: 'Café details fetched successfully'
    });
  } catch (error) {
    next(error);
  }
}

async function updateRestaurant(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createError('Valid café ID is required', 400);
    }

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) throw createError('Café not found', 404);

    const body = req.body || {};
    const nextName = body.cafeName ?? body.restaurantName ?? body.name;

    if (nextName !== undefined) {
      const trimmedName = String(nextName).trim();
      if (!trimmedName) throw createError('Café Name cannot be empty', 400);

      const nextCity = body.city !== undefined ? String(body.city).trim() : restaurant.city;
      const duplicate = await findDuplicateCafe({
        name: trimmedName,
        city: nextCity,
        excludeId: restaurant._id
      });
      if (duplicate) {
        throw createError(`Another café named "${trimmedName}" already exists`, 409);
      }
      restaurant.name = trimmedName;
    }

    if (body.logo !== undefined) restaurant.logo = String(body.logo).trim();
    if (body.ownerName !== undefined) restaurant.ownerName = String(body.ownerName).trim();
    if (body.phone !== undefined) restaurant.phone = String(body.phone).trim();
    if (body.email !== undefined) {
      const trimmedEmail = String(body.email).toLowerCase().trim();
      if (trimmedEmail && !isValidEmail(trimmedEmail)) {
        throw createError('Please provide a valid Café Email address', 400);
      }
      restaurant.email = trimmedEmail;
    }
    if (body.address !== undefined) restaurant.address = String(body.address).trim();
    if (body.city !== undefined) restaurant.city = String(body.city).trim();
    if (body.state !== undefined) restaurant.state = String(body.state).trim();
    if (body.pincode !== undefined) restaurant.pincode = String(body.pincode).trim();

    if (body.plan !== undefined) {
      const validPlans = ['trial', 'basic', 'pro'];
      if (!validPlans.includes(body.plan)) {
        throw createError('Valid plan is required: trial, basic, pro', 400);
      }
      restaurant.plan = body.plan;
    }

    const rawSettings = body.settings || {};
    const currentSettings = restaurant.settings ? restaurant.settings.toObject?.() || restaurant.settings : {};
    restaurant.settings = {
      currency: String(rawSettings.currency ?? body.currency ?? currentSettings.currency ?? 'INR').trim(),
      currencySymbol: String(rawSettings.currencySymbol ?? body.currencySymbol ?? currentSettings.currencySymbol ?? '₹').trim(),
      taxPercent: Number(rawSettings.taxPercent ?? body.taxPercent ?? currentSettings.taxPercent ?? 5),
      gstNumber: String(rawSettings.gstNumber ?? body.gstNumber ?? currentSettings.gstNumber ?? '').trim(),
      openingTime: String(rawSettings.openingTime ?? body.openingTime ?? currentSettings.openingTime ?? '09:00').trim(),
      closingTime: String(rawSettings.closingTime ?? body.closingTime ?? currentSettings.closingTime ?? '23:00').trim(),
      timezone: String(rawSettings.timezone ?? body.timezone ?? currentSettings.timezone ?? 'Asia/Kolkata').trim(),
      orderSettings: {
        allowDineIn:
          rawSettings.orderSettings?.allowDineIn ??
          body.allowDineIn ??
          currentSettings.orderSettings?.allowDineIn ??
          true,
        allowTakeaway:
          rawSettings.orderSettings?.allowTakeaway ??
          body.allowTakeaway ??
          currentSettings.orderSettings?.allowTakeaway ??
          true,
        allowQrOrdering:
          rawSettings.orderSettings?.allowQrOrdering ??
          body.allowQrOrdering ??
          currentSettings.orderSettings?.allowQrOrdering ??
          true
      }
    };

    await restaurant.save();

    // Keep Main Branch address / GST / timezone synced
    await Branch.findOneAndUpdate(
      { restaurantId: restaurant._id },
      {
        $set: {
          address: [restaurant.address, restaurant.city, restaurant.state, restaurant.pincode]
            .filter(Boolean)
            .join(', '),
          gstNumber: restaurant.settings.gstNumber,
          timezone: restaurant.settings.timezone || 'Asia/Kolkata'
        }
      },
      { sort: { createdAt: 1 } }
    );

    await logSuperAdminAction(req, {
      action: 'CAFE_UPDATED',
      cafeId: restaurant._id,
      cafeName: restaurant.name,
      details: `Updated café profile & settings for "${restaurant.name}"`
    });

    const populated = await Restaurant.findById(restaurant._id)
      .populate('ownerId', 'name email phone role isActive lastLoginAt createdAt')
      .lean();
    const ownerObj = populated.ownerId ? formatAdminPublic(populated.ownerId) : null;

    res.json({
      success: true,
      data: formatCafeResponse(populated, { owner: ownerObj, admin: ownerObj }),
      message: 'Café updated successfully'
    });
  } catch (error) {
    next(error);
  }
}

async function updateRestaurantStatus(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createError('Valid café ID is required', 400);
    }

    let nextIsActive;
    if (typeof req.body.isActive === 'boolean') {
      nextIsActive = req.body.isActive;
    } else if (typeof req.body.status === 'string') {
      const upper = req.body.status.trim().toUpperCase();
      if (upper !== 'ACTIVE' && upper !== 'INACTIVE') {
        throw createError('status must be ACTIVE or INACTIVE', 400);
      }
      nextIsActive = upper === 'ACTIVE';
    } else {
      throw createError('isActive (boolean) or status (ACTIVE/INACTIVE) is required', 400);
    }

    const nextStatus = nextIsActive ? 'ACTIVE' : 'INACTIVE';
    const restaurant = await Restaurant.findByIdAndUpdate(
      id,
      { isActive: nextIsActive, status: nextStatus },
      { new: true }
    )
      .populate('ownerId', 'name email phone role isActive lastLoginAt createdAt')
      .lean();

    if (!restaurant) throw createError('Café not found', 404);

    await logSuperAdminAction(req, {
      action: nextIsActive ? 'CAFE_ACTIVATED' : 'CAFE_DEACTIVATED',
      cafeId: restaurant._id,
      cafeName: restaurant.name,
      details: `${nextIsActive ? 'Activated' : 'Deactivated'} café "${restaurant.name}"`
    });

    const ownerObj = restaurant.ownerId ? formatAdminPublic(restaurant.ownerId) : null;
    res.json({
      success: true,
      data: formatCafeResponse(restaurant, { owner: ownerObj, admin: ownerObj }),
      message: nextIsActive
        ? 'Café activated successfully'
        : 'Café deactivated successfully'
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
    if (!plan || !validPlans.includes(plan)) {
      throw createError('Valid plan is required: trial, basic, pro', 400);
    }

    const restaurant = await Restaurant.findByIdAndUpdate(id, { plan }, { new: true })
      .populate('ownerId', 'name email phone role isActive lastLoginAt createdAt')
      .lean();
    if (!restaurant) throw createError('Café not found', 404);

    await logSuperAdminAction(req, {
      action: 'CAFE_PLAN_UPDATED',
      cafeId: restaurant._id,
      cafeName: restaurant.name,
      details: `Updated subscription plan for "${restaurant.name}" to ${plan.toUpperCase()}`
    });

    const ownerObj = restaurant.ownerId ? formatAdminPublic(restaurant.ownerId) : null;
    res.json({
      success: true,
      data: formatCafeResponse(restaurant, { owner: ownerObj, admin: ownerObj }),
      message: 'Café subscription plan updated successfully'
    });
  } catch (error) {
    next(error);
  }
}

async function deleteRestaurant(req, res, next) {
  let session;
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createError('Valid café ID is required', 400);
    }

    const restaurant = await Restaurant.findById(id).lean();
    if (!restaurant) throw createError('Café not found', 404);

    session = await mongoose.startSession();
    await session.withTransaction(async () => {
      // Operations inside a transaction must run one after another —
      // running them in parallel on the same session is not supported.
      const tenantModels = [Order, Bill, MenuItem, Category, Table, Customer, User, Branch];
      for (const Model of tenantModels) {
        await Model.deleteMany({ restaurantId: restaurant._id }).session(session);
      }
      await Restaurant.deleteOne({ _id: restaurant._id }).session(session);
    });

    await logSuperAdminAction(req, {
      action: 'CAFE_DELETED',
      cafeId: restaurant._id,
      cafeName: restaurant.name,
      details: `Deleted café "${restaurant.name}" and its associated tenant records`
    });

    res.json({
      success: true,
      data: { id: restaurant._id, name: restaurant.name },
      message: `Café "${restaurant.name}" deleted successfully`
    });
  } catch (error) {
    next(error);
  } finally {
    if (session) await session.endSession();
  }
}

// ========================================================
// CAFÉ ADMIN MANAGEMENT (Edit, Activate/Deactivate, Reset Password, List All)
// ========================================================

async function getAllCafeAdmins(req, res, next) {
  try {
    const admins = await User.find({ role: 'owner' })
      .populate('restaurantId', 'name logo city state phone email plan isActive status createdAt')
      .select('name email phone role isActive lastLoginAt restaurantId branchId createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const formatted = admins.map((u) => {
      const cafe = u.restaurantId && typeof u.restaurantId === 'object' ? u.restaurantId : null;
      return {
        ...formatAdminPublic({
          ...u,
          restaurantId: cafe ? cafe._id : u.restaurantId
        }),
        cafe: cafe
          ? {
              _id: cafe._id,
              cafeId: cafe._id,
              name: cafe.name,
              logo: cafe.logo || '',
              city: cafe.city || '',
              state: cafe.state || '',
              phone: cafe.phone || '',
              email: cafe.email || '',
              plan: cafe.plan || 'trial',
              isActive: cafe.isActive !== false && cafe.status !== 'INACTIVE',
              status: cafe.isActive !== false && cafe.status !== 'INACTIVE' ? 'ACTIVE' : 'INACTIVE'
            }
          : null
      };
    });

    res.json({
      success: true,
      data: formatted,
      message: 'Café admins fetched successfully'
    });
  } catch (error) {
    next(error);
  }
}

async function resolveTargetAdmin(req) {
  const { id, adminId } = req.params;
  if (adminId) {
    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      throw createError('Valid admin ID is required', 400);
    }
    const admin = await User.findById(adminId);
    if (!admin) throw createError('Café Admin not found', 404);
    const cafe = await Restaurant.findById(admin.restaurantId);
    return { admin, cafe };
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createError('Valid café ID is required', 400);
  }
  const cafe = await Restaurant.findById(id);
  if (!cafe) {
    const directAdmin = await User.findById(id);
    if (directAdmin) {
      const adminCafe = await Restaurant.findById(directAdmin.restaurantId);
      return { admin: directAdmin, cafe: adminCafe };
    }
    throw createError('Café not found', 404);
  }

  let admin = null;
  if (cafe.ownerId) {
    admin = await User.findById(cafe.ownerId);
  }
  if (!admin) {
    admin = await User.findOne({ restaurantId: cafe._id, role: 'owner' });
  }
  if (!admin) throw createError('Café Admin account not found for this café', 404);

  return { admin, cafe };
}

async function updateCafeAdmin(req, res, next) {
  try {
    const { admin, cafe } = await resolveTargetAdmin(req);
    const { name, email, phone } = req.body || {};

    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (!trimmedName) throw createError('Admin name cannot be empty', 400);
      admin.name = trimmedName;
    }

    if (email !== undefined) {
      const normalizedEmail = String(email).toLowerCase().trim();
      if (!isValidEmail(normalizedEmail)) {
        throw createError('Please provide a valid Admin Email address', 400);
      }
      const existing = await User.findOne({
        _id: { $ne: admin._id },
        email: normalizedEmail
      }).lean();
      if (existing) {
        throw createError('Another user with this email already exists', 409);
      }
      admin.email = normalizedEmail;
    }

    if (phone !== undefined) {
      admin.phone = String(phone).trim();
    }

    await admin.save();

    if (cafe && name !== undefined && !cafe.ownerName) {
      cafe.ownerName = admin.name;
      await cafe.save();
    }

    await logSuperAdminAction(req, {
      action: 'ADMIN_UPDATED',
      cafeId: cafe?._id || admin.restaurantId,
      cafeName: cafe?.name || '',
      details: `Updated admin account ${admin.email}`
    });

    res.json({
      success: true,
      data: formatAdminPublic(admin),
      message: 'Café Admin updated successfully'
    });
  } catch (error) {
    next(error);
  }
}

async function updateCafeAdminStatus(req, res, next) {
  try {
    const { admin, cafe } = await resolveTargetAdmin(req);
    let nextIsActive;
    if (typeof req.body.isActive === 'boolean') {
      nextIsActive = req.body.isActive;
    } else if (typeof req.body.status === 'string') {
      nextIsActive = req.body.status.trim().toUpperCase() === 'ACTIVE';
    } else {
      throw createError('isActive (boolean) or status (ACTIVE/INACTIVE) is required', 400);
    }

    admin.isActive = nextIsActive;
    await admin.save();

    await logSuperAdminAction(req, {
      action: nextIsActive ? 'ADMIN_ACTIVATED' : 'ADMIN_DEACTIVATED',
      cafeId: cafe?._id || admin.restaurantId,
      cafeName: cafe?.name || '',
      details: `${nextIsActive ? 'Activated' : 'Deactivated'} admin account ${admin.email}`
    });

    res.json({
      success: true,
      data: formatAdminPublic(admin),
      message: nextIsActive
        ? 'Café Admin activated successfully'
        : 'Café Admin deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
}

async function resetCafeAdminPassword(req, res, next) {
  try {
    const { admin, cafe } = await resolveTargetAdmin(req);
    const newPassword = req.body?.newPassword || req.body?.temporaryPassword || req.body?.password;

    if (!validatePassword(newPassword)) {
      throw createError(
        'New password must be at least 8 characters long and include at least one letter and one number',
        400
      );
    }

    // Setting admin.password triggers the User schema pre('save') bcrypt hash hook
    admin.password = newPassword;
    await admin.save();

    await logSuperAdminAction(req, {
      action: 'ADMIN_PASSWORD_RESET',
      cafeId: cafe?._id || admin.restaurantId,
      cafeName: cafe?.name || '',
      details: `Reset password for café admin ${admin.email}`
    });

    res.json({
      success: true,
      data: formatAdminPublic(admin),
      message: `Password reset successfully for ${admin.email}`
    });
  } catch (error) {
    next(error);
  }
}

// ========================================================
// SUPER ADMIN REPORTING (Per-Café Orders, Revenue, Customers by Date Range)
// ========================================================

function computeISTDateRange(rangeKey = '30d') {
  const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
  const now = new Date();
  const istNow = new Date(now.getTime() + IST_OFFSET_MS);
  const year = istNow.getUTCFullYear();
  const month = istNow.getUTCMonth();
  const day = istNow.getUTCDate();

  const endDate = now;
  let startDate;

  const normalized = String(rangeKey || '30d').toLowerCase();
  if (normalized === 'today') {
    startDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0) - IST_OFFSET_MS);
  } else if (normalized === '7d' || normalized === '7days') {
    startDate = new Date(Date.UTC(year, month, day - 6, 0, 0, 0, 0) - IST_OFFSET_MS);
  } else if (normalized === 'month' || normalized === 'thismonth') {
    startDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0) - IST_OFFSET_MS);
  } else if (normalized === 'all') {
    startDate = new Date(0);
  } else {
    // Default 30 days
    startDate = new Date(Date.UTC(year, month, day - 29, 0, 0, 0, 0) - IST_OFFSET_MS);
  }

  return { range: normalized, startDate, endDate };
}

async function getSuperAdminPerformanceReport(req, res, next) {
  try {
    const { range, startDate, endDate } = computeISTDateRange(req.query.range || '30d');
    const dateMatch = { createdAt: { $gte: startDate, $lte: endDate } };

    const [
      restaurants,
      orderAgg,
      billAgg,
      customerAgg,
      allTimeCustomerAgg,
      menuAgg,
      staffAgg
    ] = await Promise.all([
      Restaurant.find()
        .populate('ownerId', 'name email phone')
        .sort({ createdAt: -1 })
        .lean(),
      Order.aggregate([
        { $match: dateMatch },
        {
          $group: {
            _id: '$restaurantId',
            orders: { $sum: 1 },
            completedOrders: { $sum: { $cond: [{ $eq: ['$status', 'billed'] }, 1, 0] } },
            cancelledOrders: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
          }
        }
      ]),
      Bill.aggregate([
        { $match: dateMatch },
        {
          $group: {
            _id: '$restaurantId',
            revenue: { $sum: '$total' },
            billsCount: { $sum: 1 },
            cash: { $sum: { $cond: [{ $eq: ['$paymentMode', 'cash'] }, '$total', 0] } },
            upi: { $sum: { $cond: [{ $eq: ['$paymentMode', 'upi'] }, '$total', 0] } },
            card: { $sum: { $cond: [{ $eq: ['$paymentMode', 'card'] }, '$total', 0] } }
          }
        }
      ]),
      Customer.aggregate([
        {
          $match: {
            $or: [
              { createdAt: { $gte: startDate, $lte: endDate } },
              { lastVisitAt: { $gte: startDate, $lte: endDate } }
            ]
          }
        },
        { $group: { _id: '$restaurantId', activeCustomers: { $sum: 1 } } }
      ]),
      Customer.aggregate([
        { $group: { _id: '$restaurantId', totalCustomers: { $sum: 1 } } }
      ]),
      MenuItem.aggregate([
        { $group: { _id: '$restaurantId', menuItems: { $sum: 1 } } }
      ]),
      User.aggregate([
        { $group: { _id: '$restaurantId', staffCount: { $sum: { $cond: [{ $ne: ['$role', 'owner'] }, 1, 0] } } } }
      ])
    ]);

    const orderMap = new Map(orderAgg.map((r) => [String(r._id), r]));
    const billMap = new Map(billAgg.map((r) => [String(r._id), r]));
    const activeCustMap = new Map(customerAgg.map((r) => [String(r._id), r.activeCustomers]));
    const totalCustMap = new Map(allTimeCustomerAgg.map((r) => [String(r._id), r.totalCustomers]));
    const menuMap = new Map(menuAgg.map((r) => [String(r._id), r.menuItems]));
    const staffMap = new Map(staffAgg.map((r) => [String(r._id), r.staffCount]));

    const cafeBreakdown = restaurants.map((r) => {
      const idStr = String(r._id);
      const oStats = orderMap.get(idStr) || { orders: 0, completedOrders: 0, cancelledOrders: 0 };
      const bStats = billMap.get(idStr) || { revenue: 0, billsCount: 0, cash: 0, upi: 0, card: 0 };
      const periodCustomers = activeCustMap.get(idStr) || 0;
      const totalCustomers = totalCustMap.get(idStr) || 0;
      const customersCount = range === 'all' ? totalCustomers : periodCustomers || totalCustomers;
      const avgOrderValue = bStats.billsCount > 0 ? bStats.revenue / bStats.billsCount : 0;
      const isActive = r.isActive !== false && r.status !== 'INACTIVE';

      return {
        _id: r._id,
        cafeId: r._id,
        name: r.name,
        logo: r.logo || '',
        city: r.city || '',
        plan: r.plan || 'trial',
        isActive,
        status: isActive ? 'ACTIVE' : 'INACTIVE',
        ownerName: r.ownerName || r.ownerId?.name || '',
        ownerEmail: r.email || r.ownerId?.email || '',
        orders: oStats.orders,
        completedOrders: bStats.billsCount || oStats.completedOrders,
        cancelledOrders: oStats.cancelledOrders,
        revenue: bStats.revenue,
        avgOrderValue,
        paymentBreakdown: {
          cash: bStats.cash,
          upi: bStats.upi,
          card: bStats.card
        },
        customers: customersCount,
        totalCustomers,
        menuItems: menuMap.get(idStr) || 0,
        staffCount: staffMap.get(idStr) || 0
      };
    });

    cafeBreakdown.sort((a, b) => b.revenue - a.revenue || b.orders - a.orders);

    const totals = {
      totalCafes: cafeBreakdown.length,
      activeCafes: cafeBreakdown.filter((c) => c.isActive).length,
      inactiveCafes: cafeBreakdown.filter((c) => !c.isActive).length,
      totalOrders: cafeBreakdown.reduce((sum, c) => sum + c.orders, 0),
      totalRevenue: cafeBreakdown.reduce((sum, c) => sum + c.revenue, 0),
      totalCustomers: cafeBreakdown.reduce((sum, c) => sum + c.customers, 0)
    };

    res.json({
      success: true,
      data: {
        range,
        startDate,
        endDate,
        totals,
        cafeBreakdown
      },
      message: 'Super Admin performance report fetched successfully'
    });
  } catch (error) {
    next(error);
  }
}

async function getAuditLogs(req, res, next) {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    const filter = {};
    if (req.query.cafeId && mongoose.Types.ObjectId.isValid(req.query.cafeId)) {
      filter.cafeId = req.query.cafeId;
    }

    const logs = await SuperAdminAuditLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: logs,
      message: 'Audit logs fetched successfully'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  sendCafeEmailVerificationOtp,
  verifyCafeEmailOtp,
  createRestaurant,
  getAllRestaurants,
  getRestaurantDetails,
  updateRestaurant,
  updateRestaurantStatus,
  updateRestaurantPlan,
  deleteRestaurant,
  getAllCafeAdmins,
  updateCafeAdmin,
  updateCafeAdminStatus,
  resetCafeAdminPassword,
  getSuperAdminPerformanceReport,
  getAuditLogs
};
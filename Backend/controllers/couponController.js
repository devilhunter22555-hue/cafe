const mongoose = require('mongoose');
const Coupon = require('../models/Coupon');

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeCode(value) {
  return String(value || '').trim().toUpperCase();
}

function calculateCouponDiscount(coupon, orderSubtotal) {
  const subtotal = Number(orderSubtotal) || 0;
  if (!coupon || !coupon.isActive) {
    return { valid: false, discountAmount: 0, reason: 'Coupon is not active' };
  }

  const now = new Date();
  if (new Date(coupon.validFrom) > now || new Date(coupon.validUntil) < now) {
    return { valid: false, discountAmount: 0, reason: 'Coupon is not valid for the current date' };
  }

  if (subtotal < Number(coupon.minOrderValue || 0)) {
    return { valid: false, discountAmount: 0, reason: 'Order subtotal is below the minimum required value' };
  }

  if (coupon.usageLimit != null && Number(coupon.usageCount || 0) >= Number(coupon.usageLimit)) {
    return { valid: false, discountAmount: 0, reason: 'Coupon usage limit has been reached' };
  }

  let discountAmount = 0;
  if (coupon.discountType === 'flat') {
    discountAmount = Number(coupon.discountValue) || 0;
  }

  if (coupon.discountType === 'percentage') {
    discountAmount = (subtotal * (Number(coupon.discountValue) || 0)) / 100;
    if (coupon.maxDiscountAmount != null) {
      discountAmount = Math.min(discountAmount, Number(coupon.maxDiscountAmount));
    }
  }

  return {
    valid: true,
    discountAmount: Math.max(0, discountAmount),
    reason: null
  };
}

async function createCoupon(req, res, next) {
  try {
    const {
      code,
      discountType,
      discountValue,
      minOrderValue = 0,
      maxDiscountAmount,
      validFrom,
      validUntil,
      usageLimit,
      isActive = true
    } = req.body;

    if (!code || !discountType || discountValue == null || !validFrom || !validUntil) {
      throw createError('code, discountType, discountValue, validFrom, and validUntil are required', 400);
    }

    if (!['flat', 'percentage'].includes(discountType)) {
      throw createError('discountType must be either flat or percentage', 400);
    }

    const normalizedCode = normalizeCode(code);
    if (!normalizedCode) throw createError('Coupon code is required', 400);

    const parsedDiscountValue = Number(discountValue);
    if (!Number.isFinite(parsedDiscountValue) || parsedDiscountValue <= 0) {
      throw createError('discountValue must be a positive number', 400);
    }

    const parsedMinOrderValue = Number(minOrderValue);
    if (!Number.isFinite(parsedMinOrderValue) || parsedMinOrderValue < 0) {
      throw createError('minOrderValue must be a valid non-negative number', 400);
    }

    const couponFrom = new Date(validFrom);
    const couponUntil = new Date(validUntil);
    if (Number.isNaN(couponFrom.getTime()) || Number.isNaN(couponUntil.getTime())) {
      throw createError('validFrom and validUntil must be valid dates', 400);
    }

    if (couponUntil < couponFrom) {
      throw createError('validUntil must be after validFrom', 400);
    }

    if (usageLimit != null) {
      const parsedUsageLimit = Number(usageLimit);
      if (!Number.isInteger(parsedUsageLimit) || parsedUsageLimit <= 0) {
        throw createError('usageLimit must be a positive integer or null', 400);
      }
    }

    const coupon = await Coupon.create({
      restaurantId: req.restaurantId,
      branchId: req.branchId,
      code: normalizedCode,
      discountType,
      discountValue: parsedDiscountValue,
      minOrderValue: parsedMinOrderValue,
      maxDiscountAmount: maxDiscountAmount == null ? null : Number(maxDiscountAmount),
      validFrom: couponFrom,
      validUntil: couponUntil,
      usageLimit: usageLimit == null ? null : Number(usageLimit),
      isActive: Boolean(isActive)
    });

    res.status(201).json({
      success: true,
      data: coupon,
      message: 'Coupon created successfully'
    });
  } catch (error) {
    next(error);
  }
}

async function getCoupons(req, res, next) {
  try {
    const coupons = await Coupon.find({
      restaurantId: req.restaurantId,
      branchId: req.branchId
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: coupons,
      message: 'Coupons fetched successfully'
    });
  } catch (error) {
    next(error);
  }
}

async function updateCoupon(req, res, next) {
  try {
    const coupon = await Coupon.findOne({
      _id: req.params.id,
      restaurantId: req.restaurantId,
      branchId: req.branchId
    });

    if (!coupon) throw createError('Coupon not found', 404);

    const fields = ['code', 'discountType', 'discountValue', 'minOrderValue', 'maxDiscountAmount', 'validFrom', 'validUntil', 'usageLimit', 'isActive'];
    for (const key of fields) {
      if (req.body[key] === undefined) continue;

      if (key === 'code') {
        coupon.code = normalizeCode(req.body.code);
      } else if (key === 'discountType') {
        if (!['flat', 'percentage'].includes(req.body.discountType)) {
          throw createError('discountType must be either flat or percentage', 400);
        }
        coupon.discountType = req.body.discountType;
      } else if (key === 'discountValue') {
        const value = Number(req.body.discountValue);
        if (!Number.isFinite(value) || value <= 0) throw createError('discountValue must be a positive number', 400);
        coupon.discountValue = value;
      } else if (key === 'minOrderValue') {
        const value = Number(req.body.minOrderValue);
        if (!Number.isFinite(value) || value < 0) throw createError('minOrderValue must be a valid non-negative number', 400);
        coupon.minOrderValue = value;
      } else if (key === 'maxDiscountAmount') {
        coupon.maxDiscountAmount = req.body.maxDiscountAmount == null ? null : Number(req.body.maxDiscountAmount);
      } else if (key === 'validFrom' || key === 'validUntil') {
        const date = new Date(req.body[key]);
        if (Number.isNaN(date.getTime())) throw createError(`Invalid ${key}`, 400);
        coupon[key] = date;
      } else if (key === 'usageLimit') {
        if (req.body.usageLimit == null) {
          coupon.usageLimit = null;
        } else {
          const value = Number(req.body.usageLimit);
          if (!Number.isInteger(value) || value <= 0) throw createError('usageLimit must be a positive integer or null', 400);
          coupon.usageLimit = value;
        }
      } else if (key === 'isActive') {
        coupon.isActive = Boolean(req.body.isActive);
      }
    }

    if (coupon.validUntil < coupon.validFrom) {
      throw createError('validUntil must be after validFrom', 400);
    }

    await coupon.save();
    res.json({
      success: true,
      data: coupon,
      message: 'Coupon updated successfully'
    });
  } catch (error) {
    next(error);
  }
}

async function deleteCoupon(req, res, next) {
  try {
    const coupon = await Coupon.findOne({
      _id: req.params.id,
      restaurantId: req.restaurantId,
      branchId: req.branchId
    });

    if (!coupon) throw createError('Coupon not found', 404);

    coupon.isActive = false;
    await coupon.save();

    res.json({
      success: true,
      data: coupon,
      message: 'Coupon deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
}

async function validateCoupon(req, res, next) {
  try {
    const { code, orderSubtotal } = req.body;
    const normalizedCode = normalizeCode(code);

    if (!normalizedCode) throw createError('Coupon code is required', 400);

    const coupon = await Coupon.findOne({
      code: normalizedCode,
      restaurantId: req.restaurantId,
      branchId: req.branchId
    });

    if (!coupon) throw createError('Coupon not found', 404);

    const result = calculateCouponDiscount(coupon, orderSubtotal);
    if (!result.valid) {
      throw createError(result.reason || 'Coupon is invalid', 400);
    }

    res.json({
      success: true,
      data: {
        valid: true,
        coupon,
        discountAmount: result.discountAmount
      },
      message: 'Coupon is valid'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createCoupon,
  getCoupons,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  calculateCouponDiscount
};

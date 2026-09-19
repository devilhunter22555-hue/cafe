const mongoose = require('mongoose');
const SalaryPayment = require('../models/SalaryPayment');
const User = require('../models/User');

const paymentModes = ['cash', 'bank_transfer', 'upi'];
const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function validateMonth(month) {
  if (typeof month !== 'string' || !monthPattern.test(month)) {
    throw createError('month must use the YYYY-MM format', 400);
  }
}

function branchScope(req) {
  return req.branchId ? { branchId: req.branchId } : {};
}

async function findSalaryManagedStaff(userId, req) {
  if (!mongoose.isValidObjectId(userId)) throw createError('Invalid staff id', 400);

  const filter = {
    _id: userId,
    restaurantId: req.restaurantId,
    role: { $ne: 'owner' },
    ...branchScope(req)
  };
  if (req.user.role === 'manager') filter.role = { $nin: ['owner', 'manager'] };

  const staff = await User.findOne(filter);
  if (!staff) throw createError('Staff member not found', 404);
  return staff;
}

async function setStaffSalary(req, res, next) {
  try {
    const monthlySalary = Number(req.body.monthlySalary);
    if (!Number.isFinite(monthlySalary) || monthlySalary < 0) {
      throw createError('monthlySalary must be a non-negative number', 400);
    }

    const staff = await findSalaryManagedStaff(req.params.userId, req);
    staff.monthlySalary = monthlySalary;
    await staff.save();

    res.json({ success: true, data: staff, message: 'Staff salary updated successfully' });
  } catch (error) {
    next(error);
  }
}

async function generateMonthlySalaryRecords(req, res, next) {
  try {
    const { month } = req.body;
    validateMonth(month);

    const staffFilter = {
      restaurantId: req.restaurantId,
      isActive: true,
      monthlySalary: { $gt: 0 },
      role: { $ne: 'owner' },
      ...branchScope(req)
    };
    if (req.user.role === 'manager') staffFilter.role = { $nin: ['owner', 'manager'] };

    const staffMembers = await User.find(staffFilter).select('_id monthlySalary');
    let created = 0;

    await Promise.all(staffMembers.map(async (staff) => {
      try {
        await SalaryPayment.create({
          userId: staff._id,
          month,
          amount: staff.monthlySalary,
          status: 'pending',
          createdBy: req.user.userId || req.user._id,
          restaurantId: req.restaurantId,
          ...branchScope(req)
        });
        created += 1;
      } catch (error) {
        if (error?.code !== 11000) throw error;
      }
    }));

    res.status(201).json({
      success: true,
      data: { created },
      message: `${created} salary record(s) generated successfully`
    });
  } catch (error) {
    next(error);
  }
}

async function getSalaryRecords(req, res, next) {
  try {
    const filter = { restaurantId: req.restaurantId, ...branchScope(req) };
    if (req.query.month !== undefined) {
      validateMonth(req.query.month);
      filter.month = req.query.month;
    }
    if (req.query.status !== undefined) {
      if (!['pending', 'paid'].includes(req.query.status)) {
        throw createError('status must be pending or paid', 400);
      }
      filter.status = req.query.status;
    }

    const records = await SalaryPayment.find(filter)
      .populate('userId', 'name email role')
      .populate('createdBy', 'name email')
      .sort({ month: -1, createdAt: -1 });
    res.json({ success: true, data: records, message: 'Salary records fetched successfully' });
  } catch (error) {
    next(error);
  }
}

async function markSalaryPaid(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw createError('Invalid salary payment id', 400);
    const { paymentMode, note } = req.body;
    if (!paymentModes.includes(paymentMode)) {
      throw createError('paymentMode must be cash, bank_transfer, or upi', 400);
    }

    const payment = await SalaryPayment.findOne({
      _id: req.params.id,
      restaurantId: req.restaurantId,
      ...branchScope(req)
    });
    if (!payment) throw createError('Salary payment not found', 404);

    payment.status = 'paid';
    payment.paidAt = new Date();
    payment.paymentMode = paymentMode;
    if (note !== undefined) payment.note = note;
    await payment.save();

    res.json({ success: true, data: payment, message: 'Salary marked as paid successfully' });
  } catch (error) {
    next(error);
  }
}

async function getMySalaryHistory(req, res, next) {
  try {
    const records = await SalaryPayment.find({
      restaurantId: req.restaurantId,
      userId: req.user.userId || req.user._id
    }).sort({ month: -1, createdAt: -1 });
    res.json({ success: true, data: records, message: 'Salary history fetched successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  setStaffSalary,
  generateMonthlySalaryRecords,
  getSalaryRecords,
  markSalaryPaid,
  getMySalaryHistory
};

const mongoose = require('mongoose');
const Branch = require('../models/Branch');
const User = require('../models/User');

const staffRoles = ['manager', 'cashier', 'kitchen', 'waiter'];

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

function publicStaff(user) {
  const data = user.toObject ? user.toObject() : { ...user };
  delete data.password;
  return data;
}

async function validateBranch(branchId, req) {
  if (!mongoose.isValidObjectId(branchId)) throw createError('Valid branchId is required', 400);
  const branch = await Branch.findOne({ _id: branchId, restaurantId: req.restaurantId, isActive: true });
  if (!branch) throw createError('Branch not found for this restaurant', 404);
  if (req.user.role === 'manager' && String(branch._id) !== String(req.user.branchId)) {
    throw createError('Managers can only manage staff in their own branch', 403);
  }
  return branch;
}

async function findManagedStaff(id, req) {
  if (!mongoose.isValidObjectId(id)) throw createError('Invalid staff id', 400);
  const filter = { _id: id, restaurantId: req.restaurantId, role: { $ne: 'owner' } };
  if (req.user.role === 'manager') filter.branchId = req.user.branchId;
  const staff = await User.findOne(filter);
  if (!staff) throw createError('Staff member not found', 404);
  return staff;
}

async function createStaff(req, res, next) {
  try {
    const { name, email, password, role, branchId } = req.body;
    if (!name || !email || !password || !role || !branchId) {
      throw createError('name, email, password, role, and branchId are required', 400);
    }
    if (!validatePassword(password)) {
      throw createError('Password must be at least 8 characters long and include at least one letter and one number', 400);
    }
    if (!staffRoles.includes(role)) throw createError('Invalid staff role', 400);
    if (req.user.role === 'manager' && role === 'manager') {
      throw createError('Managers cannot create another manager', 403);
    }
    await validateBranch(branchId, req);

    const staff = await User.create({
      name,
      email,
      password,
      role,
      branchId,
      restaurantId: req.restaurantId
    });
    res.status(201).json({ success: true, data: publicStaff(staff), message: 'Staff member created successfully' });
  } catch (error) {
    next(error);
  }
}

async function getStaff(req, res, next) {
  try {
    const filter = { restaurantId: req.restaurantId, isActive: true, role: { $ne: 'owner' } };
    if (req.user.role === 'manager') filter.branchId = req.user.branchId;
    const staff = await User.find(filter)
      .select('-password')
      .populate('branchId', 'name')
      .sort({ name: 1 });
    res.json({ success: true, data: staff, message: 'Staff fetched successfully' });
  } catch (error) {
    next(error);
  }
}

async function updateStaff(req, res, next) {
  try {
    const staff = await findManagedStaff(req.params.id, req);
    const { name, role, branchId } = req.body;
    if (role !== undefined) {
      if (!staffRoles.includes(role)) throw createError('Invalid staff role', 400);
      if (req.user.role === 'manager' && role === 'manager') {
        throw createError('Managers cannot promote staff to manager', 403);
      }
    }
    if (branchId !== undefined) await validateBranch(branchId, req);
    if (name !== undefined) staff.name = name;
    if (role !== undefined) staff.role = role;
    if (branchId !== undefined) staff.branchId = branchId;
    await staff.save();
    res.json({ success: true, data: publicStaff(staff), message: 'Staff member updated successfully' });
  } catch (error) {
    next(error);
  }
}

async function deactivateStaff(req, res, next) {
  try {
    if (String(req.params.id) === String(req.user.userId || req.user._id)) {
      throw createError('You cannot deactivate yourself', 400);
    }
    const staff = await findManagedStaff(req.params.id, req);
    staff.isActive = false;
    await staff.save();
    res.json({ success: true, data: publicStaff(staff), message: 'Staff member deactivated successfully' });
  } catch (error) {
    next(error);
  }
}

async function resetStaffPassword(req, res, next) {
  try {
    const { newPassword } = req.body;
    if (!newPassword) throw createError('newPassword is required', 400);
    if (!validatePassword(newPassword)) {
      throw createError('Password must be at least 8 characters long and include at least one letter and one number', 400);
    }
    const staff = await findManagedStaff(req.params.id, req);
    staff.password = newPassword;
    await staff.save();
    res.json({ success: true, data: publicStaff(staff), message: 'Staff password reset successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = { createStaff, getStaff, updateStaff, deactivateStaff, resetStaffPassword };
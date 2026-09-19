const SubscriptionPlan = require('../models/SubscriptionPlan');

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function createPlan(req, res, next) {
  try {
    const { name, price, maxBranches, maxStaff, features, isActive } = req.body;
    if (!name || price === undefined || maxBranches === undefined || maxStaff === undefined) {
      throw createError('name, price, maxBranches, and maxStaff are required', 400);
    }

    const plan = await SubscriptionPlan.create({
      name,
      price,
      maxBranches,
      maxStaff,
      features: features || [],
      isActive: isActive !== false
    });

    res.status(201).json({ success: true, data: plan, message: 'Subscription plan created successfully' });
  } catch (error) {
    next(error);
  }
}

async function getPlans(req, res, next) {
  try {
    const plans = await SubscriptionPlan.find().sort({ price: 1, createdAt: 1 });
    res.json({ success: true, data: plans, message: 'Subscription plans fetched successfully' });
  } catch (error) {
    next(error);
  }
}

async function updatePlan(req, res, next) {
  try {
    const { id } = req.params;
    const update = req.body;
    const plan = await SubscriptionPlan.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!plan) throw createError('Subscription plan not found', 404);

    res.json({ success: true, data: plan, message: 'Subscription plan updated successfully' });
  } catch (error) {
    next(error);
  }
}

async function deletePlan(req, res, next) {
  try {
    const { id } = req.params;
    const plan = await SubscriptionPlan.findByIdAndDelete(id);
    if (!plan) throw createError('Subscription plan not found', 404);

    res.json({ success: true, data: null, message: 'Subscription plan deleted successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = { createPlan, getPlans, updatePlan, deletePlan };

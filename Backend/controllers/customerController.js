const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const Bill = require('../models/Bill');

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function getCustomers(req, res, next) {
  try {
    const { search, limit = 50 } = req.query;
    const parsedLimit = Number(limit);
    if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 200) {
      throw createError('limit must be an integer between 1 and 200', 400);
    }

    const filter = { restaurantId: req.restaurantId };
    if (search && String(search).trim()) {
      const keyword = String(search).trim();
      filter.$or = [
        { phone: { $regex: keyword, $options: 'i' } },
        { name: { $regex: keyword, $options: 'i' } }
      ];
    }

    const customers = await Customer.find(filter)
      .sort({ lastVisitAt: -1, createdAt: -1 })
      .limit(parsedLimit)
      .lean();

    res.json({
      success: true,
      data: customers,
      message: 'Customers fetched successfully'
    });
  } catch (error) {
    next(error);
  }
}

async function getCustomerById(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      throw createError('Valid customer id is required', 400);
    }

    const customer = await Customer.findOne({
      _id: req.params.id,
      restaurantId: req.restaurantId
    }).lean();

    if (!customer) throw createError('Customer not found', 404);

    const recentBills = await Bill.find({
      customerId: customer._id,
      restaurantId: req.restaurantId
    }).sort({ createdAt: -1 }).limit(10).lean();

    res.json({
      success: true,
      data: {
        ...customer,
        recentBills
      },
      message: 'Customer fetched successfully'
    });
  } catch (error) {
    next(error);
  }
}

async function lookupCustomerByPhone(req, res, next) {
  try {
    const phone = String(req.query.phone || '').trim();
    if (!phone) throw createError('phone query is required', 400);

    const customer = await Customer.findOne({
      phone,
      restaurantId: req.restaurantId
    }).lean();

    if (!customer) {
      res.json({
        success: true,
        data: null,
        message: 'Customer not found'
      });
      return;
    }

    res.json({
      success: true,
      data: customer,
      message: 'Customer lookup successful'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getCustomers, getCustomerById, lookupCustomerByPhone };

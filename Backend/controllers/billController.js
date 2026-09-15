const Bill = require('../models/Bill');

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function dateAtStart(dateKey) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    throw createError('Date filters must use YYYY-MM-DD format', 400);
  }

  const date = new Date(`${dateKey}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== dateKey) {
    throw createError('Date filters must use valid calendar dates', 400);
  }
  return date;
}

async function getBills(req, res, next) {
  try {
    const filter = {
      restaurantId: req.restaurantId,
      branchId: req.branchId
    };

    if (req.query.from || req.query.to) {
      filter.createdAt = {};
      if (req.query.from) filter.createdAt.$gte = dateAtStart(req.query.from);
      if (req.query.to) {
        const end = dateAtStart(req.query.to);
        end.setUTCDate(end.getUTCDate() + 1);
        filter.createdAt.$lt = end;
      }
    }

    const bills = await Bill.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: bills, message: 'Bills fetched successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = { getBills };
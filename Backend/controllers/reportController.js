const mongoose = require('mongoose');
const Bill = require('../models/Bill');
const {
  runDailySalesReportJob,
  runMonthlySalesReportJob
} = require('../utils/salesReportScheduler');

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function dateRange(from, to) {
  if (!from || !to || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    throw createError('from and to are required in YYYY-MM-DD format', 400);
  }

  const start = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end || start.toISOString().slice(0, 10) !== from || end.toISOString().slice(0, 10) !== to) {
    throw createError('from and to must be valid dates with from before or equal to to', 400);
  }

  end.setUTCDate(end.getUTCDate() + 1);
  return { $gte: start, $lt: end };
}

function billMatch(req, createdAt) {
  return {
    restaurantId: new mongoose.Types.ObjectId(req.restaurantId),
    branchId: new mongoose.Types.ObjectId(req.branchId),
    createdAt
  };
}

async function getSalesSummary(req, res, next) {
  try {
    const createdAt = dateRange(req.query.from, req.query.to);
    const [summary] = await Bill.aggregate([
      { $match: billMatch(req, createdAt) },
      { $group: {
        _id: null,
        totalRevenue: { $sum: '$total' },
        totalBills: { $sum: 1 },
        cash: { $sum: { $cond: [{ $eq: ['$paymentMode', 'cash'] }, '$total', 0] } },
        card: { $sum: { $cond: [{ $eq: ['$paymentMode', 'card'] }, '$total', 0] } },
        upi: { $sum: { $cond: [{ $eq: ['$paymentMode', 'upi'] }, '$total', 0] } },
        cgst: { $sum: '$cgst' },
        sgst: { $sum: '$sgst' },
        totalDiscount: { $sum: '$discount' }
      } }
    ]);

    const totalRevenue = summary?.totalRevenue || 0;
    const totalBills = summary?.totalBills || 0;
    res.json({
      success: true,
      data: {
        totalRevenue,
        totalBills,
        avgBillValue: totalBills ? totalRevenue / totalBills : 0,
        paymentModeBreakdown: { cash: summary?.cash || 0, card: summary?.card || 0, upi: summary?.upi || 0 },
        totalTax: { cgst: summary?.cgst || 0, sgst: summary?.sgst || 0 },
        totalDiscount: summary?.totalDiscount || 0
      },
      message: 'Sales summary fetched successfully'
    });
  } catch (error) {
    next(error);
  }
}

async function getSalesByDay(req, res, next) {
  try {
    const createdAt = dateRange(req.query.from, req.query.to);
    const sales = await Bill.aggregate([
      { $match: billMatch(req, createdAt) },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } },
        revenue: { $sum: '$total' },
        billCount: { $sum: 1 }
      } },
      { $project: { _id: 0, date: '$_id', revenue: 1, billCount: 1 } },
      { $sort: { date: 1 } }
    ]);

    res.json({ success: true, data: sales, message: 'Sales by day fetched successfully' });
  } catch (error) {
    next(error);
  }
}

async function getTopSellingItems(req, res, next) {
  try {
    const createdAt = dateRange(req.query.from, req.query.to);
    const limit = Number(req.query.limit) || 10;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw createError('limit must be an integer between 1 and 100', 400);

    const items = await Bill.aggregate([
      { $match: billMatch(req, createdAt) },
      { $unwind: '$items' },
      { $group: {
        _id: '$items.name',
        totalQty: { $sum: '$items.qty' },
        totalRevenue: { $sum: '$items.lineTotal' }
      } },
      { $project: { _id: 0, name: '$_id', totalQty: 1, totalRevenue: 1 } },
      { $sort: { totalQty: -1, name: 1 } },
      { $limit: limit }
    ]);

    res.json({ success: true, data: items, message: 'Top selling items fetched successfully' });
  } catch (error) {
    next(error);
  }
}

async function getCategoryBreakdown(req, res, next) {
  try {
    const createdAt = dateRange(req.query.from, req.query.to);
    const categories = await Bill.aggregate([
      { $match: billMatch(req, createdAt) },
      { $unwind: '$items' },
      { $group: {
        _id: { $ifNull: ['$items.categoryName', 'Uncategorized'] },
        totalRevenue: { $sum: '$items.lineTotal' }
      } },
      { $project: { _id: 0, categoryName: '$_id', totalRevenue: 1 } },
      { $sort: { totalRevenue: -1, categoryName: 1 } }
    ]);
    const totalRevenue = categories.reduce((sum, category) => sum + category.totalRevenue, 0);
    const data = categories.map((category) => ({
      ...category,
      percentage: totalRevenue ? (category.totalRevenue / totalRevenue) * 100 : 0
    }));

    res.json({ success: true, data, message: 'Category breakdown fetched successfully' });
  } catch (error) {
    next(error);
  }
}

async function sendDailySalesReport(req, res, next) {
  try {
    const { report, emailResult } = await runDailySalesReportJob({
      restaurantId: req.restaurantId || req.body?.restaurantId,
      branchId: req.branchId || req.body?.branchId
    });

    if (!report) {
      throw createError(emailResult?.error || 'Failed to generate daily sales report', 500);
    }

    res.json({
      success: true,
      data: {
        subject: report.subject,
        period: report.period,
        summary: report.data,
        text: report.text,
        emailSent: Boolean(emailResult?.sent),
        recipient: emailResult?.recipient || null,
        emailNote: emailResult?.error || null
      },
      message: emailResult?.sent
        ? `Daily sales report sent to ${emailResult.recipient}`
        : `Daily sales report generated (${emailResult?.error || 'SMTP not configured'})`
    });
  } catch (error) {
    next(error);
  }
}

async function sendMonthlySalesReport(req, res, next) {
  try {
    const { report, emailResult } = await runMonthlySalesReportJob({
      restaurantId: req.restaurantId || req.body?.restaurantId,
      branchId: req.branchId || req.body?.branchId
    });

    if (!report) {
      throw createError(emailResult?.error || 'Failed to generate monthly sales report', 500);
    }

    res.json({
      success: true,
      data: {
        subject: report.subject,
        period: report.period,
        summary: report.data,
        text: report.text,
        emailSent: Boolean(emailResult?.sent),
        recipient: emailResult?.recipient || null,
        emailNote: emailResult?.error || null
      },
      message: emailResult?.sent
        ? `Monthly sales report sent to ${emailResult.recipient}`
        : `Monthly sales report generated (${emailResult?.error || 'SMTP not configured'})`
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSalesSummary,
  getSalesByDay,
  getTopSellingItems,
  getCategoryBreakdown,
  sendDailySalesReport,
  sendMonthlySalesReport
};

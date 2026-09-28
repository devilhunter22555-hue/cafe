const mongoose = require('mongoose');
const Bill = require('../models/Bill');
const Order = require('../models/Order');
const { sendSalesReportEmail } = require('./emailService');

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000; // +05:30

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getISTComponents(date = new Date()) {
  const istTime = new Date(date.getTime() + IST_OFFSET_MS);
  return {
    year: istTime.getUTCFullYear(),
    month: istTime.getUTCMonth() + 1,
    day: istTime.getUTCDate()
  };
}

function createDateFromIST(year, month, day, hours = 0, minutes = 0, seconds = 0, ms = 0) {
  const utcMs = Date.UTC(year, month - 1, day, hours, minutes, seconds, ms) - IST_OFFSET_MS;
  return new Date(utcMs);
}

function getPreviousDayRangeIST(referenceDate = new Date()) {
  const { year, month, day } = getISTComponents(referenceDate);
  const todayMidnightUTC = new Date(Date.UTC(year, month - 1, day));
  todayMidnightUTC.setUTCDate(todayMidnightUTC.getUTCDate() - 1);

  const prevYear = todayMidnightUTC.getUTCFullYear();
  const prevMonth = todayMidnightUTC.getUTCMonth() + 1;
  const prevDay = todayMidnightUTC.getUTCDate();

  const startDate = createDateFromIST(prevYear, prevMonth, prevDay, 0, 0, 0, 0);
  const endDate = createDateFromIST(prevYear, prevMonth, prevDay, 23, 59, 59, 999);
  const displayDate = `${prevDay} ${MONTH_NAMES[prevMonth - 1]} ${prevYear}`;

  return {
    year: prevYear,
    month: prevMonth,
    day: prevDay,
    displayDate,
    startDate,
    endDate
  };
}

function getPreviousMonthRangeIST(referenceDate = new Date()) {
  const { year, month } = getISTComponents(referenceDate);
  let prevYear = year;
  let prevMonth = month - 1;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear = year - 1;
  }

  const daysInPrevMonth = new Date(Date.UTC(prevYear, prevMonth, 0)).getUTCDate();
  const startDate = createDateFromIST(prevYear, prevMonth, 1, 0, 0, 0, 0);
  const endDate = createDateFromIST(prevYear, prevMonth, daysInPrevMonth, 23, 59, 59, 999);
  const monthName = MONTH_NAMES[prevMonth - 1];
  const displayMonth = `${monthName} ${prevYear}`;

  return {
    year: prevYear,
    month: prevMonth,
    monthName,
    daysInMonth: daysInPrevMonth,
    displayMonth,
    startDate,
    endDate
  };
}

function formatINR(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

async function getSalesData(startDate, endDate, options = {}) {
  const { restaurantId = null, branchId = null, includeDailyBreakdown = false, year = null, month = null, daysInMonth = 0 } = options;

  const matchFilter = {
    createdAt: { $gte: startDate, $lte: endDate }
  };

  if (restaurantId && mongoose.Types.ObjectId.isValid(restaurantId)) {
    matchFilter.restaurantId = new mongoose.Types.ObjectId(restaurantId);
  }
  if (branchId && mongoose.Types.ObjectId.isValid(branchId)) {
    matchFilter.branchId = new mongoose.Types.ObjectId(branchId);
  }

  const [billSummaryArr, topItemsFromBills, orderStatusArr, dailyBillsArr] = await Promise.all([
    Bill.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$total' },
          totalBills: { $sum: 1 },
          cash: { $sum: { $cond: [{ $eq: ['$paymentMode', 'cash'] }, '$total', 0] } },
          upi: { $sum: { $cond: [{ $eq: ['$paymentMode', 'upi'] }, '$total', 0] } },
          card: { $sum: { $cond: [{ $eq: ['$paymentMode', 'card'] }, '$total', 0] } },
          other: { $sum: { $cond: [{ $nin: ['$paymentMode', ['cash', 'upi', 'card']] }, '$total', 0] } }
        }
      }
    ]),
    Bill.aggregate([
      { $match: matchFilter },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          qty: { $sum: '$items.qty' },
          revenue: { $sum: '$items.lineTotal' }
        }
      },
      { $sort: { qty: -1, revenue: -1, _id: 1 } }
    ]),
    Order.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$total' }
        }
      }
    ]),
    includeDailyBreakdown
      ? Bill.aggregate([
          { $match: matchFilter },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' }
              },
              sales: { $sum: '$total' },
              orders: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ])
      : Promise.resolve([])
  ]);

  const statusCounts = { completed: 0, pending: 0, cancelled: 0 };
  for (const row of orderStatusArr) {
    if (row._id === 'billed') statusCounts.completed += row.count;
    else if (row._id === 'open') statusCounts.pending += row.count;
    else if (row._id === 'cancelled') statusCounts.cancelled += row.count;
  }

  const billSummary = billSummaryArr[0] || {
    totalSales: 0,
    totalBills: 0,
    cash: 0,
    upi: 0,
    card: 0,
    other: 0
  };

  const totalSales = Number(billSummary.totalSales || 0);
  const completedOrdersCount = Number(billSummary.totalBills || statusCounts.completed || 0);
  if (billSummary.totalBills > statusCounts.completed) {
    statusCounts.completed = billSummary.totalBills;
  }

  const totalOrders = statusCounts.completed + statusCounts.pending + statusCounts.cancelled;
  const totalItemsSold = topItemsFromBills.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  const averageOrderValue = completedOrdersCount > 0 ? totalSales / completedOrdersCount : 0;

  const topSellingItems = topItemsFromBills.slice(0, 10).map((item) => ({
    name: item._id,
    qty: item.qty,
    revenue: item.revenue
  }));

  let dayByDayBreakdown = [];
  let bestSalesDay = null;

  if (includeDailyBreakdown && year && month && daysInMonth > 0) {
    const mapByIso = new Map(dailyBillsArr.map((d) => [d._id, d]));
    const monthName = MONTH_NAMES[month - 1];
    for (let d = 1; d <= daysInMonth; d += 1) {
      const iso = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const record = mapByIso.get(iso);
      const sales = Number(record?.sales || 0);
      const orders = Number(record?.orders || 0);
      const entry = {
        day: d,
        isoDate: iso,
        label: `${d} ${monthName}`,
        sales,
        orders
      };
      dayByDayBreakdown.push(entry);
      if (sales > 0 && (!bestSalesDay || sales > bestSalesDay.sales)) {
        bestSalesDay = entry;
      }
    }
  }

  return {
    hasSales: totalSales > 0 || totalOrders > 0,
    totalSales,
    totalOrders,
    completedOrders: statusCounts.completed,
    totalItemsSold,
    averageOrderValue,
    paymentSummary: {
      cash: Number(billSummary.cash || 0),
      upi: Number(billSummary.upi || 0),
      card: Number(billSummary.card || 0),
      other: Number(billSummary.other || 0)
    },
    topSellingItems,
    orderStatus: statusCounts,
    bestSalesDay,
    dayByDayBreakdown
  };
}

async function generateDailySalesReport(options = {}) {
  const range = getPreviousDayRangeIST(options.referenceDate || new Date());
  const data = await getSalesData(range.startDate, range.endDate, options);
  const subject = `Café Daily Sales Report — ${range.displayDate}`;
  const text = `Café Daily Sales Report — ${range.displayDate}\nTotal Sales: ${formatINR(data.totalSales)}\nTotal Orders: ${data.totalOrders}\nTotal Items Sold: ${data.totalItemsSold}`;
  const html = `<div><h2>${subject}</h2><p>Total Sales: <strong>${formatINR(data.totalSales)}</strong></p><p>Total Orders: <strong>${data.totalOrders}</strong></p></div>`;
  return { type: 'daily', subject, range, data, text, html };
}

async function generateMonthlySalesReport(options = {}) {
  const range = getPreviousMonthRangeIST(options.referenceDate || new Date());
  const data = await getSalesData(range.startDate, range.endDate, {
    ...options,
    includeDailyBreakdown: true,
    year: range.year,
    month: range.month,
    daysInMonth: range.daysInMonth
  });
  const subject = `Café Monthly Sales Report — ${range.displayMonth}`;
  const text = `Café Monthly Sales Report — ${range.displayMonth}\nTotal Sales: ${formatINR(data.totalSales)}\nTotal Orders: ${data.totalOrders}`;
  const html = `<div><h2>${subject}</h2><p>Total Sales: <strong>${formatINR(data.totalSales)}</strong></p><p>Total Orders: <strong>${data.totalOrders}</strong></p></div>`;
  return { type: 'monthly', subject, range, data, text, html };
}

async function sendReportEmail(reportPayload, options = {}) {
  return sendSalesReportEmail({
    to: options.to,
    subject: reportPayload.subject,
    text: reportPayload.text,
    html: reportPayload.html
  });
}

module.exports = {
  getPreviousDayRangeIST,
  getPreviousMonthRangeIST,
  getSalesData,
  generateDailySalesReport,
  generateMonthlySalesReport,
  sendSalesReportEmail: sendReportEmail
};

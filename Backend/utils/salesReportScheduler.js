const cron = require('node-cron');
const {
  generateDailySalesReport,
  generateMonthlySalesReport,
  sendSalesReportEmail
} = require('./salesReportService');

let dailyTask = null;
let monthlyTask = null;

async function runDailySalesReportJob() {
  try {
    const report = await generateDailySalesReport();
    return await sendSalesReportEmail(report);
  } catch (error) {
    console.error('[SalesReportScheduler] Error in daily sales report job:', error.message);
    return { sent: false, error: error.message };
  }
}

async function runMonthlySalesReportJob() {
  try {
    const report = await generateMonthlySalesReport();
    return await sendSalesReportEmail(report);
  } catch (error) {
    console.error('[SalesReportScheduler] Error in monthly sales report job:', error.message);
    return { sent: false, error: error.message };
  }
}

function startSalesReportScheduler() {
  if (!dailyTask) {
    dailyTask = cron.schedule('0 0 * * *', () => {
      runDailySalesReportJob();
    }, { timezone: 'Asia/Kolkata' });
  }

  if (!monthlyTask) {
    monthlyTask = cron.schedule('0 0 1 * *', () => {
      runMonthlySalesReportJob();
    }, { timezone: 'Asia/Kolkata' });
  }
}

module.exports = {
  startSalesReportScheduler,
  runDailySalesReportJob,
  runMonthlySalesReportJob
};

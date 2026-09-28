const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');
const { checkPermission } = require('../middleware/roleMiddleware');
const {
  getSalesSummary,
  getSalesByDay,
  getTopSellingItems,
  getCategoryBreakdown,
  sendDailySalesReport,
  sendMonthlySalesReport
} = require('../controllers/reportController');

const router = express.Router();
const reportRoles = checkPermission(['owner', 'manager']);

router.use(authMiddleware, tenantMiddleware, reportRoles);
router.get('/summary', getSalesSummary);
router.get('/sales-by-day', getSalesByDay);
router.get('/top-items', getTopSellingItems);
router.get('/category-breakdown', getCategoryBreakdown);
router.post('/send-daily', sendDailySalesReport);
router.post('/send-monthly', sendMonthlySalesReport);

module.exports = router;

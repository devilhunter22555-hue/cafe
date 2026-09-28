const express = require('express');
const superAdminMiddleware = require('../middleware/superAdminMiddleware');
const { login } = require('../controllers/superAdminAuthController');
const {
  sendCafeEmailVerificationOtp,
  verifyCafeEmailOtp,
  createRestaurant,
  getAllRestaurants,
  getRestaurantDetails,
  updateRestaurant,
  updateRestaurantStatus,
  updateRestaurantPlan,
  deleteRestaurant,
  getAllCafeAdmins,
  updateCafeAdmin,
  updateCafeAdminStatus,
  resetCafeAdminPassword,
  getSuperAdminPerformanceReport,
  getAuditLogs
} = require('../controllers/adminRestaurantController');
const {
  createPlan,
  getPlans,
  updatePlan,
  deletePlan
} = require('../controllers/subscriptionPlanController');
const {
  runDailySalesReportJob,
  runMonthlySalesReportJob
} = require('../utils/salesReportScheduler');

const router = express.Router();

// Public Super Admin Auth
router.post('/login', login);

// Protected Email Verification Routes for Create Café Flow (SUPER_ADMIN only)
router.post('/send-email-verification', superAdminMiddleware, sendCafeEmailVerificationOtp);
router.post('/verify-email', superAdminMiddleware, verifyCafeEmailOtp);
router.post('/cafes/send-email-verification', superAdminMiddleware, sendCafeEmailVerificationOtp);
router.post('/cafes/verify-email', superAdminMiddleware, verifyCafeEmailOtp);
router.post('/restaurants/send-email-verification', superAdminMiddleware, sendCafeEmailVerificationOtp);
router.post('/restaurants/verify-email', superAdminMiddleware, verifyCafeEmailOtp);

// Protected Café / Restaurant Management Routes (supporting both /restaurants and /cafes conventions)
router.post('/restaurants', superAdminMiddleware, createRestaurant);
router.get('/restaurants', superAdminMiddleware, getAllRestaurants);
router.get('/restaurants/:id', superAdminMiddleware, getRestaurantDetails);
router.put('/restaurants/:id', superAdminMiddleware, updateRestaurant);
router.patch('/restaurants/:id', superAdminMiddleware, updateRestaurant);
router.patch('/restaurants/:id/status', superAdminMiddleware, updateRestaurantStatus);
router.patch('/restaurants/:id/plan', superAdminMiddleware, updateRestaurantPlan);
router.delete('/restaurants/:id', superAdminMiddleware, deleteRestaurant);

router.post('/cafes', superAdminMiddleware, createRestaurant);
router.get('/cafes', superAdminMiddleware, getAllRestaurants);
router.get('/cafes/:id', superAdminMiddleware, getRestaurantDetails);
router.put('/cafes/:id', superAdminMiddleware, updateRestaurant);
router.patch('/cafes/:id', superAdminMiddleware, updateRestaurant);
router.patch('/cafes/:id/status', superAdminMiddleware, updateRestaurantStatus);
router.patch('/cafes/:id/plan', superAdminMiddleware, updateRestaurantPlan);
router.delete('/cafes/:id', superAdminMiddleware, deleteRestaurant);

// Café Admin Management Routes (by café ID or by admin ID)
router.get('/admins', superAdminMiddleware, getAllCafeAdmins);
router.put('/cafes/:id/admin', superAdminMiddleware, updateCafeAdmin);
router.patch('/cafes/:id/admin', superAdminMiddleware, updateCafeAdmin);
router.patch('/cafes/:id/admin/status', superAdminMiddleware, updateCafeAdminStatus);
router.post('/cafes/:id/admin/reset-password', superAdminMiddleware, resetCafeAdminPassword);

router.put('/restaurants/:id/admin', superAdminMiddleware, updateCafeAdmin);
router.patch('/restaurants/:id/admin', superAdminMiddleware, updateCafeAdmin);
router.patch('/restaurants/:id/admin/status', superAdminMiddleware, updateCafeAdminStatus);
router.post('/restaurants/:id/admin/reset-password', superAdminMiddleware, resetCafeAdminPassword);

router.put('/admins/:adminId', superAdminMiddleware, updateCafeAdmin);
router.patch('/admins/:adminId', superAdminMiddleware, updateCafeAdmin);
router.patch('/admins/:adminId/status', superAdminMiddleware, updateCafeAdminStatus);
router.post('/admins/:adminId/reset-password', superAdminMiddleware, resetCafeAdminPassword);

// Super Admin Reporting & Audit Logs
router.get('/reports/overview', superAdminMiddleware, getSuperAdminPerformanceReport);
router.post('/reports/send-daily', superAdminMiddleware, async (req, res, next) => {
  try {
    const result = await runDailySalesReportJob();
    res.json({
      success: true,
      data: result,
      message: result.sent
        ? `Daily sales report sent to ${result.recipient}`
        : `Daily sales report generated (${result.error || 'SMTP not configured'})`
    });
  } catch (err) {
    next(err);
  }
});
router.post('/reports/send-monthly', superAdminMiddleware, async (req, res, next) => {
  try {
    const result = await runMonthlySalesReportJob();
    res.json({
      success: true,
      data: result,
      message: result.sent
        ? `Monthly sales report sent to ${result.recipient}`
        : `Monthly sales report generated (${result.error || 'SMTP not configured'})`
    });
  } catch (err) {
    next(err);
  }
});
router.get('/audit-logs', superAdminMiddleware, getAuditLogs);

// Subscription Plans
router.post('/plans', superAdminMiddleware, createPlan);
router.get('/plans', superAdminMiddleware, getPlans);
router.patch('/plans/:id', superAdminMiddleware, updatePlan);
router.delete('/plans/:id', superAdminMiddleware, deletePlan);

module.exports = router;

const express = require('express');
const superAdminMiddleware = require('../middleware/superAdminMiddleware');
const { login } = require('../controllers/superAdminAuthController');
const {
  getAllRestaurants,
  getRestaurantDetails,
  updateRestaurantStatus,
  updateRestaurantPlan
} = require('../controllers/adminRestaurantController');
const {
  createPlan,
  getPlans,
  updatePlan,
  deletePlan
} = require('../controllers/subscriptionPlanController');

const router = express.Router();

router.post('/login', login);
router.get('/restaurants', superAdminMiddleware, getAllRestaurants);
router.get('/restaurants/:id', superAdminMiddleware, getRestaurantDetails);
router.patch('/restaurants/:id/status', superAdminMiddleware, updateRestaurantStatus);
router.patch('/restaurants/:id/plan', superAdminMiddleware, updateRestaurantPlan);
router.post('/plans', superAdminMiddleware, createPlan);
router.get('/plans', superAdminMiddleware, getPlans);
router.patch('/plans/:id', superAdminMiddleware, updatePlan);
router.delete('/plans/:id', superAdminMiddleware, deletePlan);

module.exports = router;

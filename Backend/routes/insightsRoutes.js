const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');
const { checkPermission } = require('../middleware/roleMiddleware');
const {
  getPriceTrends,
  getFoodCostSummary,
  getLowStockForecast,
  getAISummary
} = require('../controllers/insightsController');

const router = express.Router();
const ownerOrManager = checkPermission(['owner', 'manager']);

router.use(authMiddleware, tenantMiddleware, ownerOrManager);
router.get('/price-trends', getPriceTrends);
router.get('/food-cost-summary', getFoodCostSummary);
router.get('/low-stock-forecast', getLowStockForecast);
router.get('/ai-summary', getAISummary);

module.exports = router;

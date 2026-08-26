const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');
const { checkPermission } = require('../middleware/roleMiddleware');
const { getKitchenOrders } = require('../controllers/kitchenController');

const router = express.Router();

router.use(authMiddleware, tenantMiddleware, checkPermission(['kitchen', 'owner', 'manager']));
router.get('/orders', getKitchenOrders);

module.exports = router;
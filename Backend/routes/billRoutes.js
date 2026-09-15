const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');
const { checkPermission } = require('../middleware/roleMiddleware');
const { getBills } = require('../controllers/billController');

const router = express.Router();

router.use(authMiddleware, tenantMiddleware, checkPermission(['owner', 'manager', 'cashier']));
router.get('/', getBills);

module.exports = router;
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');
const { checkPermission } = require('../middleware/roleMiddleware');
const { createOrder, getOrders, getOrderById } = require('../controllers/orderController');

const router = express.Router();
const orderRoles = checkPermission(['owner', 'manager', 'cashier', 'waiter']);

router.use(authMiddleware, tenantMiddleware);
router.post('/', orderRoles, createOrder);
router.get('/', getOrders);
router.get('/:id', getOrderById);

module.exports = router;
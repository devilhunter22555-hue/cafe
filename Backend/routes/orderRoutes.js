const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');
const { checkPermission } = require('../middleware/roleMiddleware');
const {
	createOrder,
	getOrders,
	getOrderById,
	addItemsToOrder,
	updateItemStatus,
	cancelItem,
	generateBill
} = require('../controllers/orderController');

const router = express.Router();
const orderRoles = checkPermission(['owner', 'manager', 'cashier', 'waiter']);
const kitchenRoles = checkPermission(['owner', 'manager', 'kitchen']);
const billingRoles = checkPermission(['owner', 'manager', 'cashier']);

router.use(authMiddleware, tenantMiddleware);
router.post('/', orderRoles, createOrder);
router.get('/', getOrders);
router.get('/:id', getOrderById);
router.patch('/:id/items', orderRoles, addItemsToOrder);
router.patch('/:id/items/:itemId/status', kitchenRoles, updateItemStatus);
router.patch('/:id/items/:itemId/cancel', billingRoles, cancelItem);
router.patch('/:id/bill', billingRoles, generateBill);

module.exports = router;
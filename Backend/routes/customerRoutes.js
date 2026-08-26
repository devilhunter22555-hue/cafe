const express = require('express');
const customerAuthMiddleware = require('../middleware/customerAuthMiddleware');
const { getPublicMenu } = require('../controllers/customerMenuController');
const { placeOrder, getMyOrderStatus } = require('../controllers/customerOrderController');

const router = express.Router();

router.use(customerAuthMiddleware);
router.get('/menu', getPublicMenu);
router.post('/orders', placeOrder);
router.get('/orders/status', getMyOrderStatus);

module.exports = router;
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');
const { checkPermission } = require('../middleware/roleMiddleware');
const {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  markAsReceived,
  cancelPurchaseOrder
} = require('../controllers/purchaseOrderController');

const router = express.Router();
const ownerOrManager = checkPermission(['owner', 'manager']);

router.use(authMiddleware, tenantMiddleware, ownerOrManager);
router.post('/', createPurchaseOrder);
router.get('/', getPurchaseOrders);
router.get('/:id', getPurchaseOrderById);
router.patch('/:id/receive', markAsReceived);
router.patch('/:id/cancel', cancelPurchaseOrder);

module.exports = router;

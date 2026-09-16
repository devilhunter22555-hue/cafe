const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');
const { checkPermission } = require('../middleware/roleMiddleware');
const {
  createInventoryItem,
  getInventoryItems,
  updateInventoryItem,
  adjustStock,
  getStockLogs,
  deleteInventoryItem
} = require('../controllers/inventoryController');

const router = express.Router();
const managers = checkPermission(['owner', 'manager']);
const viewers = checkPermission(['owner', 'manager', 'cashier']);

router.use(authMiddleware, tenantMiddleware);
router.post('/', managers, createInventoryItem);
router.get('/', viewers, getInventoryItems);
router.patch('/:id', managers, updateInventoryItem);
router.patch('/:id/adjust-stock', managers, adjustStock);
router.get('/:id/logs', managers, getStockLogs);
router.delete('/:id', managers, deleteInventoryItem);

module.exports = router;
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');
const { checkPermission } = require('../middleware/roleMiddleware');
const {
  createTable,
  getTables,
  updateTable,
  updateTableStatus,
  deleteTable,
  getQrCodeUrl
} = require('../controllers/tableController');

const router = express.Router();
const managers = checkPermission(['owner', 'manager']);
const statusRoles = checkPermission(['owner', 'manager', 'cashier', 'waiter']);

router.use(authMiddleware, tenantMiddleware);
router.get('/', getTables);
router.post('/', managers, createTable);
router.patch('/:id', managers, updateTable);
router.patch('/:id/status', statusRoles, updateTableStatus);
router.delete('/:id', managers, deleteTable);
router.get('/:id/qr-code', managers, getQrCodeUrl);

module.exports = router;
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');
const { checkPermission } = require('../middleware/roleMiddleware');
const {
  createMenuItem,
  getMenuItems,
  updateMenuItem,
  toggleAvailability,
  deleteMenuItem
} = require('../controllers/menuItemController');

const router = express.Router();
const managers = checkPermission(['owner', 'manager']);
const availabilityRoles = checkPermission(['owner', 'manager', 'cashier']);

router.use(authMiddleware, tenantMiddleware);
router.get('/', getMenuItems);
router.post('/', managers, createMenuItem);
router.patch('/:id', managers, updateMenuItem);
router.patch('/:id/availability', availabilityRoles, toggleAvailability);
router.delete('/:id', managers, deleteMenuItem);

module.exports = router;

const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');
const { checkPermission } = require('../middleware/roleMiddleware');
const {
  createStaff,
  getStaff,
  updateStaff,
  deactivateStaff,
  resetStaffPassword
} = require('../controllers/staffController');

const router = express.Router();
const staffManagers = checkPermission(['owner', 'manager']);

router.use(authMiddleware, tenantMiddleware, staffManagers);
router.post('/', createStaff);
router.get('/', getStaff);
router.patch('/:id', updateStaff);
router.patch('/:id/deactivate', deactivateStaff);
router.patch('/:id/reset-password', resetStaffPassword);

module.exports = router;
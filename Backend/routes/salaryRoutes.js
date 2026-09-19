const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');
const { checkPermission } = require('../middleware/roleMiddleware');
const {
  setStaffSalary,
  generateMonthlySalaryRecords,
  getSalaryRecords,
  markSalaryPaid,
  getMySalaryHistory
} = require('../controllers/salaryController');

const router = express.Router();
const managers = checkPermission(['owner', 'manager']);
const staff = checkPermission(['owner', 'manager', 'cashier', 'kitchen', 'waiter']);

router.use(authMiddleware, tenantMiddleware);
router.get('/my-history', staff, getMySalaryHistory);
router.patch('/staff/:userId', managers, setStaffSalary);
router.post('/generate', managers, generateMonthlySalaryRecords);
router.get('/', managers, getSalaryRecords);
router.patch('/:id/pay', managers, markSalaryPaid);

module.exports = router;

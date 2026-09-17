const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');
const { checkPermission } = require('../middleware/roleMiddleware');
const {
  getCustomers,
  getCustomerById,
  lookupCustomerByPhone
} = require('../controllers/customerController');

const router = express.Router();
const crmRoles = checkPermission(['owner', 'manager', 'cashier']);

router.use(authMiddleware, tenantMiddleware, crmRoles);
router.get('/', getCustomers);
router.get('/lookup', lookupCustomerByPhone);
router.get('/:id', getCustomerById);

module.exports = router;

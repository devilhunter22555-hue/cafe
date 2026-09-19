const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');
const { checkPermission } = require('../middleware/roleMiddleware');
const {
  createCoupon,
  getCoupons,
  updateCoupon,
  deleteCoupon,
  validateCoupon
} = require('../controllers/couponController');

const router = express.Router();
const couponManagers = checkPermission(['owner', 'manager']);
const couponUsers = checkPermission(['owner', 'manager', 'cashier']);

router.use(authMiddleware, tenantMiddleware);
router.post('/', couponManagers, createCoupon);
router.get('/', couponManagers, getCoupons);
router.patch('/:id', couponManagers, updateCoupon);
router.patch('/:id/delete', couponManagers, deleteCoupon);
router.post('/validate', couponUsers, validateCoupon);

module.exports = router;

const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');
const { checkPermission } = require('../middleware/roleMiddleware');
const {
  createSupplier,
  getSuppliers,
  updateSupplier,
  deleteSupplier
} = require('../controllers/supplierController');

const router = express.Router();
const ownerOrManager = checkPermission(['owner', 'manager']);

router.use(authMiddleware, tenantMiddleware, ownerOrManager);
router.post('/', createSupplier);
router.get('/', getSuppliers);
router.patch('/:id', updateSupplier);
router.delete('/:id', deleteSupplier);

module.exports = router;

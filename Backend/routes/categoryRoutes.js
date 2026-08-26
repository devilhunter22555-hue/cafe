const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');
const { checkPermission } = require('../middleware/roleMiddleware');
const {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');

const router = express.Router();
const managers = checkPermission(['owner', 'manager']);

router.use(authMiddleware, tenantMiddleware);
router.get('/', getCategories);
router.post('/', managers, createCategory);
router.patch('/:id', managers, updateCategory);
router.delete('/:id', managers, deleteCategory);

module.exports = router;

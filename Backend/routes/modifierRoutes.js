const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');
const { checkPermission } = require('../middleware/roleMiddleware');
const {
  createModifierGroup,
  getModifierGroups,
  updateModifierGroup,
  deleteModifierGroup
} = require('../controllers/modifierController');

const router = express.Router();
const managers = checkPermission(['owner', 'manager']);

router.use(authMiddleware, tenantMiddleware);
router.get('/', getModifierGroups);
router.post('/', managers, createModifierGroup);
router.patch('/:id', managers, updateModifierGroup);
router.delete('/:id', managers, deleteModifierGroup);

module.exports = router;

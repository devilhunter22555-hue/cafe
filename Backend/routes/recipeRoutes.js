const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');
const { checkPermission } = require('../middleware/roleMiddleware');
const { upsertRecipe, getRecipe, deleteRecipe } = require('../controllers/recipeController');

const router = express.Router();
const managers = checkPermission(['owner', 'manager']);

router.use(authMiddleware, tenantMiddleware, managers);
router.put('/:menuItemId', upsertRecipe);
router.get('/:menuItemId', getRecipe);
router.delete('/:menuItemId', deleteRecipe);

module.exports = router;
const ModifierGroup = require('../models/ModifierGroup');

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function createModifierGroup(req, res, next) {
  try {
    const modifierGroup = await ModifierGroup.create({
      name: req.body.name,
      options: req.body.options,
      isRequired: req.body.isRequired,
      maxSelect: req.body.maxSelect,
      restaurantId: req.restaurantId,
      branchId: req.branchId
    });

    res.status(201).json({ success: true, data: modifierGroup, message: 'Modifier group created successfully' });
  } catch (error) {
    next(error);
  }
}

async function getModifierGroups(req, res, next) {
  try {
    const modifierGroups = await ModifierGroup.find({
      restaurantId: req.restaurantId,
      branchId: req.branchId
    });

    res.json({ success: true, data: modifierGroups, message: 'Modifier groups fetched successfully' });
  } catch (error) {
    next(error);
  }
}

async function updateModifierGroup(req, res, next) {
  try {
    const modifierGroup = await ModifierGroup.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.restaurantId, branchId: req.branchId },
      {
        $set: {
          name: req.body.name,
          options: req.body.options,
          isRequired: req.body.isRequired,
          maxSelect: req.body.maxSelect
        }
      },
      { new: true, runValidators: true }
    );
    if (!modifierGroup) throw createError('Modifier group not found', 404);

    res.json({ success: true, data: modifierGroup, message: 'Modifier group updated successfully' });
  } catch (error) {
    next(error);
  }
}

async function deleteModifierGroup(req, res, next) {
  try {
    const modifierGroup = await ModifierGroup.findOneAndDelete({
      _id: req.params.id,
      restaurantId: req.restaurantId,
      branchId: req.branchId
    });
    if (!modifierGroup) throw createError('Modifier group not found', 404);

    res.json({ success: true, data: modifierGroup, message: 'Modifier group deleted successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = { createModifierGroup, getModifierGroups, updateModifierGroup, deleteModifierGroup };

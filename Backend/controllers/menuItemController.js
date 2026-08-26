const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');
const Category = require('../models/Category');

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

const itemFields = [
  'categoryId', 'name', 'description', 'price', 'isVeg', 'isAvailable',
  'taxSlab', 'modifierGroups', 'imageUrl'
];

function bodyFields(body) {
  return itemFields.reduce((fields, field) => {
    if (body[field] !== undefined) fields[field] = body[field];
    return fields;
  }, {});
}

async function createMenuItem(req, res, next) {
  try {
    const { categoryId } = req.body;
    if (!mongoose.isValidObjectId(categoryId)) throw createError('Valid categoryId is required', 400);

    const category = await Category.findOne({
      _id: categoryId,
      restaurantId: req.restaurantId,
      branchId: req.branchId
    });
    if (!category) throw createError('Category not found for this tenant and branch', 400);

    const menuItem = await MenuItem.create({
      ...bodyFields(req.body),
      restaurantId: req.restaurantId,
      branchId: req.branchId
    });

    res.status(201).json({ success: true, data: menuItem, message: 'Menu item created successfully' });
  } catch (error) {
    next(error);
  }
}

async function getMenuItems(req, res, next) {
  try {
    const filter = {
      restaurantId: req.restaurantId,
      branchId: req.branchId,
      isAvailable: true
    };
    if (req.query.categoryId) {
      if (!mongoose.isValidObjectId(req.query.categoryId)) throw createError('Invalid categoryId', 400);
      filter.categoryId = req.query.categoryId;
    }

    const menuItems = await MenuItem.find(filter)
      .populate('categoryId')
      .populate('modifierGroups');

    res.json({ success: true, data: menuItems, message: 'Menu items fetched successfully' });
  } catch (error) {
    console.error(error);
    next(error);
  }
}

async function updateMenuItem(req, res, next) {
  try {
    if (req.body.categoryId) {
      if (!mongoose.isValidObjectId(req.body.categoryId)) throw createError('Invalid categoryId', 400);
      const category = await Category.findOne({
        _id: req.body.categoryId,
        restaurantId: req.restaurantId,
        branchId: req.branchId
      });
      if (!category) throw createError('Category not found for this tenant and branch', 400);
    }

    const menuItem = await MenuItem.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.restaurantId, branchId: req.branchId },
      { $set: bodyFields(req.body) },
      { new: true, runValidators: true }
    );
    if (!menuItem) throw createError('Menu item not found', 404);

    res.json({ success: true, data: menuItem, message: 'Menu item updated successfully' });
  } catch (error) {
    next(error);
  }
}

async function toggleAvailability(req, res, next) {
  try {
    if (typeof req.body.isAvailable !== 'boolean') {
      throw createError('isAvailable must be a boolean', 400);
    }

    const menuItem = await MenuItem.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.restaurantId, branchId: req.branchId },
      { $set: { isAvailable: req.body.isAvailable } },
      { new: true, runValidators: true }
    );
    if (!menuItem) throw createError('Menu item not found', 404);

    res.json({ success: true, data: menuItem, message: 'Menu item availability updated successfully' });
  } catch (error) {
    next(error);
  }
}

async function deleteMenuItem(req, res, next) {
  try {
    const menuItem = await MenuItem.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.restaurantId, branchId: req.branchId },
      { $set: { isAvailable: false } },
      { new: true, runValidators: true }
    );
    if (!menuItem) throw createError('Menu item not found', 404);

    res.json({ success: true, data: menuItem, message: 'Menu item deleted successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createMenuItem,
  getMenuItems,
  updateMenuItem,
  toggleAvailability,
  deleteMenuItem
};

const Category = require('../models/Category');

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function createCategory(req, res, next) {
  try {
    const category = await Category.create({
      name: req.body.name,
      sortOrder: req.body.sortOrder,
      restaurantId: req.restaurantId,
      branchId: req.branchId
    });

    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully'
    });
  } catch (error) {
    next(error);
  }
}

async function getCategories(req, res, next) {
  try {
    const categories = await Category.find({
      restaurantId: req.restaurantId,
      branchId: req.branchId,
      isActive: true
    }).sort({ sortOrder: 1 });

    res.json({
      success: true,
      data: categories,
      message: 'Categories fetched successfully'
    });
  } catch (error) {
    next(error);
  }
}

async function updateCategory(req, res, next) {
  try {
    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.restaurantId, branchId: req.branchId },
      { $set: { name: req.body.name, sortOrder: req.body.sortOrder } },
      { new: true, runValidators: true }
    );
    if (!category) throw createError('Category not found', 404);

    res.json({ success: true, data: category, message: 'Category updated successfully' });
  } catch (error) {
    next(error);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.restaurantId, branchId: req.branchId },
      { $set: { isActive: false } },
      { new: true, runValidators: true }
    );
    if (!category) throw createError('Category not found', 404);

    res.json({ success: true, data: category, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = { createCategory, getCategories, updateCategory, deleteCategory };

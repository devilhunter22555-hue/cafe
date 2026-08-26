const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');

async function getPublicMenu(req, res, next) {
  try {
    const tenantFilter = {
      restaurantId: req.customer.restaurantId,
      branchId: req.customer.branchId
    };
    const [categories, items] = await Promise.all([
      Category.find({ ...tenantFilter, isActive: true }).sort({ sortOrder: 1 }).lean(),
      MenuItem.find({ ...tenantFilter, isAvailable: true })
        .populate('categoryId', 'name sortOrder')
        .lean()
    ]);

    res.json({
      success: true,
      data: { categories, items },
      message: 'Menu fetched successfully'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getPublicMenu };
function tenantMiddleware(req, res, next) {
  if (!req.user || !req.user.restaurantId) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Tenant context missing'
    });
  }

  req.restaurantId = req.user.restaurantId;
  req.branchId = req.user.branchId;
  next();
}

module.exports = tenantMiddleware;

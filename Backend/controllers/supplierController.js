const Supplier = require('../models/Supplier');

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function createSupplier(req, res, next) {
  try {
    const { name, contactPerson, phone, email, address } = req.body;
    if (!name) {
      throw createError('Supplier name is required', 400);
    }

    const supplier = await Supplier.create({
      name,
      contactPerson,
      phone,
      email,
      address,
      restaurantId: req.restaurantId,
      branchId: req.branchId
    });

    res.status(201).json({
      success: true,
      data: supplier,
      message: 'Supplier created successfully'
    });
  } catch (error) {
    next(error);
  }
}

async function getSuppliers(req, res, next) {
  try {
    const suppliers = await Supplier.find({
      restaurantId: req.restaurantId,
      branchId: req.branchId,
      isActive: true
    }).sort({ name: 1 });

    res.json({ success: true, data: suppliers, message: 'Suppliers fetched successfully' });
  } catch (error) {
    next(error);
  }
}

async function updateSupplier(req, res, next) {
  try {
    const supplier = await Supplier.findOne({
      _id: req.params.id,
      restaurantId: req.restaurantId,
      branchId: req.branchId,
      isActive: true
    });

    if (!supplier) throw createError('Supplier not found', 404);

    const { name, contactPerson, phone, email, address } = req.body;
    if (name !== undefined) supplier.name = name;
    if (contactPerson !== undefined) supplier.contactPerson = contactPerson;
    if (phone !== undefined) supplier.phone = phone;
    if (email !== undefined) supplier.email = email;
    if (address !== undefined) supplier.address = address;

    await supplier.save();

    res.json({
      success: true,
      data: supplier,
      message: 'Supplier updated successfully'
    });
  } catch (error) {
    next(error);
  }
}

async function deleteSupplier(req, res, next) {
  try {
    const supplier = await Supplier.findOne({
      _id: req.params.id,
      restaurantId: req.restaurantId,
      branchId: req.branchId,
      isActive: true
    });

    if (!supplier) throw createError('Supplier not found', 404);

    supplier.isActive = false;
    await supplier.save();

    res.json({
      success: true,
      data: supplier,
      message: 'Supplier deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { createSupplier, getSuppliers, updateSupplier, deleteSupplier };

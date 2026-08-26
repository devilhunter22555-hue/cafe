const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const OtpSession = require('../models/OtpSession');
const Table = require('../models/Table');

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function getOtp() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

async function findTableByQrToken(qrToken) {
  return Table.collection.findOne({ qrToken, isActive: true });
}

async function requestOtp(req, res, next) {
  try {
    const { qrToken, phone } = req.body;
    if (!qrToken || !phone) throw createError('qrToken and phone are required', 400);

    const table = await findTableByQrToken(qrToken);
    if (!table) throw createError('Invalid QR code', 404);

    const otp = getOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await OtpSession.create({
      phone,
      otp,
      restaurantId: table.restaurantId,
      tableId: table._id,
      expiresAt
    });

    console.log(`Customer OTP for ${phone}: ${otp}`);
    res.json({
      success: true,
      data: { devOtp: otp }, // Temporary development-only OTP response.
      message: 'OTP sent'
    });
  } catch (error) {
    next(error);
  }
}

async function verifyOtp(req, res, next) {
  try {
    const { qrToken, phone, otp } = req.body;
    if (!qrToken || !phone || !otp) {
      throw createError('qrToken, phone, and otp are required', 400);
    }

    const table = await findTableByQrToken(qrToken);
    if (!table) throw createError('Invalid QR code', 404);

    const otpSession = await OtpSession.findOne({
      phone,
      otp: String(otp),
      restaurantId: table.restaurantId,
      tableId: table._id,
      verified: false,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });
    if (!otpSession) throw createError('Invalid or expired OTP', 400);

    otpSession.verified = true;
    await otpSession.save();

    const customer = await Customer.findOneAndUpdate(
      { phone, restaurantId: table.restaurantId },
      { $setOnInsert: { phone, restaurantId: table.restaurantId } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    const token = jwt.sign({
      customerId: customer._id,
      restaurantId: table.restaurantId,
      branchId: table.branchId,
      tableId: table._id,
      phone
    }, process.env.JWT_ACCESS_SECRET, { expiresIn: '4h' });

    res.json({
      success: true,
      data: { token, customer, table },
      message: 'OTP verified successfully'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { requestOtp, verifyOtp };
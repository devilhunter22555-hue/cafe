require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const SuperAdmin = require('../models/SuperAdmin');

async function seedSuperAdmin() {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('Missing SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD in .env');
    process.exit(1);
  }

  try {
    await connectDB();

    const existing = await SuperAdmin.findOne({ email: email.toLowerCase() });
    if (existing) {
      console.log(`Super admin already exists for ${email}`);
      return process.exit(0);
    }

    const superAdmin = await SuperAdmin.create({
      name: 'Platform Owner',
      email: email.toLowerCase(),
      password,
      isActive: true
    });

    console.log(`Created super admin: ${superAdmin.email}`);
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed super admin:', error.message);
    process.exit(1);
  }
}

seedSuperAdmin();

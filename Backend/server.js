require('dotenv').config();

const http = require('http');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const modifierRoutes = require('./routes/modifierRoutes');
const menuItemRoutes = require('./routes/menuItemRoutes');
const tableRoutes = require('./routes/tableRoutes');
const orderRoutes = require('./routes/orderRoutes');
const kitchenRoutes = require('./routes/kitchenRoutes');
const customerAuthRoutes = require('./routes/customerAuthRoutes');
const customerRoutes = require('./routes/customerRoutes');
const customerCrmRoutes = require('./routes/customerCrmRoutes');
const billRoutes = require('./routes/billRoutes');
const reportRoutes = require('./routes/reportRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const recipeRoutes = require('./routes/recipeRoutes');
const staffRoutes = require('./routes/staffRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const purchaseOrderRoutes = require('./routes/purchaseOrderRoutes');
const insightsRoutes = require('./routes/insightsRoutes');
const couponRoutes = require('./routes/couponRoutes');
const errorHandler = require('./middleware/errorHandler');

const requiredEnvVars = ['MONGO_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

if (process.env.JWT_ACCESS_SECRET && process.env.JWT_ACCESS_SECRET.length < 32) {
  console.warn('WARNING: JWT_ACCESS_SECRET is shorter than 32 characters. Use a long random secret in production.');
}
if (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.length < 32) {
  console.warn('WARNING: JWT_REFRESH_SECRET is shorter than 32 characters. Use a long random secret in production.');
}

const app = express();
const httpServer = http.createServer(app);
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  process.env.CUSTOMER_APP_URL || 'http://localhost:5174'
];
const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true
};
const io = new Server(httpServer, { cors: corsOptions });

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    message: 'Too many login attempts. Please try again in 15 minutes.',
    statusCode: 429
  },
  keyGenerator: ipKeyGenerator
});

const registerRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    message: 'Too many registration attempts. Please try again in 15 minutes.',
    statusCode: 429
  },
  keyGenerator: ipKeyGenerator
});

const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    message: 'Too many requests from this IP. Please try again later.',
    statusCode: 429
  },
  keyGenerator: ipKeyGenerator
});

const otpRequestRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    message: 'Too many OTP requests for this phone number. Please try again in 10 minutes.',
    statusCode: 429
  },
  keyGenerator: (req) => String(req.body?.phone || req.ip || 'unknown-phone').trim().toLowerCase()
});

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(mongoSanitize());
app.use(cookieParser());
app.use('/api/auth/login', loginRateLimiter);
app.use('/api/auth/register', registerRateLimiter);
app.use('/api/customer/request-otp', otpRequestRateLimiter);
app.use('/api', apiRateLimiter);

io.on('connection', (socket) => {
  socket.on('join-branch', (branchId) => {
    socket.join(`branch_${branchId}`);
  });
});

app.set('io', io);

app.get('/api/health', (req, res) => {
  res.json({ success: true, data: null, message: 'Server running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/modifiers', modifierRoutes);
app.use('/api/menu-items', menuItemRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/kitchen', kitchenRoutes);
app.use('/api/customer', customerAuthRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/customers', customerCrmRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/insights', insightsRoutes);
app.use(errorHandler);

const port = process.env.PORT || 5000;

connectDB().then(() => {
  httpServer.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
});

module.exports = { app, httpServer, io };

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const { testConnection, sequelize } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const courseRoutes = require('./routes/courses');
const attendanceRoutes = require('./routes/attendance');
const faceRoutes = require('./routes/face');
const analyticsRoutes = require('./routes/analytics');
const insightsRoutes = require('./routes/insights');
const notificationRoutes = require('./routes/notifications');
const reportRoutes = require('./routes/reports');
const adminRoutes = require('./routes/admin');
const correctionRoutes = require('./routes/corrections');

const app = express();
const PORT = process.env.PORT || 5000;

// Create required directories
const dirs = [
  process.env.UPLOAD_PATH || './uploads',
  './data',
  './models'
];
dirs.forEach(dir => {
  const dirPath = path.isAbsolute(dir) ? dir : path.join(__dirname, '..', dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173'];
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000 || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/models', express.static(path.join(__dirname, '../models')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Face Recognition Attendance System API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/face', faceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/corrections', correctionRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handler
app.use(errorHandler);

// Initialize server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();

    // Sync database models (creates tables automatically)
    await sequelize.sync();
    console.log('Database tables created/synchronized.');

    app.listen(PORT, () => {
      console.log(`\n========================================`);
      console.log(`  Server running on port ${PORT}`);
      console.log(`  Mode: ${process.env.NODE_ENV}`);
      console.log(`  API: http://localhost:${PORT}/api`);
      console.log(`========================================\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
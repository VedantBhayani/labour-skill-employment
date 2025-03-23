const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const http = require('http');

// Load configuration
const config = require('./config/config');
const { connectDB } = require('./config/database');
const { initializeSocketServer } = require('./services/socket.service');
const schedulerService = require('./services/scheduler.service');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const departmentRoutes = require('./routes/department.routes');
const taskRoutes = require('./routes/task.routes');
const documentRoutes = require('./routes/document.routes');
const grievanceRoutes = require('./routes/grievance.routes');
const auditRoutes = require('./routes/audit.routes');
const statsRoutes = require('./routes/stats.routes');
const messageRoutes = require('./routes/message.routes');
const notificationRoutes = require('./routes/notification.routes');
const forumRoutes = require('./routes/forum.routes');
const workflowRoutes = require('./routes/workflow.routes');
const analyticsRoutes = require('./routes/analytics.routes');

// Initialize Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', config.uploadPath);
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies

// Logging
if (config.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/grievances', grievanceRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/analytics', analyticsRoutes);

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, '..', config.uploadPath)));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString(),
    environment: config.env
  });
});

// Error handling middleware
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    stack: config.env === 'development' ? err.stack : undefined
  });
});

// Initialize Socket.IO server
const io = initializeSocketServer(server);
// Make io accessible globally
global.io = io;

// Initialize the scheduled reports service
schedulerService.initScheduler();

// Start server
const PORT = config.port;
server.listen(PORT, () => {
  console.log(`REST API server running on port ${PORT}`);
  console.log(`WebSocket server initialized`);
  console.log(`Scheduled reports service initialized`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM signal (e.g., Heroku shutdown)
process.on('SIGTERM', () => {
  console.log('SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    console.log('Process terminated!');
  });
});

module.exports = server; // Export for testing 
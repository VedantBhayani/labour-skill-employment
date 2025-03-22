const express = require('express');
const statsController = require('../controllers/stats.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Dashboard statistics - available to all authenticated users
router.get('/dashboard', statsController.getDashboardStats);

// System statistics - admin only
router.get('/system', authorize('admin'), statsController.getSystemStats);

module.exports = router; 
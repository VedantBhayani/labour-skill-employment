const express = require('express');
const notificationController = require('../controllers/notification.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get current user's notifications
router.get('/', notificationController.getNotifications);

// Get unread notification count
router.get('/unread-count', notificationController.getUnreadCount);

// Mark all notifications as read
router.patch('/mark-all-read', notificationController.markAllAsRead);

// Mark a notification as read
router.patch('/:notificationId/read', notificationController.markAsRead);

// Delete a notification
router.delete('/:notificationId', notificationController.deleteNotification);

// Create and send notifications (admin only)
router.post('/', authorizeRoles(['admin']), notificationController.createNotification);

module.exports = router; 
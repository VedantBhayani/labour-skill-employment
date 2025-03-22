const express = require('express');
const messageController = require('../controllers/message.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all conversations for the current user
router.get('/conversations', messageController.getConversations);

// Get unread message count
router.get('/unread-count', messageController.getUnreadCount);

// Get messages for a specific conversation
router.get('/:receiverId', messageController.getMessages);

// Send a new message
router.post('/', messageController.uploadAttachments, messageController.sendMessage);

// Mark a message as read
router.patch('/:messageId/read', messageController.markAsRead);

// Delete a message
router.delete('/:messageId', messageController.deleteMessage);

module.exports = router; 
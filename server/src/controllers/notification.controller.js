const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const mongoose = require('mongoose');
const { sendNotificationToUser } = require('../services/socket.service');

// Get current user's notifications
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const unreadOnly = req.query.unreadOnly === 'true';
    
    const query = { recipient: userId };
    if (unreadOnly) {
      query.read = false;
    }
    
    const options = {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: [
        { path: 'sender', select: 'name email avatar' }
      ]
    };
    
    const notifications = await Notification.paginate(query, options);
    
    res.status(200).json({
      status: 'success',
      data: notifications
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get notifications'
    });
  }
};

// Get unread notification count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const count = await Notification.countDocuments({
      recipient: userId,
      read: false
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        unreadCount: count
      }
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get unread count'
    });
  }
};

// Mark a notification as read
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { notificationId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid notification ID'
      });
    }
    
    const notification = await Notification.findById(notificationId);
    
    if (!notification) {
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found'
      });
    }
    
    // Only the recipient can mark as read
    if (notification.recipient.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized to mark this notification as read'
      });
    }
    
    await notification.markAsRead();
    
    res.status(200).json({
      status: 'success',
      data: {
        notification
      }
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark notification as read'
    });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    
    await Notification.markAllAsRead(userId);
    
    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark all notifications as read'
    });
  }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user._id;
    const { notificationId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid notification ID'
      });
    }
    
    const notification = await Notification.findById(notificationId);
    
    if (!notification) {
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found'
      });
    }
    
    // Only the recipient can delete
    if (notification.recipient.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized to delete this notification'
      });
    }
    
    await notification.deleteOne();
    
    res.status(200).json({
      status: 'success',
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete notification'
    });
  }
};

// Create and send a new notification (admin only)
exports.createNotification = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only administrators can create system notifications'
      });
    }
    
    const { 
      recipients, // array of user IDs or 'all'
      type, 
      title, 
      content, 
      priority = 'medium',
      entityId,
      entityType,
      metadata
    } = req.body;
    
    if (!title || !content || !type) {
      return res.status(400).json({
        status: 'error',
        message: 'Title, content, and type are required'
      });
    }
    
    let userIds = [];
    
    // Handle 'all' recipients
    if (recipients === 'all') {
      const users = await User.find({}, '_id');
      userIds = users.map(user => user._id);
    } 
    // Handle array of user IDs
    else if (Array.isArray(recipients) && recipients.length > 0) {
      userIds = recipients.filter(id => mongoose.Types.ObjectId.isValid(id));
      
      if (userIds.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'No valid user IDs provided'
        });
      }
    } 
    // Handle single user ID
    else if (recipients && mongoose.Types.ObjectId.isValid(recipients)) {
      userIds = [recipients];
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'Recipients must be "all" or an array of valid user IDs'
      });
    }
    
    // Create notifications for each user
    const notifications = [];
    for (const userId of userIds) {
      const notification = new Notification({
        recipient: userId,
        sender: req.user._id,
        type,
        title,
        content,
        priority,
        data: {
          entityId: entityId || req.user._id,
          entityType: entityType || 'User',
          metadata: metadata || {}
        }
      });
      
      await notification.save();
      notifications.push(notification);
      
      // Send real-time notification if socket service is available
      if (global.io) {
        await sendNotificationToUser(userId, notification);
      }
    }
    
    res.status(201).json({
      status: 'success',
      message: `Sent notifications to ${notifications.length} users`,
      data: {
        count: notifications.length
      }
    });
  } catch (error) {
    console.error('Error creating notifications:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create notifications'
    });
  }
}; 
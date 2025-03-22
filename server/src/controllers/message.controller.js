const Message = require('../models/message.model');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');
const mongoose = require('mongoose');
const config = require('../config/config');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../', config.uploadPath, 'message-attachments');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'msg-' + uniqueSuffix + ext);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Accept images, documents, and audio files
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'audio/mpeg', 'audio/wav', 'audio/ogg'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not supported'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max size
  }
});

// Get conversations
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await Message.findConversations(userId);
    
    res.status(200).json({
      status: 'success',
      results: conversations.length,
      data: {
        conversations
      }
    });
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get conversations'
    });
  }
};

// Get messages for a conversation
exports.getMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { receiverId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid receiver ID'
      });
    }
    
    // Create conversation ID
    const conversationId = Message.createConversationId(userId, receiverId);
    
    // Get page and limit from query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Get messages for conversation
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name email avatar')
      .populate('receiver', 'name email avatar');
    
    // Get total count
    const total = await Message.countDocuments({ conversationId });
    
    // Mark unread messages as read
    await Message.updateMany(
      { 
        conversationId, 
        receiver: userId,
        read: false
      },
      {
        read: true,
        readAt: new Date()
      }
    );
    
    // Get user details
    const receiver = await User.findById(receiverId, 'name email avatar isOnline lastActive');
    
    res.status(200).json({
      status: 'success',
      data: {
        messages: messages.reverse(), // Reverse to get oldest first
        receiver,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get messages'
    });
  }
};

// Send a new message (REST API route)
exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { receiverId, content } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid receiver ID'
      });
    }
    
    if (!content || content.trim() === '') {
      return res.status(400).json({
        status: 'error',
        message: 'Message content cannot be empty'
      });
    }
    
    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        status: 'error',
        message: 'Receiver not found'
      });
    }
    
    // Create conversation ID
    const conversationId = Message.createConversationId(senderId, receiverId);
    
    // Prepare attachments if any from request
    const attachments = req.files?.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: `/uploads/message-attachments/${file.filename}`,
      mimeType: file.mimetype,
      size: file.size
    })) || [];
    
    // Create new message
    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      content,
      attachments,
      conversationId
    });
    
    await message.save();
    
    // Populate sender details
    await message.populate('sender', 'name email avatar');
    
    // Create notification for receiver
    const notification = new Notification({
      recipient: receiverId,
      sender: senderId,
      type: 'MESSAGE',
      title: 'New Message',
      content: `${req.user.name} sent you a message`,
      data: {
        entityId: message._id,
        entityType: 'Message',
        metadata: {
          senderName: req.user.name,
          messagePreview: content.substring(0, 50) + (content.length > 50 ? '...' : '')
        }
      }
    });
    
    await notification.save();
    
    // Send real-time notification if socket service is available and user is online
    if (global.io) {
      const { sendNotificationToUser } = require('../services/socket.service');
      
      // Send to receiver
      await sendNotificationToUser(receiverId, notification);
      
      // Also emit the message to the receiver
      const io = global.io;
      io.to(`user:${receiverId}`).emit('message:received', message);
    }
    
    res.status(201).json({
      status: 'success',
      data: {
        message
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to send message'
    });
  }
};

// Mark a message as read
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { messageId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid message ID'
      });
    }
    
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({
        status: 'error',
        message: 'Message not found'
      });
    }
    
    // Only the receiver can mark as read
    if (message.receiver.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized to mark this message as read'
      });
    }
    
    message.read = true;
    message.readAt = new Date();
    await message.save();
    
    // Notify the sender that the message was read if socket service is available
    if (global.io) {
      const io = global.io;
      io.to(`user:${message.sender.toString()}`).emit('message:read', { messageId });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        message
      }
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark message as read'
    });
  }
};

// Get unread message count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const count = await Message.countDocuments({
      receiver: userId,
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

// Delete message
exports.deleteMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { messageId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid message ID'
      });
    }
    
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({
        status: 'error',
        message: 'Message not found'
      });
    }
    
    // Only the sender can delete a message
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized to delete this message'
      });
    }
    
    // Delete any attachments
    if (message.attachments && message.attachments.length > 0) {
      message.attachments.forEach(attachment => {
        const filePath = path.join(__dirname, '../../', attachment.path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }
    
    await message.deleteOne();
    
    // Notify the receiver about the deletion if socket service is available
    if (global.io) {
      const io = global.io;
      io.to(`user:${message.receiver.toString()}`).emit('message:deleted', { messageId });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete message'
    });
  }
};

// Middleware for handling file uploads
exports.uploadAttachments = upload.array('attachments', 5); // Allow up to 5 attachments 
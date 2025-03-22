const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Message = require('../models/message.model');
const Notification = require('../models/notification.model');
const ForumPost = require('../models/forumPost.model');
const config = require('../config/config');

// Store connected users: { userId: socketId }
const connectedUsers = {};

// Initialize Socket.IO
function initializeSocketServer(server) {
  const io = socketIo(server, {
    cors: {
      origin: config.corsOrigin,
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || 
                   socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication token is required'));
      }
      
      // Verify the token
      const decoded = jwt.verify(token, config.jwt.secret);
      
      // Get user from database
      const user = await User.findById(decoded.userId);
      if (!user) {
        return next(new Error('User not found'));
      }
      
      // Attach user to socket
      socket.user = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      };
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error.message);
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user._id}`);
    
    // Store the user's connection
    connectedUsers[socket.user._id] = socket.id;
    
    // Update user's online status
    User.findByIdAndUpdate(socket.user._id, { isOnline: true, lastActive: new Date() })
      .catch(err => console.error('Error updating user status:', err));
    
    // Broadcast online users to all connected clients
    io.emit('users:online', Object.keys(connectedUsers));
    
    // PRIVATE MESSAGING
    
    // Join user to their personal room for direct messages
    socket.join(`user:${socket.user._id}`);
    
    // Handle private messages
    socket.on('message:send', async (data) => {
      try {
        const { receiverId, content, attachments = [] } = data;
        
        if (!receiverId || !content) {
          return socket.emit('error', { message: 'Receiver ID and content are required' });
        }
        
        // Create conversation ID
        const conversationId = Message.createConversationId(socket.user._id, receiverId);
        
        // Create new message
        const message = new Message({
          sender: socket.user._id,
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
          sender: socket.user._id,
          type: 'MESSAGE',
          title: 'New Message',
          content: `${socket.user.name} sent you a message`,
          data: {
            entityId: message._id,
            entityType: 'Message',
            metadata: {
              senderName: socket.user.name,
              messagePreview: content.substring(0, 50) + (content.length > 50 ? '...' : '')
            }
          }
        });
        
        await notification.save();
        
        // Send to the receiver if they are online
        if (connectedUsers[receiverId]) {
          io.to(`user:${receiverId}`).emit('message:received', message);
          io.to(`user:${receiverId}`).emit('notification:new', notification);
        }
        
        // Also send back to the sender to confirm
        socket.emit('message:sent', message);
        
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });
    
    // Mark messages as read
    socket.on('message:markRead', async (data) => {
      try {
        const { messageId } = data;
        
        if (!messageId) {
          return socket.emit('error', { message: 'Message ID is required' });
        }
        
        const message = await Message.findById(messageId);
        
        if (!message) {
          return socket.emit('error', { message: 'Message not found' });
        }
        
        // Only the receiver can mark as read
        if (message.receiver.toString() !== socket.user._id.toString()) {
          return socket.emit('error', { message: 'Unauthorized to mark this message as read' });
        }
        
        message.read = true;
        message.readAt = new Date();
        await message.save();
        
        // Notify the sender that the message was read
        if (connectedUsers[message.sender.toString()]) {
          io.to(`user:${message.sender.toString()}`).emit('message:read', { messageId });
        }
        
        socket.emit('message:read:confirm', { messageId });
        
      } catch (error) {
        console.error('Error marking message as read:', error);
        socket.emit('error', { message: 'Failed to mark message as read' });
      }
    });
    
    // Get user's conversations
    socket.on('conversations:get', async () => {
      try {
        const conversations = await Message.findConversations(socket.user._id);
        socket.emit('conversations:list', conversations);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        socket.emit('error', { message: 'Failed to fetch conversations' });
      }
    });
    
    // NOTIFICATIONS
    
    // Get user's notifications
    socket.on('notifications:get', async (data) => {
      try {
        const { page = 1, limit = 20, unreadOnly = false } = data || {};
        
        const query = { recipient: socket.user._id };
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
        socket.emit('notifications:list', notifications);
        
      } catch (error) {
        console.error('Error fetching notifications:', error);
        socket.emit('error', { message: 'Failed to fetch notifications' });
      }
    });
    
    // Mark notification as read
    socket.on('notification:markRead', async (data) => {
      try {
        const { notificationId } = data;
        
        if (!notificationId) {
          return socket.emit('error', { message: 'Notification ID is required' });
        }
        
        const notification = await Notification.findById(notificationId);
        
        if (!notification) {
          return socket.emit('error', { message: 'Notification not found' });
        }
        
        // Only the recipient can mark as read
        if (notification.recipient.toString() !== socket.user._id.toString()) {
          return socket.emit('error', { message: 'Unauthorized to mark this notification as read' });
        }
        
        await notification.markAsRead();
        socket.emit('notification:read:confirm', { notificationId });
        
      } catch (error) {
        console.error('Error marking notification as read:', error);
        socket.emit('error', { message: 'Failed to mark notification as read' });
      }
    });
    
    // Mark all notifications as read
    socket.on('notifications:markAllRead', async () => {
      try {
        await Notification.markAllAsRead(socket.user._id);
        socket.emit('notifications:allRead:confirm');
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
        socket.emit('error', { message: 'Failed to mark all notifications as read' });
      }
    });
    
    // FORUM ACTIVITY
    
    // Join forum topic room when user views a topic
    socket.on('forum:joinTopic', (topicId) => {
      socket.join(`forum:topic:${topicId}`);
    });
    
    // Leave forum topic room
    socket.on('forum:leaveTopic', (topicId) => {
      socket.leave(`forum:topic:${topicId}`);
    });
    
    // Real-time new post notifications
    socket.on('forum:typing', (data) => {
      const { topicId } = data;
      socket.to(`forum:topic:${topicId}`).emit('forum:userTyping', {
        userId: socket.user._id,
        userName: socket.user.name,
        topicId
      });
    });
    
    // DISCONNECT
    
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user._id}`);
      
      // Remove user from connected users
      delete connectedUsers[socket.user._id];
      
      // Update user's online status
      User.findByIdAndUpdate(socket.user._id, { 
        isOnline: false, 
        lastActive: new Date() 
      }).catch(err => console.error('Error updating user status:', err));
      
      // Broadcast updated online users
      io.emit('users:online', Object.keys(connectedUsers));
    });
  });

  return io;
}

// Utility function to send notification to a specific user
async function sendNotificationToUser(userId, notification) {
  if (connectedUsers[userId]) {
    const io = global.io; // Access the global io instance
    io.to(`user:${userId}`).emit('notification:new', notification);
  }
}

// Utility function to send a system notification to all users or specific roles
async function sendSystemNotification(title, content, options = {}) {
  try {
    const { roles, departments, data = {} } = options;
    
    const query = {};
    
    // Filter by roles if specified
    if (roles && roles.length > 0) {
      query.role = { $in: roles };
    }
    
    // Filter by departments if specified
    if (departments && departments.length > 0) {
      query.department = { $in: departments };
    }
    
    // Find users matching criteria
    const users = await User.find(query, '_id');
    
    // Create notifications for each user
    const notifications = [];
    for (const user of users) {
      const notification = new Notification({
        recipient: user._id,
        type: 'SYSTEM',
        title,
        content,
        data: {
          entityId: data.entityId || user._id,
          entityType: data.entityType || 'User',
          metadata: data.metadata || {}
        }
      });
      
      await notification.save();
      notifications.push(notification);
      
      // Send real-time notification if user is online
      if (connectedUsers[user._id.toString()]) {
        const io = global.io;
        io.to(`user:${user._id.toString()}`).emit('notification:new', notification);
      }
    }
    
    return notifications;
  } catch (error) {
    console.error('Error sending system notification:', error);
    throw error;
  }
}

module.exports = {
  initializeSocketServer,
  sendNotificationToUser,
  sendSystemNotification,
  getConnectedUsers: () => Object.keys(connectedUsers)
}; 
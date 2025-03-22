const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate-v2');

const notificationSchema = new Schema({
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    required: true,
    enum: [
      'MESSAGE', 
      'TASK_ASSIGNED', 
      'TASK_UPDATED', 
      'DOCUMENT_SHARED',
      'GRIEVANCE_UPDATE',
      'GRIEVANCE_RESOLVED',
      'MENTION',
      'SYSTEM',
      'DEPARTMENT_ADDED',
      'FORUM_POST',
      'FORUM_REPLY'
    ]
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date,
    default: null
  },
  data: {
    // Reference to related document (task, message, document, etc.)
    entityId: {
      type: Schema.Types.ObjectId,
      required: true
    },
    entityType: {
      type: String,
      required: true,
      enum: ['Task', 'Message', 'Document', 'Grievance', 'Department', 'User', 'ForumPost', 'ForumTopic']
    },
    // Additional metadata specific to notification type
    metadata: {
      type: Schema.Types.Mixed
    }
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Indexes for faster queries
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ 'data.entityId': 1, 'data.entityType': 1 });

// Apply pagination plugin
notificationSchema.plugin(mongoosePaginate);

// Mark a notification as read
notificationSchema.methods.markAsRead = function() {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

// Mark multiple notifications as read for a user
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { recipient: userId, read: false },
    { read: true, readAt: new Date() }
  );
};

// Get unread notification count for a user
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ recipient: userId, read: false });
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification; 
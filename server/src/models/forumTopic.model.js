const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate-v2');

const forumTopicSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 5000
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  department: {
    type: Schema.Types.ObjectId,
    ref: 'Department'
  },
  tags: [{
    type: String,
    trim: true
  }],
  pinned: {
    type: Boolean,
    default: false
  },
  locked: {
    type: Boolean,
    default: false
  },
  postCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  lastPost: {
    post: {
      type: Schema.Types.ObjectId,
      ref: 'ForumPost'
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date
    }
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  accessControl: {
    // If set, only users from these departments can view/post
    departments: [{
      type: Schema.Types.ObjectId,
      ref: 'Department'
    }],
    // If set, only users with these roles can view/post
    roles: [{
      type: String,
      enum: ['admin', 'manager', 'employee']
    }]
  }
}, {
  timestamps: true
});

// Indexes for performance
forumTopicSchema.index({ createdAt: -1 });
forumTopicSchema.index({ lastActivity: -1 });
forumTopicSchema.index({ pinned: -1, lastActivity: -1 });
forumTopicSchema.index({ 'accessControl.departments': 1 });
forumTopicSchema.index({ 'accessControl.roles': 1 });
forumTopicSchema.index({ department: 1, lastActivity: -1 });
forumTopicSchema.index({ tags: 1 });
forumTopicSchema.index({ creator: 1 });

// Apply pagination plugin
forumTopicSchema.plugin(mongoosePaginate);

// Method to check if a user has access to this topic
forumTopicSchema.methods.canAccess = function(user) {
  // Public topics are accessible to all authenticated users
  if (!this.isPrivate) return true;
  
  // Admin users have access to all topics
  if (user.role === 'admin') return true;
  
  // Check department access
  if (this.accessControl.departments && this.accessControl.departments.length > 0) {
    if (!user.department || !this.accessControl.departments.includes(user.department.toString())) {
      return false;
    }
  }
  
  // Check role access
  if (this.accessControl.roles && this.accessControl.roles.length > 0) {
    if (!this.accessControl.roles.includes(user.role)) {
      return false;
    }
  }
  
  return true;
};

// Method to increment view count
forumTopicSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

// Method to update last activity and post count
forumTopicSchema.methods.updateActivity = function(post, user) {
  this.lastActivity = new Date();
  this.postCount += 1;
  this.lastPost = {
    post: post._id,
    user: user._id,
    createdAt: post.createdAt
  };
  return this.save();
};

const ForumTopic = mongoose.model('ForumTopic', forumTopicSchema);

module.exports = ForumTopic; 
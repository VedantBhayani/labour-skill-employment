const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate-v2');

const forumPostSchema = new Schema({
  topic: {
    type: Schema.Types.ObjectId,
    ref: 'ForumTopic',
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 10000
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    mimeType: String,
    size: Number
  }],
  parentPost: {
    type: Schema.Types.ObjectId,
    ref: 'ForumPost',
    default: null,
    index: true
  },
  // For nested comments/replies
  isReply: {
    type: Boolean,
    default: false
  },
  replyCount: {
    type: Number,
    default: 0
  },
  mentions: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  reactions: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['like', 'dislike', 'helpful', 'insightful', 'question']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  edited: {
    isEdited: {
      type: Boolean,
      default: false
    },
    lastEditedAt: {
      type: Date,
      default: null
    }
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  isPinned: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for performance
forumPostSchema.index({ topic: 1, createdAt: 1 });
forumPostSchema.index({ topic: 1, parentPost: 1 });
forumPostSchema.index({ mentions: 1 });
forumPostSchema.index({ 'reactions.user': 1 });

// Apply pagination plugin
forumPostSchema.plugin(mongoosePaginate);

// Pre-save hook to extract mentions
forumPostSchema.pre('save', async function(next) {
  // If post is new or content changed, extract mentions
  if (this.isNew || this.isModified('content')) {
    // Extract mentions in the format @userId
    const mentionRegex = /@([a-f\d]{24})/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(this.content)) !== null) {
      mentions.push(match[1]);
    }
    
    // Ensure unique mentions
    this.mentions = [...new Set(mentions)];
  }
  
  next();
});

// Method to add a reaction
forumPostSchema.methods.addReaction = async function(userId, reactionType) {
  // Check if user already reacted
  const existingReaction = this.reactions.find(
    reaction => reaction.user.toString() === userId.toString()
  );
  
  if (existingReaction) {
    if (existingReaction.type === reactionType) {
      // Remove reaction if clicking the same type again
      this.reactions = this.reactions.filter(
        reaction => reaction.user.toString() !== userId.toString()
      );
    } else {
      // Update reaction type
      existingReaction.type = reactionType;
      existingReaction.createdAt = new Date();
    }
  } else {
    // Add new reaction
    this.reactions.push({
      user: userId,
      type: reactionType,
      createdAt: new Date()
    });
  }
  
  return this.save();
};

// Method to increment reply count
forumPostSchema.methods.incrementReplyCount = function() {
  this.replyCount += 1;
  return this.save();
};

// Method to edit post
forumPostSchema.methods.editContent = function(newContent) {
  this.content = newContent;
  this.edited.isEdited = true;
  this.edited.lastEditedAt = new Date();
  return this.save();
};

// Method to soft delete a post
forumPostSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.content = '[This post has been deleted]';
  this.attachments = [];
  return this.save();
};

const ForumPost = mongoose.model('ForumPost', forumPostSchema);

module.exports = ForumPost; 
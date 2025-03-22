const mongoose = require('mongoose');

const grievanceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Grievance title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Grievance description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Grievance reporter is required'],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'rejected', 'escalated'],
      default: 'open',
    },
    category: {
      type: String,
      enum: ['work_conditions', 'discrimination', 'harassment', 'compensation', 'benefits', 'other'],
      default: 'other',
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    anonymous: {
      type: Boolean,
      default: false,
    },
    reportedDate: {
      type: Date,
      default: Date.now,
    },
    targetResolutionDate: {
      type: Date,
    },
    resolutionDate: {
      type: Date,
    },
    resolutionDetails: {
      type: String,
      trim: true,
      maxlength: [1000, 'Resolution details cannot exceed 1000 characters'],
    },
    attachments: [
      {
        name: String,
        path: String,
        mimeType: String,
        size: Number,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        text: {
          type: String,
          required: true,
          trim: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        isPrivate: {
          type: Boolean,
          default: false,
        },
      },
    ],
    history: [
      {
        action: {
          type: String,
          required: true,
          enum: ['create', 'update', 'assign', 'resolve', 'reject', 'escalate', 'comment'],
        },
        actor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        details: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    escalationLevel: {
      type: Number,
      min: 0,
      max: 3,
      default: 0,
    },
    escalationHistory: [
      {
        from: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        to: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        reason: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for age of grievance in days
grievanceSchema.virtual('ageInDays').get(function () {
  return Math.floor((Date.now() - this.reportedDate) / (1000 * 60 * 60 * 24));
});

// Virtual for time until target resolution
grievanceSchema.virtual('daysUntilResolution').get(function () {
  if (!this.targetResolutionDate) return null;
  const daysRemaining = Math.floor((this.targetResolutionDate - Date.now()) / (1000 * 60 * 60 * 24));
  return Math.max(0, daysRemaining);
});

// Virtual for overdue status
grievanceSchema.virtual('isOverdue').get(function () {
  if (!this.targetResolutionDate) return false;
  if (this.status === 'resolved' || this.status === 'rejected') return false;
  return Date.now() > this.targetResolutionDate;
});

// Method to add a comment to the grievance
grievanceSchema.methods.addComment = function (userId, text, isPrivate = false) {
  this.comments.push({
    user: userId,
    text,
    createdAt: Date.now(),
    isPrivate,
  });

  // Add to history
  this.history.push({
    action: 'comment',
    actor: userId,
    details: isPrivate ? 'Added a private comment' : 'Added a comment',
    timestamp: Date.now(),
  });

  return this.save();
};

// Method to escalate the grievance
grievanceSchema.methods.escalate = function (fromUserId, toUserId, reason) {
  this.escalationLevel += 1;
  this.status = 'escalated';
  this.assignedTo = toUserId;
  
  // Add to escalation history
  this.escalationHistory.push({
    from: fromUserId,
    to: toUserId,
    reason,
    timestamp: Date.now(),
  });

  // Add to general history
  this.history.push({
    action: 'escalate',
    actor: fromUserId,
    details: `Escalated to level ${this.escalationLevel}`,
    timestamp: Date.now(),
  });

  return this.save();
};

// Add indexes for common queries
grievanceSchema.index({ title: 'text', description: 'text' }); // Text search
grievanceSchema.index({ reporter: 1 });
grievanceSchema.index({ department: 1 });
grievanceSchema.index({ assignedTo: 1 });
grievanceSchema.index({ status: 1 });
grievanceSchema.index({ category: 1 });
grievanceSchema.index({ severity: 1 });
grievanceSchema.index({ reportedDate: 1 });
grievanceSchema.index({ escalationLevel: 1 });
grievanceSchema.index({ anonymous: 1 });
grievanceSchema.index({ isArchived: 1 });

const Grievance = mongoose.model('Grievance', grievanceSchema);

module.exports = Grievance; 
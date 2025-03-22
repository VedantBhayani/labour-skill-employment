const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Document creator is required'],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    fileType: {
      type: String,
      trim: true,
    },
    fileSize: {
      type: Number,
      min: 0,
    },
    filePath: {
      type: String,
      required: [true, 'Document file path is required'],
    },
    originalFilename: {
      type: String,
    },
    mimeType: {
      type: String,
    },
    documentType: {
      type: String,
      enum: ['report', 'policy', 'form', 'guide', 'other'],
      default: 'other',
    },
    access: {
      type: String,
      enum: ['public', 'department', 'restricted', 'private'],
      default: 'private',
    },
    status: {
      type: String, 
      enum: ['draft', 'published', 'archived', 'deleted'],
      default: 'published',
    },
    version: {
      type: Number,
      default: 1,
    },
    versionName: {
      type: String,
      default: 'v1.0',
    },
    versionNotes: String,
    previousVersions: [
      {
        version: Number,
        versionName: String,
        filePath: String,
        fileSize: Number,
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
        notes: String,
        reason: String,
      },
    ],
    approvalStatus: {
      type: String,
      enum: ['not_required', 'pending', 'approved', 'rejected', 'changes_requested'],
      default: 'not_required',
    },
    approvalWorkflow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkflowInstance',
    },
    approvers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        status: {
          type: String,
          enum: ['pending', 'approved', 'rejected', 'changes_requested'],
          default: 'pending',
        },
        comments: String,
        timestamp: {
          type: Date,
        },
      },
    ],
    tags: [String],
    favoriteBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    viewedBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    sharedWith: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        sharedAt: {
          type: Date,
          default: Date.now,
        },
        permission: {
          type: String,
          enum: ['read', 'edit', 'manage'],
          default: 'read',
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
      },
    ],
    expiryDate: {
      type: Date,
    },
    isTemplate: {
      type: Boolean,
      default: false,
    },
    confidentiality: {
      type: String,
      enum: ['public', 'internal', 'confidential', 'restricted'],
      default: 'internal',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field for document URL
documentSchema.virtual('documentUrl').get(function () {
  return `/api/documents/${this._id}/download`;
});

// Virtual field for view count
documentSchema.virtual('viewCount').get(function () {
  return this.viewedBy ? this.viewedBy.length : 0;
});

// Virtual field for favorite count
documentSchema.virtual('favoriteCount').get(function () {
  return this.favoriteBy ? this.favoriteBy.length : 0;
});

// Virtual field for download URL
documentSchema.virtual('downloadUrl').get(function () {
  return `/api/documents/${this._id}/download`;
});

// Method to add a view record for a user
documentSchema.methods.addView = function (userId) {
  // Check if user has already viewed
  const existingView = this.viewedBy.find(
    (view) => view.user.toString() === userId.toString()
  );

  if (existingView) {
    // Update view timestamp
    existingView.viewedAt = Date.now();
  } else {
    // Add new view record
    this.viewedBy.push({
      user: userId,
      viewedAt: Date.now(),
    });
  }
  return this.save();
};

// Method to toggle favorite for a user
documentSchema.methods.toggleFavorite = function (userId) {
  const userIndex = this.favoriteBy.findIndex(
    (id) => id.toString() === userId.toString()
  );

  if (userIndex === -1) {
    // Add to favorites
    this.favoriteBy.push(userId);
  } else {
    // Remove from favorites
    this.favoriteBy.splice(userIndex, 1);
  }
  return this.save();
};

// Method to share document with a user
documentSchema.methods.shareWith = function (userId, permission = 'read') {
  const existingShare = this.sharedWith.find(
    (share) => share.user.toString() === userId.toString()
  );

  if (existingShare) {
    // Update permission
    existingShare.permission = permission;
    existingShare.sharedAt = Date.now();
  } else {
    // Add new share record
    this.sharedWith.push({
      user: userId,
      permission,
      sharedAt: Date.now(),
    });
  }
  return this.save();
};

// Add new method to create a new version of the document
documentSchema.methods.createNewVersion = async function(updatedBy, filePath, fileSize, versionNotes, reason) {
  // Store current version in version history
  this.previousVersions.push({
    version: this.version,
    versionName: this.versionName,
    filePath: this.filePath,
    fileSize: this.fileSize,
    updatedBy,
    updatedAt: new Date(),
    notes: versionNotes,
    reason: reason,
  });
  
  // Update to new version
  this.version += 1;
  this.versionName = `v${this.version}.0`;
  this.versionNotes = versionNotes;
  this.filePath = filePath;
  this.fileSize = fileSize;
  this.updatedAt = new Date();
  
  // Reset approval status if needed
  if (this.approvalStatus !== 'not_required') {
    this.approvalStatus = 'pending';
    // Reset approvers status
    this.approvers.forEach(approver => {
      approver.status = 'pending';
      approver.timestamp = null;
      approver.comments = null;
    });
  }
  
  return this.save();
};

// Add new method for approving a document
documentSchema.methods.reviewDocument = async function(userId, status, comments = '') {
  const approverIndex = this.approvers.findIndex(
    a => a.user.toString() === userId.toString()
  );
  
  if (approverIndex === -1) {
    throw new Error('User is not an approver for this document');
  }
  
  // Update the approver status
  this.approvers[approverIndex].status = status;
  this.approvers[approverIndex].timestamp = new Date();
  this.approvers[approverIndex].comments = comments;
  
  // Check if all approvers have responded
  const pending = this.approvers.some(a => a.status === 'pending');
  
  if (!pending) {
    // If any approver rejected or requested changes, update document status
    if (this.approvers.some(a => a.status === 'rejected')) {
      this.approvalStatus = 'rejected';
    } else if (this.approvers.some(a => a.status === 'changes_requested')) {
      this.approvalStatus = 'changes_requested';
    } else {
      // All approved
      this.approvalStatus = 'approved';
    }
  }
  
  return this.save();
};

// Add new method to get document version history
documentSchema.methods.getVersionHistory = async function() {
  const history = this.previousVersions.map(v => ({
    version: v.version,
    versionName: v.versionName,
    updatedBy: v.updatedBy,
    updatedAt: v.updatedAt,
    notes: v.notes,
    reason: v.reason,
  }));
  
  // Add current version
  history.push({
    version: this.version,
    versionName: this.versionName,
    updatedBy: this.updatedBy,
    updatedAt: this.updatedAt,
    notes: this.versionNotes,
    current: true,
  });
  
  return history.sort((a, b) => b.version - a.version);
};

// Add indexes for common queries
documentSchema.index({ title: 'text', description: 'text', tags: 'text' }); // Text search
documentSchema.index({ creator: 1 });
documentSchema.index({ department: 1 });
documentSchema.index({ access: 1 });
documentSchema.index({ documentType: 1 });
documentSchema.index({ status: 1 });
documentSchema.index({ 'sharedWith.user': 1 });
documentSchema.index({ 'favoriteBy': 1 });

// Add indexes for the new fields
documentSchema.index({ version: 1 });
documentSchema.index({ approvalStatus: 1 });
documentSchema.index({ 'approvers.user': 1, 'approvers.status': 1 });

const Document = mongoose.model('Document', documentSchema);

module.exports = Document; 
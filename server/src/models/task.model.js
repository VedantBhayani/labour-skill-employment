const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'review', 'completed', 'cancelled', 'on_hold', 'blocked'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Task creator is required'],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    dueDate: {
      type: Date,
    },
    startDate: {
      type: Date,
    },
    completedDate: {
      type: Date,
    },
    estimatedHours: {
      type: Number,
      min: 0,
    },
    actualHours: {
      type: Number,
      min: 0,
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
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
      },
    ],
    tags: [String],
    isArchived: {
      type: Boolean,
      default: false,
    },
    history: [
      {
        field: String,
        oldValue: mongoose.Schema.Types.Mixed,
        newValue: mongoose.Schema.Types.Mixed,
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    dependencies: [
      {
        task: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Task',
        },
        type: {
          type: String,
          enum: ['blocks', 'blocked_by', 'relates_to'],
        },
      },
    ],
    subTasks: [
      {
        title: {
          type: String,
          required: true,
          trim: true,
        },
        description: String,
        assignedTo: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        status: {
          type: String,
          enum: ['pending', 'in_progress', 'completed', 'cancelled'],
          default: 'pending',
        },
        dueDate: Date,
        completedDate: Date,
        priority: {
          type: String,
          enum: ['low', 'medium', 'high', 'urgent'],
          default: 'medium',
        },
      },
    ],
    approvalWorkflow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkflowInstance',
    },
    approvalStatus: {
      type: String,
      enum: ['not_required', 'pending', 'approved', 'rejected', 'changes_requested'],
      default: 'not_required',
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
        timestamp: Date,
      },
    ],
    checklist: [
      {
        item: {
          type: String,
          required: true,
        },
        isCompleted: {
          type: Boolean,
          default: false,
        },
        completedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        completedAt: Date,
      },
    ],
    milestones: [
      {
        title: {
          type: String,
          required: true,
        },
        dueDate: Date,
        isCompleted: {
          type: Boolean,
          default: false,
        },
        completedAt: Date,
      },
    ],
    blockedReason: String,
    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field for task age in days
taskSchema.virtual('ageInDays').get(function () {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual field for time remaining until due
taskSchema.virtual('timeRemaining').get(function () {
  if (!this.dueDate) return null;
  return Math.max(0, Math.floor((this.dueDate - Date.now()) / (1000 * 60 * 60 * 24)));
});

// Virtual field for overdue status
taskSchema.virtual('isOverdue').get(function () {
  if (!this.dueDate) return false;
  if (this.status === 'completed' || this.status === 'cancelled') return false;
  return Date.now() > this.dueDate;
});

// Add indexes for common queries
taskSchema.index({ title: 'text', description: 'text' }); // Text search
taskSchema.index({ status: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ department: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ creator: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ isArchived: 1 });

// Pre-save middleware to update task details
taskSchema.pre('save', function (next) {
  // If task is being completed, set completed date
  if (this.isModified('status') && this.status === 'completed' && !this.completedDate) {
    this.completedDate = Date.now();
  }
  
  // If task is moving to in_progress and has no start date, set it
  if (this.isModified('status') && this.status === 'in_progress' && !this.startDate) {
    this.startDate = Date.now();
  }
  
  // If task is 100% progress, ensure status is completed
  if (this.isModified('progress') && this.progress === 100 && this.status !== 'completed') {
    this.status = 'completed';
    this.completedDate = Date.now();
  }
  
  next();
});

// Add method to update task approval status
taskSchema.methods.updateApproval = async function(userId, status, comments = '') {
  const approverIndex = this.approvers.findIndex(
    a => a.user.toString() === userId.toString()
  );
  
  if (approverIndex === -1) {
    throw new Error('User is not an approver for this task');
  }
  
  // Update the approver status
  this.approvers[approverIndex].status = status;
  this.approvers[approverIndex].timestamp = new Date();
  this.approvers[approverIndex].comments = comments;
  
  // Check if all approvers have responded
  const pending = this.approvers.some(a => a.status === 'pending');
  
  if (!pending) {
    // If any approver rejected or requested changes, update task status
    if (this.approvers.some(a => a.status === 'rejected')) {
      this.approvalStatus = 'rejected';
      // Optionally change task status
      if (this.status === 'review') {
        this.status = 'in_progress';
        // Add to history
        this.history.push({
          field: 'status',
          oldValue: 'review',
          newValue: 'in_progress',
          changedBy: userId,
          changedAt: new Date(),
        });
      }
    } else if (this.approvers.some(a => a.status === 'changes_requested')) {
      this.approvalStatus = 'changes_requested';
      // Optionally change task status
      if (this.status === 'review') {
        this.status = 'in_progress';
        // Add to history
        this.history.push({
          field: 'status',
          oldValue: 'review',
          newValue: 'in_progress',
          changedBy: userId,
          changedAt: new Date(),
        });
      }
    } else {
      // All approved
      this.approvalStatus = 'approved';
      // Optionally change task status to completed
      if (this.status === 'review') {
        this.status = 'completed';
        this.completedDate = new Date();
        // Add to history
        this.history.push({
          field: 'status',
          oldValue: 'review',
          newValue: 'completed',
          changedBy: userId,
          changedAt: new Date(),
        });
      }
    }
  }
  
  return this.save();
};

// Add method to add a subtask
taskSchema.methods.addSubTask = async function(subTaskData) {
  this.subTasks.push(subTaskData);
  
  // Update history
  this.history.push({
    field: 'subTasks',
    oldValue: 'none',
    newValue: `Added subtask: ${subTaskData.title}`,
    changedBy: subTaskData.changedBy || this.creator,
    changedAt: new Date(),
  });
  
  return this.save();
};

// Add method to update a subtask
taskSchema.methods.updateSubTask = async function(subTaskId, updateData, changedBy) {
  const subTaskIndex = this.subTasks.findIndex(
    st => st._id.toString() === subTaskId.toString()
  );
  
  if (subTaskIndex === -1) {
    throw new Error('Subtask not found');
  }
  
  // Store old values for history
  const oldValues = {};
  const updates = {};
  
  for (const [key, value] of Object.entries(updateData)) {
    if (key in this.subTasks[subTaskIndex] && this.subTasks[subTaskIndex][key] !== value) {
      oldValues[key] = this.subTasks[subTaskIndex][key];
      updates[key] = value;
      this.subTasks[subTaskIndex][key] = value;
    }
  }
  
  // If status changed to completed, set completedDate
  if (updateData.status === 'completed' && this.subTasks[subTaskIndex].status !== 'completed') {
    this.subTasks[subTaskIndex].completedDate = new Date();
  }
  
  // Add to history if there were changes
  if (Object.keys(updates).length > 0) {
    this.history.push({
      field: 'subTasks',
      oldValue: JSON.stringify(oldValues),
      newValue: JSON.stringify(updates),
      changedBy: changedBy || this.creator,
      changedAt: new Date(),
    });
  }
  
  // Check if all subtasks are completed
  const allSubtasksCompleted = this.subTasks.length > 0 && 
    this.subTasks.every(st => st.status === 'completed');
  
  // Update progress based on subtasks
  if (this.subTasks.length > 0) {
    const completedSubTasks = this.subTasks.filter(st => st.status === 'completed').length;
    this.progress = Math.round((completedSubTasks / this.subTasks.length) * 100);
  }
  
  return this.save();
};

// Add method to toggle checklist item
taskSchema.methods.toggleChecklistItem = async function(itemId, userId) {
  const itemIndex = this.checklist.findIndex(
    item => item._id.toString() === itemId.toString()
  );
  
  if (itemIndex === -1) {
    throw new Error('Checklist item not found');
  }
  
  // Toggle completion status
  this.checklist[itemIndex].isCompleted = !this.checklist[itemIndex].isCompleted;
  
  // Update completion metadata
  if (this.checklist[itemIndex].isCompleted) {
    this.checklist[itemIndex].completedBy = userId;
    this.checklist[itemIndex].completedAt = new Date();
  } else {
    this.checklist[itemIndex].completedBy = undefined;
    this.checklist[itemIndex].completedAt = undefined;
  }
  
  // Update progress based on checklist items if there's no subtasks
  if (this.subTasks.length === 0 && this.checklist.length > 0) {
    const completedItems = this.checklist.filter(item => item.isCompleted).length;
    this.progress = Math.round((completedItems / this.checklist.length) * 100);
  }
  
  return this.save();
};

// Add indexes for new fields
taskSchema.index({ 'subTasks.status': 1 });
taskSchema.index({ 'subTasks.assignedTo': 1 });
taskSchema.index({ approvalStatus: 1 });
taskSchema.index({ 'approvers.user': 1 });
taskSchema.index({ 'blockedBy': 1 });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task; 
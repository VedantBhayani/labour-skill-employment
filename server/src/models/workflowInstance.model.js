const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const workflowInstanceSchema = new mongoose.Schema(
  {
    workflowTemplate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workflow',
      required: [true, 'Workflow template reference is required'],
    },
    name: {
      type: String,
      required: [true, 'Workflow instance name is required'],
      trim: true,
    },
    initiator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Workflow initiator is required'],
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'completed', 'cancelled', 'rejected'],
      default: 'draft',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    startDate: {
      type: Date,
    },
    completedDate: {
      type: Date,
    },
    dueDate: {
      type: Date,
    },
    currentStep: {
      type: Number,
      default: 0,
    },
    relatedEntity: {
      entityType: {
        type: String,
        enum: ['task', 'document', 'user', 'department', 'grievance', 'none'],
        default: 'none',
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },
    stepsData: [
      {
        stepNumber: {
          type: Number,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        status: {
          type: String,
          enum: ['pending', 'in_progress', 'completed', 'skipped', 'rejected'],
          default: 'pending',
        },
        assignedTo: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        startDate: Date,
        completedDate: Date,
        dueDate: Date,
        actions: [
          {
            action: {
              type: String,
              enum: ['approve', 'reject', 'request_changes', 'delegate', 'comment'],
            },
            user: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User',
            },
            timestamp: {
              type: Date,
              default: Date.now,
            },
            comment: String,
            attachments: [{
              name: String,
              path: String,
              mimeType: String,
              size: Number,
            }],
          },
        ],
        formData: {
          type: Map,
          of: mongoose.Schema.Types.Mixed,
        },
      },
    ],
    history: [
      {
        action: {
          type: String,
          enum: ['created', 'updated', 'step_completed', 'step_rejected', 'reassigned', 'cancelled', 'reactivated', 'completed', 'rejected'],
        },
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        stepNumber: Number,
        details: String,
      },
    ],
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        comment: String,
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
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    tags: [String],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Add pagination
workflowInstanceSchema.plugin(mongoosePaginate);

// Virtual field for progress percentage
workflowInstanceSchema.virtual('progress').get(function () {
  if (!this.stepsData || this.stepsData.length === 0) return 0;
  
  const totalSteps = this.stepsData.length;
  const completedSteps = this.stepsData.filter(
    step => step.status === 'completed' || step.status === 'skipped'
  ).length;
  
  return Math.round((completedSteps / totalSteps) * 100);
});

// Virtual field for time elapsed since start
workflowInstanceSchema.virtual('timeElapsed').get(function () {
  if (!this.startDate) return 0;
  
  const now = this.completedDate || Date.now();
  return Math.floor((now - this.startDate) / (1000 * 60 * 60 * 24)); // in days
});

// Virtual field for remaining time until due date
workflowInstanceSchema.virtual('timeRemaining').get(function () {
  if (!this.dueDate) return null;
  if (this.status === 'completed' || this.status === 'cancelled' || this.status === 'rejected') return 0;
  
  return Math.max(0, Math.floor((this.dueDate - Date.now()) / (1000 * 60 * 60 * 24))); // in days
});

// Virtual field for overdue status
workflowInstanceSchema.virtual('isOverdue').get(function () {
  if (!this.dueDate) return false;
  if (this.status === 'completed' || this.status === 'cancelled' || this.status === 'rejected') return false;
  return Date.now() > this.dueDate;
});

// Method to transition to the next step
workflowInstanceSchema.methods.moveToNextStep = async function(userId, comment = '') {
  if (this.status !== 'active') {
    throw new Error('Cannot advance workflow: workflow is not active');
  }
  
  // Get current step
  const currentStepIndex = this.stepsData.findIndex(step => step.stepNumber === this.currentStep);
  if (currentStepIndex === -1) {
    throw new Error('Current step not found in workflow data');
  }
  
  // Mark current step as completed
  this.stepsData[currentStepIndex].status = 'completed';
  this.stepsData[currentStepIndex].completedDate = new Date();
  
  // Add history entry
  this.history.push({
    action: 'step_completed',
    user: userId,
    stepNumber: this.currentStep,
    details: `Step ${this.currentStep} (${this.stepsData[currentStepIndex].name}) completed`,
  });
  
  // Add optional comment
  if (comment) {
    this.comments.push({
      user: userId,
      comment,
      timestamp: new Date(),
    });
  }
  
  // Check if this was the last step
  if (currentStepIndex === this.stepsData.length - 1) {
    // Workflow is complete
    this.status = 'completed';
    this.completedDate = new Date();
    
    // Add history entry for workflow completion
    this.history.push({
      action: 'completed',
      user: userId,
      details: 'Workflow completed successfully',
    });
  } else {
    // Move to next step
    this.currentStep = this.stepsData[currentStepIndex + 1].stepNumber;
    
    // Set next step to in_progress
    this.stepsData[currentStepIndex + 1].status = 'in_progress';
    this.stepsData[currentStepIndex + 1].startDate = new Date();
    
    // Calculate due date for the step based on durationInDays if available
    if (this.stepsData[currentStepIndex + 1].durationInDays) {
      const daysToAdd = this.stepsData[currentStepIndex + 1].durationInDays;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + daysToAdd);
      this.stepsData[currentStepIndex + 1].dueDate = dueDate;
    }
    
    // Add history entry for moving to next step
    this.history.push({
      action: 'updated',
      user: userId,
      stepNumber: this.currentStep,
      details: `Moved to step ${this.currentStep} (${this.stepsData[currentStepIndex + 1].name})`,
    });
  }
  
  return this.save();
};

// Method to reject a workflow step
workflowInstanceSchema.methods.rejectStep = async function(userId, reason) {
  if (this.status !== 'active') {
    throw new Error('Cannot reject step: workflow is not active');
  }
  
  // Get current step
  const currentStepIndex = this.stepsData.findIndex(step => step.stepNumber === this.currentStep);
  if (currentStepIndex === -1) {
    throw new Error('Current step not found in workflow data');
  }
  
  // Mark current step as rejected
  this.stepsData[currentStepIndex].status = 'rejected';
  this.stepsData[currentStepIndex].completedDate = new Date();
  
  // Add rejection action to the step
  this.stepsData[currentStepIndex].actions.push({
    action: 'reject',
    user: userId,
    comment: reason || 'Step rejected',
  });
  
  // Update workflow status
  this.status = 'rejected';
  
  // Add history entry
  this.history.push({
    action: 'step_rejected',
    user: userId,
    stepNumber: this.currentStep,
    details: `Step ${this.currentStep} (${this.stepsData[currentStepIndex].name}) rejected: ${reason || 'No reason provided'}`,
  });
  
  // Add workflow rejected entry
  this.history.push({
    action: 'rejected',
    user: userId,
    details: `Workflow rejected at step ${this.currentStep}`,
  });
  
  return this.save();
};

// Add indexes for common queries
workflowInstanceSchema.index({ status: 1 });
workflowInstanceSchema.index({ priority: 1 });
workflowInstanceSchema.index({ initiator: 1 });
workflowInstanceSchema.index({ 'stepsData.assignedTo': 1 });
workflowInstanceSchema.index({ workflowTemplate: 1 });
workflowInstanceSchema.index({ department: 1 });
workflowInstanceSchema.index({ isArchived: 1 });
workflowInstanceSchema.index({ 'relatedEntity.entityType': 1, 'relatedEntity.entityId': 1 });
workflowInstanceSchema.index({ startDate: 1 });
workflowInstanceSchema.index({ dueDate: 1 });
workflowInstanceSchema.index({ currentStep: 1 });

const WorkflowInstance = mongoose.model('WorkflowInstance', workflowInstanceSchema);

module.exports = WorkflowInstance; 
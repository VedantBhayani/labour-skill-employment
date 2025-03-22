const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const workflowSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Workflow name is required'],
      trim: true,
      minlength: [3, 'Name must be at least 3 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Workflow creator is required'],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isTemplate: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      enum: ['approval', 'onboarding', 'offboarding', 'procurement', 'review', 'custom'],
      default: 'custom',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    steps: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        description: String,
        stepNumber: {
          type: Number,
          required: true,
        },
        assignedRole: {
          type: String,
          enum: ['admin', 'manager', 'employee', 'department_head', 'specific_user'],
          default: 'manager',
        },
        assignedUser: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        assignedDepartment: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Department',
        },
        requiredApprovals: {
          type: Number,
          default: 1,
          min: 1,
        },
        durationInDays: {
          type: Number,
          default: 1,
          min: 0,
        },
        isOptional: {
          type: Boolean,
          default: false,
        },
        actions: [{
          type: String,
          enum: ['approve', 'reject', 'request_changes', 'delegate', 'comment'],
        }],
        notifyOnComplete: [{
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        }],
        formFields: [{
          label: String,
          type: {
            type: String,
            enum: ['text', 'textarea', 'select', 'checkbox', 'radio', 'date', 'file'],
          },
          options: [String],
          required: Boolean,
          placeholder: String,
        }],
      },
    ],
    currentActiveWorkflows: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkflowInstance',
    }],
    tags: [String],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Add pagination
workflowSchema.plugin(mongoosePaginate);

// Add indexes for common queries
workflowSchema.index({ name: 'text', description: 'text' });
workflowSchema.index({ creator: 1 });
workflowSchema.index({ department: 1 });
workflowSchema.index({ isActive: 1 });
workflowSchema.index({ isTemplate: 1 });
workflowSchema.index({ category: 1 });
workflowSchema.index({ priority: 1 });

const Workflow = mongoose.model('Workflow', workflowSchema);

module.exports = Workflow; 
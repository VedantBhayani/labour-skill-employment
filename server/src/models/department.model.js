const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true,
      unique: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    head: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    parentDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    budget: {
      type: Number,
      default: 0,
    },
    location: {
      type: String,
      trim: true,
    },
    establishedDate: {
      type: Date,
      default: Date.now,
    },
    employees: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    tags: [String],
    isActive: {
      type: Boolean,
      default: true,
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field to get employee count
departmentSchema.virtual('employeeCount').get(function() {
  return this.employees ? this.employees.length : 0;
});

// Virtual field for child departments
departmentSchema.virtual('childDepartments', {
  ref: 'Department',
  localField: '_id',
  foreignField: 'parentDepartment'
});

// Virtual field for department's tasks
departmentSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'department'
});

// Add indexes for common queries
departmentSchema.index({ name: 1 });
departmentSchema.index({ head: 1 });
departmentSchema.index({ parentDepartment: 1 });
departmentSchema.index({ isActive: 1 });

// Pre-save middleware to validate parent department (prevent circular references)
departmentSchema.pre('save', async function(next) {
  if (this.parentDepartment && this.parentDepartment.toString() === this._id.toString()) {
    const err = new Error('Department cannot be its own parent');
    return next(err);
  }
  
  if (this.parentDepartment) {
    // Check if parent exists and is active
    const parent = await this.constructor.findById(this.parentDepartment);
    if (!parent) {
      const err = new Error('Parent department does not exist');
      return next(err);
    }
    if (!parent.isActive) {
      const err = new Error('Parent department is not active');
      return next(err);
    }
  }
  
  next();
});

const Department = mongoose.model('Department', departmentSchema);

module.exports = Department; 
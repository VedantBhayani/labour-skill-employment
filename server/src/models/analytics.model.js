const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  metricType: {
    type: String,
    enum: ['PERFORMANCE', 'WORKLOAD', 'EFFICIENCY', 'SKILLS', 'PROGRESS'],
    required: true
  },
  timeframe: {
    type: String,
    enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY'],
    required: true
  },
  model: {
    type: String,
    enum: ['MACHINE_LEARNING', 'STATISTICAL', 'HYBRID'],
    default: 'STATISTICAL'
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  baseline: [{ 
    timestamp: Date, 
    value: Number,
    department: String
  }],
  predicted: [{ 
    timestamp: Date, 
    value: Number,
    department: String
  }],
  confidenceInterval: {
    upper: [{ timestamp: Date, value: Number }],
    lower: [{ timestamp: Date, value: Number }]
  },
  accuracy: Number,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
});

const scheduledReportSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  metricType: {
    type: String,
    enum: ['PERFORMANCE', 'WORKLOAD', 'EFFICIENCY', 'SKILLS', 'PROGRESS'],
    required: true
  },
  timeframe: {
    type: String,
    enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY'],
    required: true
  },
  recipients: [{
    type: String,
    trim: true
  }],
  includeDataExport: {
    type: Boolean,
    default: true
  },
  includeVisualizations: {
    type: Boolean,
    default: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  lastRun: Date,
  nextRun: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
});

const dashboardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  layout: {
    widgets: [{
      id: String,
      type: {
        type: String,
        enum: ['chart', 'statistics', 'table', 'prediction'],
        required: true
      },
      title: String,
      dataSource: String,
      metricType: {
        type: String,
        enum: ['PERFORMANCE', 'WORKLOAD', 'EFFICIENCY', 'SKILLS', 'PROGRESS']
      },
      size: {
        type: String,
        enum: ['small', 'medium', 'large'],
        default: 'medium'
      },
      position: {
        x: Number,
        y: Number,
        w: Number,
        h: Number
      },
      config: mongoose.Schema.Types.Mixed
    }]
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  departments: [{
    type: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
});

// Add indexes for performance
predictionSchema.index({ metricType: 1, timeframe: 1, department: 1 });
predictionSchema.index({ createdAt: -1 });

scheduledReportSchema.index({ timeframe: 1, isActive: 1 });
scheduledReportSchema.index({ createdBy: 1 });

dashboardSchema.index({ createdBy: 1 });
dashboardSchema.index({ isDefault: 1 });
dashboardSchema.index({ departments: 1 });

const Prediction = mongoose.model('Prediction', predictionSchema);
const ScheduledReport = mongoose.model('ScheduledReport', scheduledReportSchema);
const Dashboard = mongoose.model('Dashboard', dashboardSchema);

module.exports = {
  Prediction,
  ScheduledReport,
  Dashboard
}; 
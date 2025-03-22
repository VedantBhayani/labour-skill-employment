const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: [true, 'Action is required'],
      enum: ['create', 'update', 'delete', 'view', 'login', 'logout', 'approve', 'reject', 'assign', 'upload', 'download', 'share', 'escalate']
    },
    entityType: {
      type: String,
      required: [true, 'Entity type is required'],
      enum: ['user', 'department', 'task', 'document', 'grievance', 'system']
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: function() {
        return this.entityType !== 'system';
      }
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: {
      type: Object,
      default: {}
    },
    ipAddress: {
      type: String
    }
  },
  {
    // Disable versioning for audit logs
    versionKey: false
  }
);

// Index for faster queries
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });

// Create model
const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog; 
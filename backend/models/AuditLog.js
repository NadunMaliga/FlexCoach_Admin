const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'admin_login_attempt',
      'admin_login_success',
      'admin_login_failed',
      'admin_logout',
      'user_approved',
      'user_rejected',
      'user_created',
      'user_updated',
      'user_deleted',
      'user_status_changed',
      'admin_created',
      'admin_updated',
      'admin_deleted',
      'settings_updated',
      'bulk_action',
      'data_export',
      'profile_viewed',
      'dashboard_accessed'
    ]
  },
  resource: {
    type: String,
    required: true,
    enum: ['user', 'admin', 'system', 'dashboard', 'profile']
  },
  resourceId: {
    type: String, // ID of affected resource (user ID, admin ID, etc.)
    default: null
  },
  details: {
    type: mongoose.Schema.Types.Mixed, // Additional action details
    default: {}
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  success: {
    type: Boolean,
    default: true
  },
  errorMessage: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
auditLogSchema.index({ adminId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ resource: 1, timestamp: -1 });
auditLogSchema.index({ resourceId: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ ipAddress: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
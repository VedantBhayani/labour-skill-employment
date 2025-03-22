const express = require('express');
const auditController = require('../controllers/audit.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get user's own activity logs
router.get('/user-activity', auditController.getUserActivity);

// Entity audit logs - restricted based on role and relationship to entity
router.get('/entity/:entityType/:entityId', auditController.getEntityAuditLogs);

// Admin-only routes
router.use(authorize('admin'));

// Get all audit logs - admin only
router.get('/', auditController.getAllAuditLogs);

// Get audit statistics - admin only
router.get('/stats', auditController.getAuditStats);

module.exports = router; 
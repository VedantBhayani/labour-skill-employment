const express = require('express');
const workflowController = require('../controllers/workflow.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Workflow template routes
router.get('/templates', workflowController.getWorkflowTemplates);
router.get('/templates/:id', workflowController.getWorkflowTemplate);
router.post('/templates', authorizeRoles(['admin', 'manager']), workflowController.createWorkflowTemplate);
router.patch('/templates/:id', authorizeRoles(['admin', 'manager']), workflowController.updateWorkflowTemplate);
router.delete('/templates/:id', authorizeRoles(['admin', 'manager']), workflowController.deleteWorkflowTemplate);

// Workflow instance routes
router.get('/instances', workflowController.getWorkflowInstances);
router.get('/instances/:id', workflowController.getWorkflowInstance);
router.post('/instances', workflowController.createWorkflowInstance);
router.post('/instances/:id/process', workflowController.uploadStepAttachment, workflowController.processWorkflowStep);

// Utility routes
router.get('/info', workflowController.getWorkflowInfo);

module.exports = router; 
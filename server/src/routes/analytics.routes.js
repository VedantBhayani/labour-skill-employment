const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticate);

// Analytics metrics endpoints
router.get('/performance', analyticsController.getDepartmentPerformance);
router.get('/workload', analyticsController.getWorkloadDistribution);
router.get('/efficiency', analyticsController.getDepartmentEfficiency);
router.get('/skills', analyticsController.getDepartmentSkillsAnalysis);

// Prediction endpoints
router.post('/predictions', analyticsController.createPrediction);
router.get('/predictions', analyticsController.getAllPredictions);
router.get('/predictions/:id', analyticsController.getPredictionById);
router.delete('/predictions/:id', analyticsController.deletePrediction);

// Scheduled report endpoints
router.post('/reports', analyticsController.createScheduledReport);
router.get('/reports', analyticsController.getAllScheduledReports);
router.get('/reports/:id', analyticsController.getScheduledReportById);
router.put('/reports/:id', analyticsController.updateScheduledReport);
router.delete('/reports/:id', analyticsController.deleteScheduledReport);
router.post('/reports/:id/run', analyticsController.runScheduledReport);

// Dashboard endpoints
router.post('/dashboards', analyticsController.createDashboard);
router.get('/dashboards', analyticsController.getAllDashboards);
router.get('/dashboards/:id', analyticsController.getDashboardById);
router.put('/dashboards/:id', analyticsController.updateDashboard);
router.delete('/dashboards/:id', analyticsController.deleteDashboard);

module.exports = router; 
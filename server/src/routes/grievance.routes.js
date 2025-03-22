const express = require('express');
const grievanceController = require('../controllers/grievance.controller');
const { validateRequest } = require('../middleware/validation.middleware');
const { grievanceValidation } = require('../middleware/validators');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Routes available to all authenticated users
router.get('/stats', grievanceController.getGrievanceStats);
router.get('/', grievanceController.getAllGrievances);
router.get('/:id', grievanceController.getGrievanceById);

// Create grievance route
router.post('/',
  validateRequest(grievanceValidation.createGrievance),
  grievanceController.createGrievance
);

// Update grievance route
router.patch('/:id',
  validateRequest(grievanceValidation.updateGrievance),
  grievanceController.updateGrievance
);

// Delete grievance route - regular users can only delete pending grievances
router.delete('/:id', grievanceController.deleteGrievance);

// Comment on grievance route
router.post('/:id/comments',
  validateRequest(grievanceValidation.addComment),
  grievanceController.addComment
);

module.exports = router; 
const express = require('express');
const taskController = require('../controllers/task.controller');
const { validateRequest } = require('../middleware/validation.middleware');
const { taskValidation } = require('../middleware/validators');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Routes available to all authenticated users
router.get('/assigned', taskController.getAssignedTasks);
router.get('/stats', taskController.getTaskStats);
router.get('/', taskController.getAllTasks);
router.get('/:id', taskController.getTaskById);

// Create and update tasks
router.post('/', 
  validateRequest(taskValidation.createTask), 
  taskController.createTask
);

router.patch('/:id', 
  validateRequest(taskValidation.updateTask), 
  taskController.updateTask
);

// Delete task - requires elevated permissions
router.delete('/:id', 
  authorize(['admin', 'manager']), 
  taskController.deleteTask
);

module.exports = router; 
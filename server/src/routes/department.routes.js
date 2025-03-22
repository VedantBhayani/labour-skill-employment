const express = require('express');
const departmentController = require('../controllers/department.controller');
const { validateRequest } = require('../middleware/validation.middleware');
const { departmentValidation } = require('../middleware/validators');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Routes that require authentication
router.use(authenticate);

// Public routes for authenticated users
router.get('/', departmentController.getAllDepartments);
router.get('/hierarchy', departmentController.getDepartmentHierarchy);
router.get('/:id', departmentController.getDepartmentById);

// Routes that require manager or admin permission
router.use(authorize(['manager', 'admin']));

// CRUD operations that require elevated permissions
router.post('/', 
  validateRequest(departmentValidation.createDepartment), 
  departmentController.createDepartment
);

router.patch('/:id', 
  validateRequest(departmentValidation.updateDepartment), 
  departmentController.updateDepartment
);

// Routes that require admin permission only
router.delete('/:id', 
  authorize('admin'), 
  departmentController.deleteDepartment
);

module.exports = router; 
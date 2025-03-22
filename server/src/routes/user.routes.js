const express = require('express');
const userController = require('../controllers/user.controller');
const { validateRequest } = require('../middleware/validation.middleware');
const { userValidation } = require('../middleware/validators');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Routes that require authentication
router.use(authenticate);

// Profile routes (available for all authenticated users)
router.get('/profile', userController.getUserProfile);
router.patch('/profile', validateRequest(userValidation.updateProfile), userController.updateProfile);

// Routes that require admin permission
router.use(authorize('admin'));

// CRUD operations for users
router.route('/')
  .get(userController.getAllUsers)
  .post(validateRequest(userValidation.createUser), userController.createUser);

router.route('/:id')
  .get(userController.getUserById)
  .patch(validateRequest(userValidation.updateUser), userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router; 
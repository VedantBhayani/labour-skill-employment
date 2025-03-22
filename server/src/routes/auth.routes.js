const express = require('express');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validateRequest } = require('../middleware/validation.middleware');
const { authValidation } = require('../middleware/validators');
const { authAudit } = require('../middleware/audit.middleware');

const router = express.Router();

// Public routes
router.post('/register', 
  validateRequest(authValidation.register), 
  authController.register
);

router.post('/login', 
  validateRequest(authValidation.login), 
  authAudit('login'), // Add audit middleware for login
  authController.login
);

router.post('/refresh-token', authController.refreshToken);

// Protected routes
router.use(authenticate); // All routes after this middleware require authentication

router.get('/me', authController.getCurrentUser);

router.post('/logout', 
  authAudit('logout'), // Add audit middleware for logout
  authController.logout
);

router.patch('/update-password', 
  validateRequest(authValidation.resetPassword), 
  authController.updatePassword
);

module.exports = router; 
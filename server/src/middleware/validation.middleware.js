const { validationResult, body } = require('express-validator');

/**
 * Validate request and return errors if any
 */
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

/**
 * User registration validation rules
 */
exports.registerRules = [
  body('name')
    .not().isEmpty().withMessage('Name is required')
    .isLength({ min: 3, max: 50 }).withMessage('Name must be between 3 and 50 characters'),
  body('email')
    .not().isEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .not().isEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/\d/).withMessage('Password must contain a number'),
  body('role')
    .optional()
    .isIn(['admin', 'department_head', 'manager', 'team_lead', 'employee', 'guest'])
    .withMessage('Invalid role specified')
];

/**
 * User login validation rules
 */
exports.loginRules = [
  body('email')
    .not().isEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .not().isEmpty().withMessage('Password is required')
];

/**
 * Password reset validation rules
 */
exports.resetPasswordRules = [
  body('newPassword')
    .not().isEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/\d/).withMessage('Password must contain a number'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    })
];

/**
 * Department validation rules
 */
exports.departmentRules = [
  body('name')
    .not().isEmpty().withMessage('Department name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('budget')
    .optional()
    .isNumeric().withMessage('Budget must be a number'),
  body('headId')
    .optional()
    .isMongoId().withMessage('Invalid department head ID')
];

/**
 * Task validation rules
 */
exports.taskRules = [
  body('title')
    .not().isEmpty().withMessage('Task title is required')
    .isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'review', 'completed', 'cancelled'])
    .withMessage('Invalid task status'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid task priority'),
  body('dueDate')
    .optional()
    .isISO8601().withMessage('Due date must be a valid date'),
  body('assignedTo')
    .optional()
    .isMongoId().withMessage('Invalid user ID for assignee'),
  body('departmentId')
    .optional()
    .isMongoId().withMessage('Invalid department ID')
];

/**
 * Document validation rules
 */
exports.documentRules = [
  body('title')
    .not().isEmpty().withMessage('Document title is required')
    .isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('documentType')
    .optional()
    .isIn(['report', 'policy', 'form', 'guide', 'other'])
    .withMessage('Invalid document type'),
  body('access')
    .optional()
    .isIn(['public', 'department', 'restricted', 'private'])
    .withMessage('Invalid access level'),
  body('departmentId')
    .optional()
    .isMongoId().withMessage('Invalid department ID')
];

/**
 * Grievance validation rules
 */
exports.grievanceRules = [
  body('title')
    .not().isEmpty().withMessage('Grievance title is required')
    .isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
  body('description')
    .not().isEmpty().withMessage('Grievance description is required')
    .isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters'),
  body('category')
    .optional()
    .isIn(['work_conditions', 'discrimination', 'harassment', 'compensation', 'benefits', 'other'])
    .withMessage('Invalid grievance category'),
  body('severity')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid severity level'),
  body('departmentId')
    .optional()
    .isMongoId().withMessage('Invalid department ID')
]; 
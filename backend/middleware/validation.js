const { body, param, query, validationResult } = require('express-validator');
const mongoose = require('mongoose');

/**
 * Validation middleware for FlexCoach Admin API endpoints
 * Provides comprehensive input validation for all admin operations
 */

// Error response formatter for validation errors
const formatValidationErrors = (errors) => {
  return {
    success: false,
    error: 'Validation failed',
    code: 'VALIDATION_FAILED',
    details: errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
      location: err.location
    })),
    timestamp: new Date().toISOString()
  };
};

// Middleware to handle validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(formatValidationErrors(errors));
  }
  next();
};

// Custom validators
const customValidators = {
  // Validate MongoDB ObjectId
  isValidObjectId: (value) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new Error('Invalid ObjectId format');
    }
    return true;
  },

  // Validate user status
  isValidUserStatus: (value) => {
    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(value)) {
      throw new Error(`Status must be one of: ${validStatuses.join(', ')}`);
    }
    return true;
  },

  // Validate training mode
  isValidTrainingMode: (value) => {
    const validModes = ['Online', 'Physical Training', 'Both Options', 'Schedule Only'];
    if (!validModes.includes(value)) {
      throw new Error(`Training mode must be one of: ${validModes.join(', ')}`);
    }
    return true;
  },

  // Validate gender
  isValidGender: (value) => {
    const validGenders = ['Male', 'Female', 'Other'];
    if (!validGenders.includes(value)) {
      throw new Error(`Gender must be one of: ${validGenders.join(', ')}`);
    }
    return true;
  },

  // Validate sort order
  isValidSortOrder: (value) => {
    const validOrders = ['asc', 'desc'];
    if (!validOrders.includes(value)) {
      throw new Error(`Sort order must be one of: ${validOrders.join(', ')}`);
    }
    return true;
  },

  // Validate date format
  isValidDate: (value) => {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date format');
    }
    return true;
  },

  // Validate pagination limit
  isValidLimit: (value) => {
    const limit = parseInt(value);
    if (isNaN(limit) || limit < 1 || limit > 100) {
      throw new Error('Limit must be a number between 1 and 100');
    }
    return true;
  },

  // Validate pagination page
  isValidPage: (value) => {
    const page = parseInt(value);
    if (isNaN(page) || page < 1) {
      throw new Error('Page must be a positive number');
    }
    return true;
  }
};

// Admin Authentication Validation
const validateAdminLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email address is required')
    .isLength({ min: 5, max: 100 })
    .withMessage('Email must be between 5 and 100 characters'),
  
  body('password')
    .isLength({ min: 1 })
    .withMessage('Password is required')
    .isLength({ max: 200 })
    .withMessage('Password is too long'),
  
  handleValidationErrors
];

// User ID Parameter Validation
const validateUserId = [
  param('userId')
    .custom(customValidators.isValidObjectId)
    .withMessage('Invalid user ID format'),
  
  handleValidationErrors
];

// User Management Query Validation
const validateUserListQuery = [
  query('page')
    .optional()
    .custom(customValidators.isValidPage),
  
  query('limit')
    .optional()
    .custom(customValidators.isValidLimit),
  
  query('status')
    .optional()
    .custom(customValidators.isValidUserStatus),
  
  query('trainingMode')
    .optional()
    .custom(customValidators.isValidTrainingMode),
  
  query('gender')
    .optional()
    .custom(customValidators.isValidGender),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'firstName', 'lastName', 'email', 'status', 'trainingMode', 'gender', 'birthday', 'approvedAt', 'rejectedAt'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .custom(customValidators.isValidSortOrder),
  
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
  
  query('onboardingCompleted')
    .optional()
    .isBoolean()
    .withMessage('onboardingCompleted must be a boolean value'),
  
  query('hasProfilePhoto')
    .optional()
    .isBoolean()
    .withMessage('hasProfilePhoto must be a boolean value'),
  
  query('dateFrom')
    .optional()
    .custom(customValidators.isValidDate),
  
  query('dateTo')
    .optional()
    .custom(customValidators.isValidDate),
  
  query('approvedBy')
    .optional()
    .custom(customValidators.isValidObjectId),
  
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters')
    .trim(),
  
  handleValidationErrors
];

// User Rejection Validation
const validateUserRejection = [
  param('userId')
    .custom(customValidators.isValidObjectId)
    .withMessage('Invalid user ID format'),
  
  body('reason')
    .optional()
    .isLength({ min: 1, max: 500 })
    .withMessage('Rejection reason must be between 1 and 500 characters')
    .trim(),
  
  handleValidationErrors
];

// Bulk Operations Validation
const validateBulkUserAction = [
  body('userIds')
    .isArray({ min: 1, max: 50 })
    .withMessage('userIds must be an array with 1-50 user IDs'),
  
  body('userIds.*')
    .custom(customValidators.isValidObjectId)
    .withMessage('Each user ID must be a valid ObjectId'),
  
  handleValidationErrors
];

// Bulk Rejection Validation
const validateBulkUserRejection = [
  body('userIds')
    .isArray({ min: 1, max: 50 })
    .withMessage('userIds must be an array with 1-50 user IDs'),
  
  body('userIds.*')
    .custom(customValidators.isValidObjectId)
    .withMessage('Each user ID must be a valid ObjectId'),
  
  body('reason')
    .optional()
    .isLength({ min: 1, max: 500 })
    .withMessage('Rejection reason must be between 1 and 500 characters')
    .trim(),
  
  handleValidationErrors
];

// Dashboard Query Validation
const validateDashboardQuery = [
  query('period')
    .optional()
    .isIn(['7d', '30d', '90d', '1y'])
    .withMessage('Period must be one of: 7d, 30d, 90d, 1y'),
  
  query('includeDetails')
    .optional()
    .isBoolean()
    .withMessage('includeDetails must be a boolean value'),
  
  handleValidationErrors
];

// Audit Log Query Validation
const validateAuditLogQuery = [
  query('page')
    .optional()
    .custom(customValidators.isValidPage),
  
  query('limit')
    .optional()
    .custom(customValidators.isValidLimit),
  
  query('adminId')
    .optional()
    .custom(customValidators.isValidObjectId),
  
  query('action')
    .optional()
    .isIn(['user_approved', 'user_rejected', 'user_created', 'user_updated', 'admin_login', 'admin_logout', 'admin_created', 'admin_updated', 'settings_updated', 'bulk_action', 'export_data'])
    .withMessage('Invalid action type'),
  
  query('resource')
    .optional()
    .isIn(['user', 'admin', 'system'])
    .withMessage('Resource must be one of: user, admin, system'),
  
  query('dateFrom')
    .optional()
    .custom(customValidators.isValidDate),
  
  query('dateTo')
    .optional()
    .custom(customValidators.isValidDate),
  
  handleValidationErrors
];

// Export Query Validation
const validateExportQuery = [
  query('format')
    .optional()
    .isIn(['csv', 'json', 'excel'])
    .withMessage('Format must be one of: csv, json, excel'),
  
  query('status')
    .optional()
    .custom(customValidators.isValidUserStatus),
  
  query('dateFrom')
    .optional()
    .custom(customValidators.isValidDate),
  
  query('dateTo')
    .optional()
    .custom(customValidators.isValidDate),
  
  query('includePersonalData')
    .optional()
    .isBoolean()
    .withMessage('includePersonalData must be a boolean value'),
  
  handleValidationErrors
];

// Admin Profile Update Validation
const validateAdminProfileUpdate = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email address is required'),
  
  body('currentPassword')
    .if(body('newPassword').exists())
    .notEmpty()
    .withMessage('Current password is required when changing password'),
  
  body('newPassword')
    .optional()
    .isLength({ min: 8, max: 128 })
    .withMessage('New password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
  
  handleValidationErrors
];

// System Settings Validation
const validateSystemSettings = [
  body('settings')
    .isObject()
    .withMessage('Settings must be an object'),
  
  body('settings.*.value')
    .exists()
    .withMessage('Each setting must have a value'),
  
  body('settings.*.description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Setting description must be less than 200 characters'),
  
  handleValidationErrors
];

// Rate Limiting Validation
const validateRateLimitQuery = [
  query('windowMs')
    .optional()
    .isInt({ min: 60000, max: 3600000 })
    .withMessage('Window must be between 1 minute and 1 hour (in milliseconds)'),
  
  query('maxRequests')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Max requests must be between 1 and 1000'),
  
  handleValidationErrors
];

// Generic validation middleware for common patterns
const validateCommonParams = {
  // Validate ObjectId in URL parameters
  objectId: (paramName = 'id') => [
    param(paramName)
      .custom(customValidators.isValidObjectId)
      .withMessage(`Invalid ${paramName} format`),
    handleValidationErrors
  ],

  // Validate pagination parameters
  pagination: [
    query('page')
      .optional()
      .custom(customValidators.isValidPage),
    query('limit')
      .optional()
      .custom(customValidators.isValidLimit),
    handleValidationErrors
  ],

  // Validate date range parameters
  dateRange: [
    query('dateFrom')
      .optional()
      .custom(customValidators.isValidDate),
    query('dateTo')
      .optional()
      .custom(customValidators.isValidDate)
      .custom((value, { req }) => {
        if (req.query.dateFrom && value) {
          const fromDate = new Date(req.query.dateFrom);
          const toDate = new Date(value);
          if (toDate < fromDate) {
            throw new Error('End date must be after start date');
          }
        }
        return true;
      }),
    handleValidationErrors
  ]
};

module.exports = {
  // Authentication validators
  validateAdminLogin,
  
  // User management validators
  validateUserId,
  validateUserListQuery,
  validateUserRejection,
  validateBulkUserAction,
  validateBulkUserRejection,
  
  // Dashboard validators
  validateDashboardQuery,
  
  // Audit log validators
  validateAuditLogQuery,
  
  // Export validators
  validateExportQuery,
  
  // Admin profile validators
  validateAdminProfileUpdate,
  
  // System validators
  validateSystemSettings,
  validateRateLimitQuery,
  
  // Common validators
  validateCommonParams,
  
  // Utility functions
  handleValidationErrors,
  formatValidationErrors,
  customValidators
};
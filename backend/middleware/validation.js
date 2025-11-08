const { body, param, query, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { ValidationError, ErrorCodes } = require('./errorHandler');

/**
 * Comprehensive Input Validation Middleware for FlexCoach Admin Backend
 * Provides security-focused validation for all API endpoints
 */

// Common validation patterns
const VALIDATION_PATTERNS = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  name: /^[a-zA-Z\s'-]{1,50}$/,
  mobile: /^[\+]?[1-9][\d]{0,15}$/,
  objectId: /^[0-9a-fA-F]{24}$/,
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  slug: /^[a-z0-9-]+$/,
  hexColor: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
};

// Sanitization helpers
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
};

const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return email;
  return email.toLowerCase().trim();
};

// Custom validators
const isValidObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(value);
};

const isValidDate = (value) => {
  const date = new Date(value);
  return date instanceof Date && !isNaN(date);
};

const isValidEnum = (allowedValues) => {
  return (value) => allowedValues.includes(value);
};

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
      location: error.location
    }));

    console.warn('🚫 Validation failed:', {
      endpoint: `${req.method} ${req.originalUrl}`,
      errors: formattedErrors,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: ErrorCodes.VALIDATION_ERROR,
      details: formattedErrors
    });
  }
  
  next();
};

// Authentication validation
const validateAdminLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email address is required')
    .isLength({ max: 254 })
    .withMessage('Email must be less than 254 characters')
    .custom((value) => {
      if (!VALIDATION_PATTERNS.email.test(value)) {
        throw new Error('Invalid email format');
      }
      return true;
    }),
  
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .notEmpty()
    .withMessage('Password is required')
    .custom((value) => {
      // Check for common weak passwords
      const weakPasswords = ['password', '123456', 'admin', 'test'];
      if (weakPasswords.includes(value.toLowerCase())) {
        throw new Error('Password is too weak');
      }
      return true;
    }),
  
  // Sanitize inputs
  body('email').customSanitizer(sanitizeEmail),
  body('password').customSanitizer(sanitizeString),
  
  handleValidationErrors
];

// User management validation
const validateUserId = [
  param('userId')
    .custom(isValidObjectId)
    .withMessage('Invalid user ID format')
    .isLength({ min: 24, max: 24 })
    .withMessage('User ID must be exactly 24 characters'),
  
  handleValidationErrors
];

const validateUserListQuery = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be a positive integer between 1 and 1000')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  
  query('status')
    .optional()
    .custom(isValidEnum(['pending', 'approved', 'rejected']))
    .withMessage('Status must be pending, approved, or rejected'),
  
  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Search term must be less than 100 characters')
    .customSanitizer(sanitizeString),
  
  query('sortBy')
    .optional()
    .custom(isValidEnum([
      'createdAt', 'updatedAt', 'firstName', 'lastName', 'email',
      'status', 'trainingMode', 'gender', 'birthday', 'approvedAt', 'rejectedAt'
    ]))
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .custom(isValidEnum(['asc', 'desc']))
    .withMessage('Sort order must be asc or desc'),
  
  query('trainingMode')
    .optional()
    .custom(isValidEnum(['Online', 'Physical Training', 'Both Options', 'Schedule Only']))
    .withMessage('Invalid training mode'),
  
  query('gender')
    .optional()
    .custom(isValidEnum(['Male', 'Female', 'Other']))
    .withMessage('Invalid gender'),
  
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
    .toBoolean(),
  
  query('onboardingCompleted')
    .optional()
    .isBoolean()
    .withMessage('onboardingCompleted must be a boolean')
    .toBoolean(),
  
  query('hasProfilePhoto')
    .optional()
    .isBoolean()
    .withMessage('hasProfilePhoto must be a boolean')
    .toBoolean(),
  
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('dateFrom must be a valid ISO 8601 date')
    .toDate(),
  
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('dateTo must be a valid ISO 8601 date')
    .toDate(),
  
  query('approvedBy')
    .optional()
    .custom(isValidObjectId)
    .withMessage('approvedBy must be a valid ObjectId'),
  
  handleValidationErrors
];

const validateUserRejection = [
  param('userId')
    .custom(isValidObjectId)
    .withMessage('Invalid user ID format'),
  
  body('reason')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Rejection reason must be less than 500 characters')
    .customSanitizer(sanitizeString),
  
  handleValidationErrors
];

const validateBulkUserAction = [
  body('userIds')
    .isArray({ min: 1, max: 50 })
    .withMessage('userIds must be an array with 1-50 items')
    .custom((userIds) => {
      if (!userIds.every(id => isValidObjectId(id))) {
        throw new Error('All user IDs must be valid ObjectIds');
      }
      return true;
    }),
  
  handleValidationErrors
];

const validateBulkUserRejection = [
  body('userIds')
    .isArray({ min: 1, max: 50 })
    .withMessage('userIds must be an array with 1-50 items')
    .custom((userIds) => {
      if (!userIds.every(id => isValidObjectId(id))) {
        throw new Error('All user IDs must be valid ObjectIds');
      }
      return true;
    }),
  
  body('reason')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Rejection reason must be less than 500 characters')
    .customSanitizer(sanitizeString),
  
  handleValidationErrors
];

// Dashboard validation
const validateDashboardQuery = [
  query('period')
    .optional()
    .custom(isValidEnum(['day', 'week', 'month', 'year']))
    .withMessage('Period must be day, week, month, or year'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('startDate must be a valid ISO 8601 date')
    .toDate(),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('endDate must be a valid ISO 8601 date')
    .toDate(),
  
  handleValidationErrors
];

// Audit log validation
const validateAuditLogQuery = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be between 1 and 1000')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  
  query('action')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Action must be less than 50 characters')
    .customSanitizer(sanitizeString),
  
  query('adminId')
    .optional()
    .custom(isValidObjectId)
    .withMessage('adminId must be a valid ObjectId'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('startDate must be a valid ISO 8601 date')
    .toDate(),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('endDate must be a valid ISO 8601 date')
    .toDate(),
  
  handleValidationErrors
];

// Export validation
const validateExportQuery = [
  query('format')
    .optional()
    .custom(isValidEnum(['csv', 'json', 'xlsx']))
    .withMessage('Format must be csv, json, or xlsx'),
  
  query('type')
    .custom(isValidEnum(['users', 'audit-logs', 'dashboard-stats']))
    .withMessage('Type must be users, audit-logs, or dashboard-stats'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('startDate must be a valid ISO 8601 date')
    .toDate(),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('endDate must be a valid ISO 8601 date')
    .toDate(),
  
  handleValidationErrors
];

// Admin profile validation
const validateAdminProfileUpdate = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(VALIDATION_PATTERNS.alphanumeric)
    .withMessage('Username must contain only letters and numbers')
    .customSanitizer(sanitizeString),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email address is required')
    .customSanitizer(sanitizeEmail),
  
  body('currentPassword')
    .if(body('newPassword').exists())
    .notEmpty()
    .withMessage('Current password is required when changing password'),
  
  body('newPassword')
    .optional()
    .isLength({ min: 8, max: 128 })
    .withMessage('New password must be between 8 and 128 characters')
    .matches(VALIDATION_PATTERNS.password)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  handleValidationErrors
];

// System settings validation
const validateSystemSettings = [
  body('maxUsersPerPage')
    .optional()
    .isInt({ min: 10, max: 100 })
    .withMessage('maxUsersPerPage must be between 10 and 100')
    .toInt(),
  
  body('sessionTimeout')
    .optional()
    .isInt({ min: 300, max: 86400 })
    .withMessage('sessionTimeout must be between 300 and 86400 seconds')
    .toInt(),
  
  body('enableAuditLogging')
    .optional()
    .isBoolean()
    .withMessage('enableAuditLogging must be a boolean')
    .toBoolean(),
  
  body('maintenanceMode')
    .optional()
    .isBoolean()
    .withMessage('maintenanceMode must be a boolean')
    .toBoolean(),
  
  handleValidationErrors
];

// Common parameter validation
const validateCommonParams = [
  param('id')
    .optional()
    .custom(isValidObjectId)
    .withMessage('ID must be a valid ObjectId'),
  
  handleValidationErrors
];

// File upload validation
const validateFileUpload = (allowedTypes = [], maxSize = 10 * 1024 * 1024) => {
  return (req, res, next) => {
    if (!req.file) {
      return next();
    }

    // Validate file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type',
        code: ErrorCodes.INVALID_FILE_TYPE,
        allowedTypes
      });
    }

    // Validate file size
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        error: 'File too large',
        code: ErrorCodes.FILE_TOO_LARGE,
        maxSize: `${Math.round(maxSize / 1024 / 1024)}MB`
      });
    }

    // Validate filename
    const filename = req.file.originalname;
    if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filename',
        code: ErrorCodes.INVALID_FILENAME
      });
    }

    next();
  };
};

// Rate limiting validation
const validateRateLimitHeaders = (req, res, next) => {
  // Add rate limit information to response headers
  const rateLimitInfo = req.rateLimit;
  if (rateLimitInfo) {
    res.set({
      'X-RateLimit-Limit': rateLimitInfo.limit,
      'X-RateLimit-Remaining': rateLimitInfo.remaining,
      'X-RateLimit-Reset': new Date(Date.now() + rateLimitInfo.resetTime)
    });
  }
  next();
};

// Security headers validation
const validateSecurityHeaders = (req, res, next) => {
  // Check for required security headers in requests
  const requiredHeaders = ['user-agent'];
  const missingHeaders = requiredHeaders.filter(header => !req.get(header));
  
  if (missingHeaders.length > 0) {
    console.warn('🚫 Missing security headers:', {
      endpoint: `${req.method} ${req.originalUrl}`,
      missingHeaders,
      ip: req.ip
    });
  }
  
  next();
};

// Custom validation for specific business logic
const validateBusinessRules = {
  // Ensure user approval makes sense
  userApproval: (req, res, next) => {
    // Add custom business logic validation here
    next();
  },
  
  // Validate date ranges
  dateRange: (req, res, next) => {
    const { startDate, endDate } = req.query;
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start >= end) {
        return res.status(400).json({
          success: false,
          error: 'Start date must be before end date',
          code: ErrorCodes.INVALID_DATE_RANGE
        });
      }
      
      // Limit date range to prevent performance issues
      const maxRange = 365 * 24 * 60 * 60 * 1000; // 1 year
      if (end - start > maxRange) {
        return res.status(400).json({
          success: false,
          error: 'Date range cannot exceed 1 year',
          code: ErrorCodes.DATE_RANGE_TOO_LARGE
        });
      }
    }
    
    next();
  }
};

module.exports = {
  // Main validation functions
  validateAdminLogin,
  validateUserId,
  validateUserListQuery,
  validateUserRejection,
  validateBulkUserAction,
  validateBulkUserRejection,
  validateDashboardQuery,
  validateAuditLogQuery,
  validateExportQuery,
  validateAdminProfileUpdate,
  validateSystemSettings,
  validateCommonParams,
  
  // Utility functions
  validateFileUpload,
  validateRateLimitHeaders,
  validateSecurityHeaders,
  validateBusinessRules,
  handleValidationErrors,
  
  // Helper functions
  sanitizeString,
  sanitizeEmail,
  isValidObjectId,
  isValidDate,
  isValidEnum,
  
  // Patterns
  VALIDATION_PATTERNS
};
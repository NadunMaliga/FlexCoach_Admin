const mongoose = require('mongoose');

/**
 * Centralized Error Handling Middleware for FlexCoach Admin API
 * Provides consistent error response format and proper HTTP status codes
 */

// Error codes mapping
const ErrorCodes = {
  // Authentication errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_REQUIRED: 'TOKEN_REQUIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  ACCOUNT_DEACTIVATED: 'ACCOUNT_DEACTIVATED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  
  // Validation errors
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // Resource errors
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  ADMIN_NOT_FOUND: 'ADMIN_NOT_FOUND',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  DUPLICATE_EMAIL: 'DUPLICATE_EMAIL',
  DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',
  
  // Business logic errors
  USER_ALREADY_APPROVED: 'USER_ALREADY_APPROVED',
  USER_ALREADY_REJECTED: 'USER_ALREADY_REJECTED',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',
  
  // System errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  NETWORK_ERROR: 'NETWORK_ERROR',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS'
};

// HTTP status code mapping
const StatusCodes = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
};

/**
 * Custom Error Classes
 */
class AppError extends Error {
  constructor(message, statusCode, code = null, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, StatusCodes.BAD_REQUEST, ErrorCodes.VALIDATION_FAILED, details);
  }
}

class AuthenticationError extends AppError {
  constructor(message, code = ErrorCodes.INVALID_CREDENTIALS) {
    super(message, StatusCodes.UNAUTHORIZED, code);
  }
}

class AuthorizationError extends AppError {
  constructor(message, code = ErrorCodes.INSUFFICIENT_PERMISSIONS) {
    super(message, StatusCodes.FORBIDDEN, code);
  }
}

class NotFoundError extends AppError {
  constructor(message, code = ErrorCodes.RESOURCE_NOT_FOUND) {
    super(message, StatusCodes.NOT_FOUND, code);
  }
}

class ConflictError extends AppError {
  constructor(message, code = ErrorCodes.DUPLICATE_RESOURCE) {
    super(message, StatusCodes.CONFLICT, code);
  }
}

class DatabaseError extends AppError {
  constructor(message, originalError = null) {
    super(message, StatusCodes.INTERNAL_SERVER_ERROR, ErrorCodes.DATABASE_ERROR);
    this.originalError = originalError;
  }
}

/**
 * Error response formatter
 */
const formatErrorResponse = (error, req) => {
  const response = {
    success: false,
    error: error.message || 'An error occurred',
    code: error.code || ErrorCodes.INTERNAL_SERVER_ERROR,
    timestamp: new Date().toISOString(),
    requestId: req.requestId || 'unknown'
  };

  // Add details if available
  if (error.details) {
    response.details = error.details;
  }

  // Add stack trace in development mode
  if (process.env.NODE_ENV === 'development' && error.stack) {
    response.stack = error.stack;
  }

  // Add request information for debugging
  if (process.env.NODE_ENV === 'development') {
    response.request = {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      body: req.body,
      params: req.params,
      query: req.query
    };
  }

  return response;
};

/**
 * MongoDB error handler
 */
const handleMongoError = (error) => {
  let appError;

  // Duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    const value = error.keyValue[field];
    appError = new ConflictError(
      `${field} '${value}' already exists`,
      field === 'email' ? ErrorCodes.DUPLICATE_EMAIL : ErrorCodes.DUPLICATE_RESOURCE
    );
  }
  // Validation error
  else if (error.name === 'ValidationError') {
    const details = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message,
      value: err.value
    }));
    appError = new ValidationError('Validation failed', details);
  }
  // Cast error (invalid ObjectId)
  else if (error.name === 'CastError') {
    appError = new ValidationError(
      `Invalid ${error.path}: ${error.value}`,
      ErrorCodes.INVALID_FORMAT
    );
  }
  // Connection error
  else if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
    appError = new DatabaseError('Database connection error', error);
  }
  // Generic database error
  else {
    appError = new DatabaseError('Database operation failed', error);
  }

  return appError;
};

/**
 * JWT error handler
 */
const handleJWTError = (error) => {
  let appError;

  if (error.name === 'TokenExpiredError') {
    appError = new AuthenticationError('Token has expired', ErrorCodes.TOKEN_EXPIRED);
  } else if (error.name === 'JsonWebTokenError') {
    appError = new AuthenticationError('Invalid token', ErrorCodes.INVALID_TOKEN);
  } else if (error.name === 'NotBeforeError') {
    appError = new AuthenticationError('Token not active yet', ErrorCodes.INVALID_TOKEN);
  } else {
    appError = new AuthenticationError('Token verification failed', ErrorCodes.INVALID_TOKEN);
  }

  return appError;
};

/**
 * Request logging for errors
 */
const logError = (error, req, res) => {
  const logData = {
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    userId: req.user?.userId,
    adminId: req.admin?._id,
    error: {
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      stack: error.stack
    }
  };

  // Log based on error severity
  if (error.statusCode >= 500) {
    console.error('🚨 Server Error:', JSON.stringify(logData, null, 2));
  } else if (error.statusCode >= 400) {
    console.warn('⚠️  Client Error:', JSON.stringify(logData, null, 2));
  } else {
    console.info('ℹ️  Request Error:', JSON.stringify(logData, null, 2));
  }
};

/**
 * Main error handling middleware
 */
const errorHandler = (error, req, res, next) => {
  let appError = error;

  // Log the error
  logError(error, req, res);

  // Convert known errors to AppError instances
  if (!(error instanceof AppError)) {
    // Handle MongoDB errors
    if (error.name && (
      error.name.startsWith('Mongo') || 
      error.name === 'ValidationError' || 
      error.name === 'CastError'
    )) {
      appError = handleMongoError(error);
    }
    // Handle JWT errors
    else if (error.name && error.name.includes('Token')) {
      appError = handleJWTError(error);
    }
    // Handle express-validator errors (should be caught earlier, but just in case)
    else if (error.array && typeof error.array === 'function') {
      const details = error.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }));
      appError = new ValidationError('Validation failed', details);
    }
    // Handle generic errors
    else {
      appError = new AppError(
        error.message || 'Something went wrong',
        error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
        ErrorCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Format and send error response
  const errorResponse = formatErrorResponse(appError, req);
  
  // Set appropriate status code
  const statusCode = appError.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  
  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(
    `Route ${req.method} ${req.originalUrl} not found`,
    ErrorCodes.RESOURCE_NOT_FOUND
  );
  next(error);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors automatically
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Database connection error handler
 */
const handleDatabaseConnectionError = () => {
  const mongoose = require('mongoose');
  
  mongoose.connection.on('error', (error) => {
    console.error('🚨 MongoDB connection error:', error);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    console.info('✅ MongoDB reconnected');
  });

  // Handle process termination
  process.on('SIGINT', async () => {
    try {
      await mongoose.connection.close();
      console.info('📴 MongoDB connection closed through app termination');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error closing MongoDB connection:', error);
      process.exit(1);
    }
  });
};

/**
 * Unhandled rejection and exception handlers
 */
const setupGlobalErrorHandlers = () => {
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
    // Close server gracefully
    process.exit(1);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught Exception:', error);
    // Close server gracefully
    process.exit(1);
  });
};

module.exports = {
  // Error classes
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  
  // Error codes and status codes
  ErrorCodes,
  StatusCodes,
  
  // Middleware functions
  errorHandler,
  notFoundHandler,
  asyncHandler,
  
  // Utility functions
  formatErrorResponse,
  handleMongoError,
  handleJWTError,
  logError,
  
  // Setup functions
  handleDatabaseConnectionError,
  setupGlobalErrorHandlers
};
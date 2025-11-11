const rateLimit = require('express-rate-limit');
const AuditService = require('../services/auditService');

// Rate limiting configuration for different endpoint types
const rateLimitConfig = {
  // Strict rate limiting for login endpoints to prevent brute force attacks
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts per windowMs
    message: {
      success: false,
      error: 'Too many login attempts from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 15 * 60 // 15 minutes in seconds
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skipSuccessfulRequests: false, // Don't skip successful requests
    skipFailedRequests: false, // Don't skip failed requests
  },

  // Moderate rate limiting for general admin operations
  admin: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs for admin operations
    message: {
      success: false,
      error: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 15 * 60 // 15 minutes in seconds
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },

  // Stricter rate limiting for bulk operations
  bulk: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // Limit each IP to 10 bulk operations per 5 minutes
    message: {
      success: false,
      error: 'Too many bulk operations from this IP, please try again later.',
      code: 'BULK_RATE_LIMIT_EXCEEDED',
      retryAfter: 5 * 60 // 5 minutes in seconds
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },

  // Very strict rate limiting for sensitive operations (user approval/rejection)
  sensitive: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20, // Limit each IP to 20 sensitive operations per minute
    message: {
      success: false,
      error: 'Too many sensitive operations from this IP, please try again later.',
      code: 'SENSITIVE_RATE_LIMIT_EXCEEDED',
      retryAfter: 1 * 60 // 1 minute in seconds
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  }
};

// Enhanced rate limiter with logging and audit trail
const createRateLimiter = (type) => {
  const config = rateLimitConfig[type];
  
  if (!config) {
    throw new Error(`Invalid rate limiter type: ${type}`);
  }

  return rateLimit({
    ...config,
    // Custom key generator to handle IPv6 and proxy headers
    keyGenerator: (req) => {
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      // Normalize IPv6 addresses to avoid rate limiting errors
      return ip.replace(/^::ffff:/, '');
    },
    
    // Custom handler for rate limit exceeded
    handler: async (req, res) => {
      const clientInfo = {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        userId: req.user?.userId || null,
        email: req.user?.email || null,
        endpoint: `${req.method} ${req.path}`,
        timestamp: new Date().toISOString()
      };

      // Log rate limit violation for security monitoring
      console.warn(`🚨 Rate limit exceeded for ${type} endpoint:`, {
        ...clientInfo,
        rateLimitType: type,
        windowMs: config.windowMs,
        maxRequests: config.max
      });

      // Create audit log entry for rate limit violations
      try {
        if (req.user?.userId) {
          await AuditService.logAction(
            req.user.userId,
            'rate_limit_exceeded',
            'security',
            null,
            {
              rateLimitType: type,
              endpoint: `${req.method} ${req.path}`,
              clientInfo
            }
          );
        }
      } catch (auditError) {
        console.error('Failed to log rate limit violation to audit:', auditError);
      }

      // Send rate limit exceeded response
      res.status(429).json({
        ...config.message,
        details: {
          windowMs: config.windowMs,
          maxRequests: config.max,
          retryAfter: config.retryAfter,
          timestamp: new Date().toISOString()
        }
      });
    },

    // Skip rate limiting for certain conditions
    skip: (req) => {
      // Skip rate limiting for health checks
      if (req.path === '/health') {
        return true;
      }

      // Skip rate limiting in test environment
      if (process.env.NODE_ENV === 'test') {
        return true;
      }

      return false;
    },

    // Note: onLimitReached is deprecated in express-rate-limit v7+
    // Rate limit logging is handled in the custom handler function
  });
};

// Pre-configured rate limiters for different endpoint types
const rateLimiters = {
  // Login rate limiter - very strict to prevent brute force attacks
  login: createRateLimiter('login'),
  
  // General admin operations rate limiter
  admin: createRateLimiter('admin'),
  
  // Bulk operations rate limiter
  bulk: createRateLimiter('bulk'),
  
  // Sensitive operations rate limiter (approve/reject users)
  sensitive: createRateLimiter('sensitive')
};

// Middleware factory for applying appropriate rate limiting
const applyRateLimit = (type = 'admin') => {
  const limiter = rateLimiters[type];
  
  if (!limiter) {
    console.error(`Invalid rate limiter type: ${type}, falling back to admin limiter`);
    return rateLimiters.admin;
  }
  
  return limiter;
};

// Global rate limiter for all requests (very permissive, just for basic protection)
const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    code: 'GLOBAL_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip for health checks and test environment
    return req.path === '/health' || process.env.NODE_ENV === 'test';
  }
});

// Rate limit status endpoint for monitoring
const getRateLimitStatus = (req, res) => {
  const clientKey = req.ip || req.connection.remoteAddress || 'unknown';
  
  res.json({
    success: true,
    rateLimits: {
      client: clientKey,
      limits: {
        login: {
          windowMs: rateLimitConfig.login.windowMs,
          max: rateLimitConfig.login.max,
          description: 'Login attempts per 15 minutes'
        },
        admin: {
          windowMs: rateLimitConfig.admin.windowMs,
          max: rateLimitConfig.admin.max,
          description: 'Admin operations per 15 minutes'
        },
        bulk: {
          windowMs: rateLimitConfig.bulk.windowMs,
          max: rateLimitConfig.bulk.max,
          description: 'Bulk operations per 5 minutes'
        },
        sensitive: {
          windowMs: rateLimitConfig.sensitive.windowMs,
          max: rateLimitConfig.sensitive.max,
          description: 'Sensitive operations per minute'
        }
      },
      timestamp: new Date().toISOString()
    }
  });
};

module.exports = {
  rateLimiters,
  applyRateLimit,
  globalRateLimit,
  getRateLimitStatus,
  rateLimitConfig
};
const helmet = require('helmet');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const config = require('../config');
const Admin = require('../models/Admin');
const AuditService = require('../services/auditService');
const { AuthenticationError, AuthorizationError, ErrorCodes } = require('./errorHandler');

// Enhanced CORS configuration for admin mobile app
const corsOptions = {
  // Allow multiple origins for development and production
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',     // Client frontend
      'http://localhost:3001',     // Admin backend
      'http://localhost:19006',    // Expo development server
      'http://localhost:8081',     // Metro bundler
      'exp://localhost:19000',     // Expo app
      'exp://192.168.1.100:19000', // Expo app on local network
      config.CORS_ORIGIN,         // Production origin from config
      // Add more origins as needed for different environments
    ].filter(Boolean); // Remove any undefined values

    // Allow all origins in development
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  
  // Allow credentials for authentication
  credentials: true,
  
  // Allowed HTTP methods
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  
  // Allowed headers
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'X-File-Name',
    'X-Request-ID'
  ],
  
  // Exposed headers (visible to client)
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-Request-ID',
    'X-Response-Time',
    'RateLimit-Limit',
    'RateLimit-Remaining',
    'RateLimit-Reset'
  ],
  
  // Preflight cache duration
  maxAge: 86400, // 24 hours
  
  // Handle preflight requests
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Enhanced security headers configuration using helmet
const helmetOptions = {
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  
  // Cross-Origin Embedder Policy
  crossOriginEmbedderPolicy: false, // Disabled for mobile app compatibility
  
  // Cross-Origin Opener Policy
  crossOriginOpenerPolicy: { policy: "same-origin" },
  
  // Cross-Origin Resource Policy
  crossOriginResourcePolicy: { policy: "cross-origin" },
  
  // DNS Prefetch Control
  dnsPrefetchControl: { allow: false },
  
  // Frame Options
  frameguard: { action: 'deny' },
  
  // Hide Powered-By header
  hidePoweredBy: true,
  
  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  
  // IE No Open
  ieNoOpen: true,
  
  // No Sniff
  noSniff: true,
  
  // Origin Agent Cluster
  originAgentCluster: true,
  
  // Permitted Cross-Domain Policies
  permittedCrossDomainPolicies: false,
  
  // Referrer Policy
  referrerPolicy: { policy: "no-referrer" },
  
  // X-XSS-Protection
  xssFilter: true
};

// Request logging middleware for security audit trails
const requestLogger = (req, res, next) => {
  // Generate unique request ID if not already present
  if (!req.requestId) {
    req.requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // Capture request start time
  req.startTime = Date.now();

  // Extract client information
  const clientInfo = {
    ip: req.ip || req.connection.remoteAddress || req.socket.remoteAddress,
    userAgent: req.get('User-Agent'),
    origin: req.get('Origin'),
    referer: req.get('Referer'),
    method: req.method,
    url: req.originalUrl || req.url,
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  };

  // Log request for security monitoring
  console.log(`📝 ${clientInfo.method} ${clientInfo.url} - ${clientInfo.ip} - ${clientInfo.userAgent}`);

  // Store client info in request for later use
  req.clientInfo = clientInfo;

  // Log response when it finishes
  const originalSend = res.send;
  res.send = function(data) {
    const responseTime = Date.now() - req.startTime;
    const statusCode = res.statusCode;
    
    // Log response details
    console.log(`📤 ${clientInfo.method} ${clientInfo.url} - ${statusCode} - ${responseTime}ms - ${clientInfo.ip}`);
    
    // Log security-relevant events
    if (statusCode === 401 || statusCode === 403) {
      console.warn(`🔒 Authentication/Authorization failure: ${clientInfo.method} ${clientInfo.url} - ${statusCode} - ${clientInfo.ip}`);
    }
    
    if (statusCode === 429) {
      console.warn(`🚨 Rate limit exceeded: ${clientInfo.method} ${clientInfo.url} - ${clientInfo.ip}`);
    }
    
    // Call original send method
    return originalSend.call(this, data);
  };

  next();
};

// Enhanced JWT token validation middleware
const validateJWTToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  // Check if Authorization header exists
  if (!authHeader) {
    const error = new AuthenticationError('Authorization header required', ErrorCodes.TOKEN_REQUIRED);
    return next(error);
  }

  // Check if Authorization header follows Bearer token format
  if (!authHeader.startsWith('Bearer ')) {
    const error = new AuthenticationError('Authorization header must use Bearer token format', ErrorCodes.INVALID_TOKEN);
    return next(error);
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    const error = new AuthenticationError('Access token required', ErrorCodes.TOKEN_REQUIRED);
    return next(error);
  }

  // Verify JWT token
  try {
    jwt.verify(token, config.JWT_SECRET || 'flexcoach_admin_super_secret_key_2024', (err, decoded) => {
      if (err) {
        let errorCode = ErrorCodes.INVALID_TOKEN;
        let errorMessage = 'Invalid token';

        if (err.name === 'TokenExpiredError') {
          errorCode = ErrorCodes.TOKEN_EXPIRED;
          errorMessage = 'Token has expired';
        } else if (err.name === 'JsonWebTokenError') {
          errorCode = ErrorCodes.INVALID_TOKEN;
          errorMessage = 'Invalid token format';
        } else if (err.name === 'NotBeforeError') {
          errorCode = ErrorCodes.TOKEN_NOT_ACTIVE;
          errorMessage = 'Token not active yet';
        }

        // Log token validation failure
        console.warn(`🔑 JWT validation failed: ${errorMessage} - ${req.clientInfo?.ip} - ${req.clientInfo?.userAgent}`);

        const authError = new AuthenticationError(errorMessage, errorCode);
        return next(authError);
      }

      // Validate token payload structure
      if (!decoded.userId || !decoded.userType || !decoded.email) {
        console.warn(`🔑 Invalid JWT payload structure - ${req.clientInfo?.ip}`);
        const authError = new AuthenticationError('Invalid token payload', ErrorCodes.INVALID_TOKEN);
        return next(authError);
      }

      // Store decoded token data in request
      req.user = decoded;
      
      // Log successful token validation
      console.log(`✅ JWT validated for user: ${decoded.email} (${decoded.userType})`);
      
      next();
    });
  } catch (jwtError) {
    // Handle synchronous JWT errors
    console.warn(`🔑 JWT verification error: ${jwtError.message} - ${req.clientInfo?.ip}`);
    const authError = new AuthenticationError('Token verification failed', ErrorCodes.INVALID_TOKEN);
    return next(authError);
  }


};

// Enhanced admin authorization middleware with comprehensive security checks
const requireAdminAuth = async (req, res, next) => {
  try {
    // Verify user type from token matches admin
    if (req.user.userType !== 'admin') {
      console.warn(`🚫 Non-admin user attempted admin access: ${req.user.email} - ${req.clientInfo?.ip}`);
      
      // Log unauthorized access attempt
      if (req.user.userId) {
        try {
          await AuditService.logAction(
            req.user.userId,
            'unauthorized_admin_access',
            'security',
            null,
            {
              userType: req.user.userType,
              endpoint: `${req.method} ${req.originalUrl}`,
              clientInfo: req.clientInfo
            }
          );
        } catch (auditError) {
          console.error('Failed to log unauthorized access attempt:', auditError);
        }
      }
      
      const error = new AuthorizationError('Admin access required', ErrorCodes.INSUFFICIENT_PERMISSIONS);
      return next(error);
    }

    // Handle simple admin case (for development/simple setup)
    if (req.user.userId === 'admin' && req.user.userType === 'admin') {
      // Create a simple admin object for the simple admin case
      req.admin = {
        _id: 'admin',
        username: 'admin',
        email: 'admin@gmail.com',
        role: 'admin',
        isActive: true,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      return next();
    }

    // Validate admin ID format for database admins
    if (!mongoose.Types.ObjectId.isValid(req.user.userId)) {
      console.warn(`🚫 Invalid admin ID format: ${req.user.userId} - ${req.clientInfo?.ip}`);
      const error = new AuthenticationError('Invalid admin ID format', ErrorCodes.INVALID_ADMIN_ID);
      return next(error);
    }

    // Fetch admin from database with security checks
    const admin = await Admin.findById(req.user.userId).select('+isActive +lastLogin');

    if (!admin) {
      console.warn(`🚫 Admin account not found: ${req.user.userId} - ${req.clientInfo?.ip}`);
      const error = new AuthenticationError('Admin account not found', ErrorCodes.ADMIN_NOT_FOUND);
      return next(error);
    }

    // Check if admin account is active
    if (!admin.isActive) {
      console.warn(`🚫 Deactivated admin attempted access: ${admin.email} - ${req.clientInfo?.ip}`);
      
      // Log deactivated account access attempt
      try {
        await AuditService.logAction(
          admin._id,
          'deactivated_admin_access',
          'security',
          null,
          {
            endpoint: `${req.method} ${req.originalUrl}`,
            clientInfo: req.clientInfo
          }
        );
      } catch (auditError) {
        console.error('Failed to log deactivated admin access:', auditError);
      }
      
      const error = new AuthorizationError('Admin account is deactivated', ErrorCodes.ACCOUNT_DEACTIVATED);
      return next(error);
    }

    // Additional security check: verify token email matches admin email
    if (req.user.email !== admin.email) {
      console.warn(`🚫 Token email mismatch: token=${req.user.email}, admin=${admin.email} - ${req.clientInfo?.ip}`);
      
      // Log token mismatch attempt
      try {
        await AuditService.logAction(
          admin._id,
          'token_email_mismatch',
          'security',
          null,
          {
            tokenEmail: req.user.email,
            adminEmail: admin.email,
            endpoint: `${req.method} ${req.originalUrl}`,
            clientInfo: req.clientInfo
          }
        );
      } catch (auditError) {
        console.error('Failed to log token mismatch:', auditError);
      }
      
      const error = new AuthorizationError('Token email mismatch', ErrorCodes.TOKEN_EMAIL_MISMATCH);
      return next(error);
    }

    // Update admin's last activity timestamp for session tracking
    try {
      admin.lastLogin = new Date();
      await admin.save();
    } catch (updateError) {
      console.warn('Failed to update admin last login:', updateError);
      // Don't fail the request for this non-critical update
    }

    // Store admin object in request for use in route handlers
    req.admin = admin;
    
    // Log successful admin authentication
    console.log(`✅ Admin authenticated: ${admin.email} - ${req.clientInfo?.ip}`);
    
    next();
  } catch (error) {
    console.error('Admin authentication middleware error:', error);
    
    // Log middleware error
    try {
      if (req.user?.userId) {
        await AuditService.logAction(
          req.user.userId,
          'admin_auth_middleware_error',
          'security',
          null,
          {
            error: error.message,
            endpoint: `${req.method} ${req.originalUrl}`,
            clientInfo: req.clientInfo
          }
        );
      }
    } catch (auditError) {
      console.error('Failed to log middleware error:', auditError);
    }
    
    const authError = new AuthenticationError('Internal server error during admin validation', ErrorCodes.INTERNAL_SERVER_ERROR);
    next(authError);
  }
};

// Security monitoring middleware to detect suspicious activity
const securityMonitor = (req, res, next) => {
  const clientInfo = req.clientInfo;
  
  // Monitor for suspicious patterns
  const suspiciousPatterns = [
    // SQL injection attempts
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
    // XSS attempts
    /<script|javascript:|onload=|onerror=/i,
    // Path traversal attempts
    /\.\.\//,
    // Command injection attempts (excluding normal query parameter & and legitimate parentheses)
    /[;|`$]|&&|\|\||[()]{2,}/
  ];

  // Check URL and query parameters for suspicious content
  const urlToCheck = req.originalUrl || req.url;
  const bodyToCheck = JSON.stringify(req.body || {});
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(urlToCheck) || pattern.test(bodyToCheck)) {
      console.warn(`🚨 Suspicious request detected: ${pattern} - ${clientInfo?.ip} - ${urlToCheck}`);
      
      // Log security incident
      if (req.user?.userId) {
        AuditService.logAction(
          req.user.userId,
          'suspicious_request',
          'security',
          null,
          {
            pattern: pattern.toString(),
            url: urlToCheck,
            body: req.body,
            clientInfo
          }
        ).catch(err => console.error('Failed to log suspicious request:', err));
      }
      
      // Return 400 Bad Request for suspicious content
      return res.status(400).json({
        success: false,
        error: 'Invalid request content',
        code: ErrorCodes.INVALID_INPUT
      });
    }
  }
  
  next();
};

// IP whitelist middleware (optional, for production use)
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    // Skip IP checking in development
    if (process.env.NODE_ENV === 'development') {
      return next();
    }
    
    // Skip if no whitelist configured
    if (!allowedIPs || allowedIPs.length === 0) {
      return next();
    }
    
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (!allowedIPs.includes(clientIP)) {
      console.warn(`🚫 IP not whitelisted: ${clientIP}`);
      return res.status(403).json({
        success: false,
        error: 'Access denied from this IP address',
        code: ErrorCodes.IP_NOT_ALLOWED
      });
    }
    
    next();
  };
};

module.exports = {
  // CORS configuration
  corsOptions,
  corsMiddleware: cors(corsOptions),
  
  // Security headers
  helmetOptions,
  helmetMiddleware: helmet(helmetOptions),
  
  // Authentication and authorization
  validateJWTToken,
  requireAdminAuth,
  
  // Request logging and monitoring
  requestLogger,
  securityMonitor,
  
  // Optional security features
  ipWhitelist,
  
  // Combined security middleware stack
  securityStack: [
    requestLogger,
    cors(corsOptions),
    helmet(helmetOptions),
    securityMonitor
  ],
  
  // Authentication stack
  authStack: [
    validateJWTToken,
    requireAdminAuth
  ]
};
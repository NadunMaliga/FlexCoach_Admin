const express = require('express');
const cors = require('cors');
const compression = require('compression');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const config = require('./config');

// Import models
const User = require('./models/User');
const Admin = require('./models/Admin');
const AuditLog = require('./models/AuditLog');
const Exercise = require('./models/Exercise');
const Food = require('./models/Food');
const Diet = require('./models/Diet');
const Workout = require('./models/Workout');
const Chat = require('./models/Chat');
const Measurement = require('./models/Measurement');
const Photo = require('./models/Photo');
const UserProfile = require('./models/UserProfile');

// Import audit services and middleware
const AuditService = require('./services/auditService');
const {
  auditLogger,
  auditLoginAttempt,
  auditLogout,
  auditUserApproval,
  auditUserRejection,
  auditDashboardAccess,
  auditProfileView
} = require('./middleware/auditMiddleware');

// Import validation and error handling middleware
const {
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
  validateCommonParams
} = require('./middleware/validation');

const {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  ErrorCodes,
  StatusCodes,
  handleDatabaseConnectionError,
  setupGlobalErrorHandlers
} = require('./middleware/errorHandler');

// Import enhanced security and rate limiting middleware
const {
  corsOptions,
  corsMiddleware,
  helmetMiddleware,
  validateJWTToken,
  requireAdminAuth,
  requestLogger,
  securityMonitor,
  securityStack,
  authStack
} = require('./middleware/security');

const {
  rateLimiters,
  applyRateLimit,
  globalRateLimit,
  getRateLimitStatus
} = require('./middleware/rateLimiter');

const app = express();

// Apply enhanced security middleware stack
console.log('🔒 Applying enhanced security middleware...');

// Global rate limiting (very permissive, just for basic protection)
app.use(globalRateLimit);

// Enhanced security headers using helmet
app.use(helmetMiddleware);

// Request logging and security monitoring
app.use(requestLogger);
app.use(securityMonitor);

// Enhanced CORS configuration for admin mobile app
app.use(corsMiddleware);

// Enhanced compression middleware for mobile data optimization
app.use(compression({
  level: 6, // Compression level (1-9, 6 is default)
  threshold: 512, // Compress responses larger than 512 bytes (optimized for mobile)
  filter: (req, res) => {
    // Don't compress responses with this request header
    if (req.headers['x-no-compression']) {
      return false;
    }

    // Always compress JSON responses for mobile efficiency
    if (res.getHeader('Content-Type') && res.getHeader('Content-Type').includes('application/json')) {
      return true;
    }

    // Use compression filter function for other content types
    return compression.filter(req, res);
  }
}));

// JSON parsing with error handling
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf, encoding) => {
    try {
      JSON.parse(buf);
    } catch (error) {
      error.statusCode = 400;
      error.code = ErrorCodes.INVALID_FORMAT;
      throw error;
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mobile-optimized response formatting middleware
app.use((req, res, next) => {
  // Store original json method
  const originalJson = res.json;

  // Override json method to ensure consistent mobile-friendly formatting
  res.json = function (data) {
    // Set mobile-optimized headers
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Add request ID for tracking (useful for mobile debugging)
    if (req.requestId) {
      res.setHeader('X-Request-ID', req.requestId);
    }

    // Add response time header for mobile performance monitoring
    const responseTime = Date.now() - (req.startTime || Date.now());
    res.setHeader('X-Response-Time', `${responseTime}ms`);

    // Ensure consistent response structure for mobile consumption
    let responseData;

    if (data && typeof data === 'object') {
      // If data already has success field and proper structure, use as is
      if (data.hasOwnProperty('success')) {
        responseData = data;

        // Add metadata if not already present
        if (!responseData.meta && !responseData.requestId) {
          responseData.requestId = req.requestId || 'unknown';
          responseData.responseTime = responseTime;
        }
      } else {
        // Wrap data in consistent success response format
        responseData = {
          success: true,
          data: data,
          requestId: req.requestId || 'unknown',
          responseTime: responseTime,
          timestamp: new Date().toISOString()
        };
      }
    } else {
      // Handle primitive data types
      responseData = {
        success: true,
        data: data,
        requestId: req.requestId || 'unknown',
        responseTime: responseTime,
        timestamp: new Date().toISOString()
      };
    }

    // Call original json method with formatted data
    return originalJson.call(this, responseData);
  };

  // Add request start time for response time calculation
  req.startTime = Date.now();

  next();
});

const JWT_SECRET = config.JWT_SECRET;

// Request ID middleware for all requests (mobile debugging support)
app.use((req, res, next) => {
  // Generate unique request ID for tracking
  req.requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  next();
});

// Input validation middleware for admin endpoints
const validateAdminEndpoint = (req, res, next) => {
  // Log admin endpoint access for security monitoring
  console.log(`Admin endpoint accessed: ${req.method} ${req.path} by admin: ${req.user?.email || 'unknown'} at ${new Date().toISOString()}`);

  next();
};

// Connect to MongoDB (shared database with client backend)
mongoose.connect(config.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB (shared database: flexcoach)'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Enhanced authentication middleware is now imported from ./middleware/security.js
// Using validateJWTToken and requireAdminAuth from the security module
// These provide enhanced security features including:
// - Comprehensive JWT validation with detailed error handling
// - Admin account verification with security checks
// - Audit logging for authentication events
// - Request logging and security monitoring

// Simple authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'Authorization header required',
      code: 'TOKEN_REQUIRED'
    });
  }

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authorization header must use Bearer token format',
      code: 'INVALID_TOKEN'
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required',
      code: 'TOKEN_REQUIRED'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }

    req.user = user;
    next();
  });
};

const requireAdmin = requireAdminAuth;

// Routes

// Test endpoint to verify server changes
app.get('/test-login', (req, res) => {
  res.json({
    success: true,
    message: 'Login endpoint updated - expecting email and password',
    expectedCredentials: {
      email: 'admin@gmail.com',
      password: 'Password123'
    },
    timestamp: new Date().toISOString()
  });
});

// Enhanced health check with mobile-optimized information
app.get('/health', (req, res) => {
  const healthData = {
    success: true,
    status: 'OK',
    message: 'FlexCoach Admin Backend is running',
    system: {
      database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
      databaseName: mongoose.connection.db ? mongoose.connection.db.databaseName : 'Unknown',
      port: config.PORT,
      environment: config.NODE_ENV,
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
    },
    features: {
      compression: 'enabled (optimized for mobile)',
      cors: 'configured for mobile apps',
      sharedDatabase: config.MONGODB_URI,
      adminPort: '3001 (separate from client backend on 3000)',
      mobileOptimizations: [
        'Response compression',
        'Consistent JSON format',
        'Request tracking',
        'Mobile-friendly error messages',
        'Optimized payload sizes'
      ]
    },
    endpoints: {
      authentication: [
        'POST /api/admin/login',
        'GET /api/admin/profile',
        'POST /api/admin/logout',
        'POST /api/admin/refresh-token'
      ],
      userManagement: [
        'GET /api/admin/users',
        'GET /api/admin/users/pending',
        'GET /api/admin/users/filters',
        'GET /api/admin/users/:userId',
        'POST /api/admin/users/:userId/approve',
        'POST /api/admin/users/:userId/reject',
        'POST /api/admin/users/bulk-approve',
        'POST /api/admin/users/bulk-reject'
      ],
      dashboard: [
        'GET /api/admin/dashboard/stats'
      ]
    }
  };

  // Don't wrap health check in the standard response format
  // as it's already properly structured
  res.status(200).json(healthData);
});

// Rate limit status endpoint for monitoring
app.get('/api/admin/rate-limit-status', applyRateLimit('admin'), authenticateToken, requireAdmin, getRateLimitStatus);

// Admin Authentication Routes

// Simple password-based admin login
app.post('/api/admin/login', applyRateLimit('login'), asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt:', { email, password: password ? '***' : 'missing' });

    // Simple email and password check
    if (email !== 'admin@gmail.com' || password !== 'Password123') {
      console.log('Login failed - invalid credentials');
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    console.log('Login successful');

    // Generate JWT token for simple admin access
    const token = jwt.sign(
      {
        userId: 'admin',
        userType: 'admin',
        role: 'admin',
        username: 'admin',
        email: 'admin@gmail.com'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return success response
    res.json({
      success: true,
      message: 'Login successful',
      token,
      admin: {
        id: 'admin',
        username: 'admin',
        role: 'admin',
        isActive: true,
        lastLogin: new Date()
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
}));

// Get admin profile endpoint for admin details
app.get('/api/admin/profile', authenticateToken, requireAdmin, validateAdminEndpoint, async (req, res) => {
  try {
    const admin = req.admin;

    // Return comprehensive admin profile data
    res.json({
      success: true,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
        lastLogin: admin.lastLogin,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt
      }
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
});

// Admin logout functionality
app.post('/api/admin/logout', authenticateToken, auditLogout, async (req, res) => {
  try {
    // In a stateless JWT system, logout is handled client-side by removing the token
    // However, we can log the logout action for audit purposes
    const admin = await Admin.findById(req.user.userId);
    if (admin) {
      console.log(`Admin logout: ${admin.email} at ${new Date().toISOString()}`);
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Admin logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
});

// Token refresh mechanism for mobile app
app.post('/api/admin/refresh-token', authenticateToken, async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.userId);
    if (!admin || !admin.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Admin account not found or deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Generate new JWT token
    const newToken = jwt.sign(
      {
        userId: admin._id,
        email: admin.email,
        userType: 'admin',
        role: admin.role,
        username: admin.username
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      token: newToken,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
        lastLogin: admin.lastLogin
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
});

// User Management Routes

// Enhanced user management with advanced filtering and search capabilities
app.get('/api/admin/users', authenticateToken, requireAdmin, validateUserListQuery, validateAdminEndpoint, asyncHandler(async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      trainingMode,
      gender,
      isActive,
      onboardingCompleted,
      dateFrom,
      dateTo,
      approvedBy,
      hasProfilePhoto
    } = req.query;

    // Build query object with enhanced filtering
    const query = {};

    // Status filtering (pending, approved, rejected)
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query.status = status;
    }

    // Training mode filtering
    if (trainingMode && ['Online', 'Physical Training', 'Both Options', 'Schedule Only'].includes(trainingMode)) {
      query.trainingMode = trainingMode;
    }

    // Gender filtering
    if (gender && ['Male', 'Female', 'Other'].includes(gender)) {
      query.gender = gender;
    }

    // Active status filtering
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Onboarding completion filtering
    if (onboardingCompleted !== undefined) {
      query.onboardingCompleted = onboardingCompleted === 'true';
    }

    // Profile photo filtering
    if (hasProfilePhoto !== undefined) {
      if (hasProfilePhoto === 'true') {
        query.profilePhoto = { $ne: null, $ne: '' };
      } else {
        query.$or = [
          { profilePhoto: null },
          { profilePhoto: '' }
        ];
      }
    }

    // Date range filtering
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999); // Include the entire day
        query.createdAt.$lte = endDate;
      }
    }

    // Approved by specific admin filtering
    if (approvedBy && mongoose.Types.ObjectId.isValid(approvedBy)) {
      query.approvedBy = approvedBy;
    }

    // Enhanced search functionality
    if (search && search.trim()) {
      const searchTerm = search.trim();
      const searchRegex = { $regex: searchTerm, $options: 'i' };

      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { mobile: searchRegex },
        // Search in full name (firstName + lastName)
        {
          $expr: {
            $regexMatch: {
              input: { $concat: ['$firstName', ' ', '$lastName'] },
              regex: searchTerm,
              options: 'i'
            }
          }
        }
      ];

      // If search term looks like an email, prioritize email search
      if (searchTerm.includes('@')) {
        query.$or.unshift({ email: searchRegex });
      }

      // If search term is numeric, search in mobile numbers
      if (/^\d+$/.test(searchTerm)) {
        query.$or.unshift({ mobile: searchRegex });
      }
    }

    // Enhanced sorting options
    const allowedSortFields = [
      'createdAt', 'updatedAt', 'firstName', 'lastName', 'email',
      'status', 'trainingMode', 'gender', 'birthday', 'approvedAt', 'rejectedAt'
    ];

    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const sortOptions = {};
    sortOptions[sortField] = sortDirection;

    // Add secondary sort by createdAt for consistent ordering
    if (sortField !== 'createdAt') {
      sortOptions.createdAt = -1;
    }

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 items per page

    // Execute query with enhanced population
    const users = await User.find(query)
      .sort(sortOptions)
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .populate('approvedBy', 'username email role')
      .populate('rejectedBy', 'username email role')
      .select('-__v -password');

    // Get total count for pagination
    const total = await User.countDocuments(query);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limitNum);
    const hasNext = pageNum < totalPages;
    const hasPrev = pageNum > 1;

    // Enhanced response with filtering metadata
    res.json({
      success: true,
      users,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalUsers: total,
        usersPerPage: limitNum,
        hasNext,
        hasPrev,
        nextPage: hasNext ? pageNum + 1 : null,
        prevPage: hasPrev ? pageNum - 1 : null
      },
      filters: {
        applied: {
          status: status || null,
          trainingMode: trainingMode || null,
          gender: gender || null,
          isActive: isActive || null,
          onboardingCompleted: onboardingCompleted || null,
          hasProfilePhoto: hasProfilePhoto || null,
          dateFrom: dateFrom || null,
          dateTo: dateTo || null,
          approvedBy: approvedBy || null,
          search: search || null
        },
        available: {
          statuses: ['pending', 'approved', 'rejected'],
          trainingModes: ['Online', 'Physical Training', 'Both Options', 'Schedule Only'],
          genders: ['Male', 'Female', 'Other'],
          booleanFilters: ['isActive', 'onboardingCompleted', 'hasProfilePhoto']
        }
      },
      sorting: {
        sortBy: sortField,
        sortOrder: sortOrder,
        availableFields: allowedSortFields
      },
      metadata: {
        queryExecutionTime: Date.now() - req.startTime,
        filtersApplied: Object.keys(req.query).length,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'USER_FETCH_ERROR',
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
}));

// Get pending users with enhanced filtering
app.get('/api/admin/users/pending', authenticateToken, requireAdmin, validateAdminEndpoint, async (req, res) => {
  try {
    const {
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      trainingMode,
      gender
    } = req.query;

    const query = { status: 'pending' };

    // Apply additional filters for pending users
    if (trainingMode && ['Online', 'Physical Training', 'Both Options', 'Schedule Only'].includes(trainingMode)) {
      query.trainingMode = trainingMode;
    }

    if (gender && ['Male', 'Female', 'Other'].includes(gender)) {
      query.gender = gender;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const pendingUsers = await User.find(query)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .select('-__v -password');

    res.json({
      success: true,
      users: pendingUsers,
      count: pendingUsers.length,
      filters: {
        trainingMode: trainingMode || null,
        gender: gender || null
      },
      metadata: {
        lastUpdated: new Date().toISOString(),
        urgent: pendingUsers.length > 10 // Flag if many pending users
      }
    });
  } catch (error) {
    console.error('Get pending users error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'PENDING_USERS_ERROR'
    });
  }
});

// Get available filter options for user management
app.get('/api/admin/users/filters', authenticateToken, requireAdmin, validateAdminEndpoint, async (req, res) => {
  try {
    // Get unique values for dynamic filtering
    const [trainingModes, genders, admins] = await Promise.all([
      User.distinct('trainingMode'),
      User.distinct('gender'),
      User.find({ approvedBy: { $ne: null } })
        .populate('approvedBy', 'username email')
        .distinct('approvedBy')
    ]);

    // Get date ranges for filtering
    const oldestUser = await User.findOne().sort({ createdAt: 1 }).select('createdAt');
    const newestUser = await User.findOne().sort({ createdAt: -1 }).select('createdAt');

    res.json({
      success: true,
      filters: {
        status: {
          options: ['pending', 'approved', 'rejected'],
          default: null
        },
        trainingMode: {
          options: trainingModes.filter(mode => mode), // Remove null values
          default: null
        },
        gender: {
          options: genders.filter(gender => gender), // Remove null values
          default: null
        },
        isActive: {
          options: [true, false],
          labels: ['Active', 'Inactive'],
          default: null
        },
        onboardingCompleted: {
          options: [true, false],
          labels: ['Completed', 'Not Completed'],
          default: null
        },
        hasProfilePhoto: {
          options: [true, false],
          labels: ['Has Photo', 'No Photo'],
          default: null
        },
        dateRange: {
          min: oldestUser?.createdAt || new Date(),
          max: newestUser?.createdAt || new Date(),
          format: 'YYYY-MM-DD'
        },
        approvedBy: {
          options: admins.map(admin => ({
            id: admin._id,
            name: admin.username,
            email: admin.email
          })),
          default: null
        }
      },
      sorting: {
        fields: [
          { key: 'createdAt', label: 'Registration Date' },
          { key: 'updatedAt', label: 'Last Updated' },
          { key: 'firstName', label: 'First Name' },
          { key: 'lastName', label: 'Last Name' },
          { key: 'email', label: 'Email' },
          { key: 'status', label: 'Status' },
          { key: 'trainingMode', label: 'Training Mode' },
          { key: 'gender', label: 'Gender' },
          { key: 'birthday', label: 'Birthday' },
          { key: 'approvedAt', label: 'Approval Date' },
          { key: 'rejectedAt', label: 'Rejection Date' }
        ],
        orders: [
          { key: 'asc', label: 'Ascending' },
          { key: 'desc', label: 'Descending' }
        ],
        default: {
          sortBy: 'createdAt',
          sortOrder: 'desc'
        }
      },
      pagination: {
        defaultLimit: 20,
        maxLimit: 100,
        minLimit: 1
      },
      metadata: {
        totalUsers: await User.countDocuments(),
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Get filter options error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'FILTER_OPTIONS_ERROR'
    });
  }
});

// Get user by ID
app.get('/api/admin/users/:userId', authenticateToken, requireAdmin, validateAdminEndpoint, auditProfileView, async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format',
        code: 'INVALID_USER_ID'
      });
    }

    const user = await User.findById(userId)
      .populate('approvedBy', 'username email')
      .select('-__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Approve user with sensitive operation rate limiting
app.post('/api/admin/users/:userId/approve', applyRateLimit('sensitive'), authenticateToken, requireAdmin, validateUserId, validateAdminEndpoint, auditUserApproval, asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format',
        code: 'INVALID_USER_ID'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.status === 'approved') {
      return res.status(400).json({
        success: false,
        error: 'User is already approved'
      });
    }

    user.status = 'approved';
    user.isApproved = true;
    user.approvedBy = req.admin._id;
    user.approvedAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'User approved successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
        approvedAt: user.approvedAt
      }
    });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}));

// Update user status (activate/deactivate)
app.patch('/api/admin/users/:userId/status', applyRateLimit('sensitive'), authenticateToken, requireAdmin, validateAdminEndpoint, asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format',
        code: 'INVALID_USER_ID'
      });
    }

    // Validate isActive parameter
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'isActive must be a boolean value',
        code: 'INVALID_STATUS'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Update user status
    user.isActive = isActive;
    user.updatedAt = new Date();
    await user.save();

    // Log the status change
    await AuditService.logAction({
      adminId: req.admin._id,
      action: isActive ? 'user_activated' : 'user_deactivated',
      resource: 'user',
      resourceId: userId,
      details: {
        previousStatus: !isActive,
        newStatus: isActive,
        userEmail: user.email,
        userName: `${user.firstName} ${user.lastName}`
      },
      ipAddress: req.clientInfo?.ip,
      userAgent: req.get('User-Agent'),
      success: true
    });

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'USER_STATUS_UPDATE_ERROR'
    });
  }
}));

// Reject user with sensitive operation rate limiting
app.post('/api/admin/users/:userId/reject', applyRateLimit('sensitive'), authenticateToken, requireAdmin, validateUserRejection, validateAdminEndpoint, auditUserRejection, asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format',
        code: 'INVALID_USER_ID'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (user.status === 'rejected') {
      return res.status(400).json({
        success: false,
        error: 'User is already rejected',
        code: 'USER_ALREADY_REJECTED'
      });
    }

    // Update user status to rejected with proper fields
    user.status = 'rejected';
    user.isApproved = false;
    user.rejectedReason = reason || 'No reason provided';
    user.rejectedBy = req.admin._id;
    user.rejectedAt = new Date();

    // Clear approval fields if user was previously approved
    if (user.status === 'approved') {
      user.approvedBy = undefined;
      user.approvedAt = undefined;
    }

    await user.save();

    res.json({
      success: true,
      message: 'User rejected successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
        rejectedReason: user.rejectedReason,
        rejectedBy: user.rejectedBy,
        rejectedAt: user.rejectedAt
      }
    });
  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
}));

// Bulk User Operations

// Bulk approve users with bulk operation rate limiting
app.post('/api/admin/users/bulk-approve', applyRateLimit('bulk'), authenticateToken, requireAdmin, validateBulkUserAction, validateAdminEndpoint, asyncHandler(async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }))
      });
    }

    const { userIds } = req.body;

    // Validate that we don't have too many users (prevent system overload)
    if (userIds.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Cannot approve more than 100 users at once',
        code: 'BULK_LIMIT_EXCEEDED'
      });
    }

    // Remove duplicates
    const uniqueUserIds = [...new Set(userIds)];

    // Find users that exist and are pending
    const users = await User.find({
      _id: { $in: uniqueUserIds },
      status: 'pending'
    });

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No pending users found with the provided IDs',
        code: 'NO_PENDING_USERS'
      });
    }

    // Track results
    const results = {
      successful: [],
      failed: [],
      alreadyProcessed: []
    };

    // Check for users that don't exist or aren't pending
    const foundUserIds = users.map(user => user._id.toString());
    const notFoundIds = uniqueUserIds.filter(id => !foundUserIds.includes(id));

    // Find users that exist but aren't pending
    if (notFoundIds.length > 0) {
      const existingUsers = await User.find({
        _id: { $in: notFoundIds }
      });

      existingUsers.forEach(user => {
        if (user.status !== 'pending') {
          results.alreadyProcessed.push({
            userId: user._id,
            email: user.email,
            currentStatus: user.status,
            reason: `User is already ${user.status}`
          });
        }
      });

      // Add truly not found users to failed
      const existingUserIds = existingUsers.map(u => u._id.toString());
      const trulyNotFound = notFoundIds.filter(id => !existingUserIds.includes(id));
      trulyNotFound.forEach(userId => {
        results.failed.push({
          userId,
          reason: 'User not found'
        });
      });
    }

    // Perform bulk approval using MongoDB's updateMany for efficiency
    const bulkUpdateResult = await User.updateMany(
      {
        _id: { $in: users.map(u => u._id) },
        status: 'pending'
      },
      {
        $set: {
          status: 'approved',
          isApproved: true,
          approvedBy: req.admin._id,
          approvedAt: new Date()
        }
      }
    );

    // Add successful approvals to results
    users.forEach(user => {
      results.successful.push({
        userId: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        approvedAt: new Date()
      });
    });

    // Log bulk action for audit trail
    try {
      await AuditService.logBulkAction(
        req.admin._id,
        'bulk_approve',
        users.map(u => u._id.toString()),
        req.ip || req.connection.remoteAddress,
        req.get('User-Agent'),
        {
          totalRequested: uniqueUserIds.length,
          successfullyApproved: results.successful.length,
          alreadyProcessed: results.alreadyProcessed.length,
          failed: results.failed.length
        }
      );
    } catch (auditError) {
      console.error('Failed to log bulk approval audit:', auditError);
      // Don't fail the operation due to audit logging issues
    }

    // Return comprehensive results
    res.json({
      success: true,
      message: `Bulk approval completed. ${results.successful.length} users approved successfully.`,
      results: {
        summary: {
          totalRequested: uniqueUserIds.length,
          successful: results.successful.length,
          failed: results.failed.length,
          alreadyProcessed: results.alreadyProcessed.length
        },
        successful: results.successful,
        failed: results.failed,
        alreadyProcessed: results.alreadyProcessed
      },
      metadata: {
        processedAt: new Date().toISOString(),
        processedBy: {
          adminId: req.admin._id,
          adminEmail: req.admin.email
        }
      }
    });

  } catch (error) {
    console.error('Bulk approve users error:', error);

    // Log failed bulk action
    try {
      await AuditService.logAction({
        adminId: req.admin._id,
        action: 'bulk_action',
        resource: 'user',
        details: {
          bulkAction: 'bulk_approve',
          error: error.message,
          requestedUserIds: req.body.userIds || []
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        success: false,
        errorMessage: error.message
      });
    } catch (auditError) {
      console.error('Failed to log bulk approval error audit:', auditError);
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error during bulk approval',
      code: 'BULK_APPROVAL_ERROR'
    });
  }
}));

// Bulk reject users with bulk operation rate limiting
app.post('/api/admin/users/bulk-reject', applyRateLimit('bulk'), authenticateToken, requireAdmin, validateBulkUserRejection, validateAdminEndpoint, asyncHandler(async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }))
      });
    }

    const { userIds, rejectionReason = 'Bulk rejection by admin' } = req.body;

    // Validate that we don't have too many users (prevent system overload)
    if (userIds.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Cannot reject more than 100 users at once',
        code: 'BULK_LIMIT_EXCEEDED'
      });
    }

    // Remove duplicates
    const uniqueUserIds = [...new Set(userIds)];

    // Find users that exist and are pending
    const users = await User.find({
      _id: { $in: uniqueUserIds },
      status: 'pending'
    });

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No pending users found with the provided IDs',
        code: 'NO_PENDING_USERS'
      });
    }

    // Track results
    const results = {
      successful: [],
      failed: [],
      alreadyProcessed: []
    };

    // Check for users that don't exist or aren't pending
    const foundUserIds = users.map(user => user._id.toString());
    const notFoundIds = uniqueUserIds.filter(id => !foundUserIds.includes(id));

    // Find users that exist but aren't pending
    if (notFoundIds.length > 0) {
      const existingUsers = await User.find({
        _id: { $in: notFoundIds }
      });

      existingUsers.forEach(user => {
        if (user.status !== 'pending') {
          results.alreadyProcessed.push({
            userId: user._id,
            email: user.email,
            currentStatus: user.status,
            reason: `User is already ${user.status}`
          });
        }
      });

      // Add truly not found users to failed
      const existingUserIds = existingUsers.map(u => u._id.toString());
      const trulyNotFound = notFoundIds.filter(id => !existingUserIds.includes(id));
      trulyNotFound.forEach(userId => {
        results.failed.push({
          userId,
          reason: 'User not found'
        });
      });
    }

    // Perform bulk rejection using MongoDB's updateMany for efficiency
    const bulkUpdateResult = await User.updateMany(
      {
        _id: { $in: users.map(u => u._id) },
        status: 'pending'
      },
      {
        $set: {
          status: 'rejected',
          isApproved: false,
          rejectedBy: req.admin._id,
          rejectedAt: new Date(),
          rejectedReason: rejectionReason
        }
      }
    );

    // Add successful rejections to results
    users.forEach(user => {
      results.successful.push({
        userId: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        rejectedAt: new Date(),
        rejectedReason: rejectionReason
      });
    });

    // Log bulk action for audit trail
    try {
      await AuditService.logBulkAction(
        req.admin._id,
        'bulk_reject',
        users.map(u => u._id.toString()),
        req.ip || req.connection.remoteAddress,
        req.get('User-Agent'),
        {
          totalRequested: uniqueUserIds.length,
          successfullyRejected: results.successful.length,
          alreadyProcessed: results.alreadyProcessed.length,
          failed: results.failed.length,
          rejectionReason: rejectionReason
        }
      );
    } catch (auditError) {
      console.error('Failed to log bulk rejection audit:', auditError);
      // Don't fail the operation due to audit logging issues
    }

    // Return comprehensive results
    res.json({
      success: true,
      message: `Bulk rejection completed. ${results.successful.length} users rejected successfully.`,
      results: {
        summary: {
          totalRequested: uniqueUserIds.length,
          successful: results.successful.length,
          failed: results.failed.length,
          alreadyProcessed: results.alreadyProcessed.length
        },
        successful: results.successful,
        failed: results.failed,
        alreadyProcessed: results.alreadyProcessed,
        rejectionReason: rejectionReason
      },
      metadata: {
        processedAt: new Date().toISOString(),
        processedBy: {
          adminId: req.admin._id,
          adminEmail: req.admin.email
        }
      }
    });

  } catch (error) {
    console.error('Bulk reject users error:', error);

    // Log failed bulk action
    try {
      await AuditService.logAction({
        adminId: req.admin._id,
        action: 'bulk_action',
        resource: 'user',
        details: {
          bulkAction: 'bulk_reject',
          error: error.message,
          requestedUserIds: req.body.userIds || [],
          rejectionReason: req.body.rejectionReason
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        success: false,
        errorMessage: error.message
      });
    } catch (auditError) {
      console.error('Failed to log bulk rejection error audit:', auditError);
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error during bulk rejection',
      code: 'BULK_REJECTION_ERROR'
    });
  }
}));

// Enhanced Dashboard Statistics for admin panel metrics
app.get('/api/admin/dashboard/stats', authenticateToken, requireAdmin, validateAdminEndpoint, auditDashboardAccess, async (req, res) => {
  try {
    // Basic user counts
    const totalUsers = await User.countDocuments();
    const pendingUsers = await User.countDocuments({ status: 'pending' });
    const approvedUsers = await User.countDocuments({ status: 'approved' });
    const rejectedUsers = await User.countDocuments({ status: 'rejected' });
    const activeUsers = await User.countDocuments({ isActive: true });

    // Recent registrations (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentRegistrations = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const monthlyRegistrations = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Training mode breakdown
    const trainingModeStats = await User.aggregate([
      {
        $group: {
          _id: '$trainingMode',
          count: { $sum: 1 }
        }
      }
    ]);

    // Gender breakdown
    const genderStats = await User.aggregate([
      {
        $group: {
          _id: '$gender',
          count: { $sum: 1 }
        }
      }
    ]);

    // Recent approvals and rejections (last 7 days)
    const recentApprovals = await User.countDocuments({
      status: 'approved',
      approvedAt: { $gte: sevenDaysAgo }
    });

    const recentRejections = await User.countDocuments({
      status: 'rejected',
      rejectedAt: { $gte: sevenDaysAgo }
    });

    // Users with completed onboarding
    const onboardingCompleted = await User.countDocuments({ onboardingCompleted: true });

    // Users with profile photos
    const usersWithPhotos = await User.countDocuments({
      profilePhoto: { $ne: null, $ne: '' }
    });

    // Format data in mobile-friendly format for dashboard widgets
    const dashboardStats = {
      // Main metrics for primary dashboard cards
      overview: {
        totalUsers: {
          value: totalUsers,
          label: 'Total Users',
          icon: 'users',
          color: 'blue'
        },
        pendingApprovals: {
          value: pendingUsers,
          label: 'Pending Approvals',
          icon: 'clock',
          color: 'orange',
          urgent: pendingUsers > 0
        },
        approvedUsers: {
          value: approvedUsers,
          label: 'Approved Users',
          icon: 'check-circle',
          color: 'green'
        },
        rejectedUsers: {
          value: rejectedUsers,
          label: 'Rejected Users',
          icon: 'x-circle',
          color: 'red'
        }
      },

      // Activity metrics for secondary cards
      activity: {
        recentRegistrations: {
          value: recentRegistrations,
          label: 'New This Week',
          icon: 'user-plus',
          color: 'purple',
          period: '7 days'
        },
        monthlyRegistrations: {
          value: monthlyRegistrations,
          label: 'New This Month',
          icon: 'trending-up',
          color: 'indigo',
          period: '30 days'
        },
        recentApprovals: {
          value: recentApprovals,
          label: 'Approved This Week',
          icon: 'thumbs-up',
          color: 'green',
          period: '7 days'
        },
        recentRejections: {
          value: recentRejections,
          label: 'Rejected This Week',
          icon: 'thumbs-down',
          color: 'red',
          period: '7 days'
        }
      },

      // User status breakdown for charts/graphs
      statusBreakdown: {
        pending: {
          count: pendingUsers,
          percentage: totalUsers > 0 ? Math.round((pendingUsers / totalUsers) * 100) : 0,
          color: '#f59e0b'
        },
        approved: {
          count: approvedUsers,
          percentage: totalUsers > 0 ? Math.round((approvedUsers / totalUsers) * 100) : 0,
          color: '#10b981'
        },
        rejected: {
          count: rejectedUsers,
          percentage: totalUsers > 0 ? Math.round((rejectedUsers / totalUsers) * 100) : 0,
          color: '#ef4444'
        }
      },

      // Additional insights for detailed view
      insights: {
        activeUsers: {
          value: activeUsers,
          label: 'Active Users',
          percentage: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0
        },
        onboardingCompleted: {
          value: onboardingCompleted,
          label: 'Completed Onboarding',
          percentage: totalUsers > 0 ? Math.round((onboardingCompleted / totalUsers) * 100) : 0
        },
        usersWithPhotos: {
          value: usersWithPhotos,
          label: 'Users with Photos',
          percentage: totalUsers > 0 ? Math.round((usersWithPhotos / totalUsers) * 100) : 0
        }
      },

      // Training mode distribution for analytics
      trainingModes: trainingModeStats.map(stat => ({
        mode: stat._id,
        count: stat.count,
        percentage: totalUsers > 0 ? Math.round((stat.count / totalUsers) * 100) : 0
      })),

      // Gender distribution for demographics
      demographics: {
        gender: genderStats.map(stat => ({
          gender: stat._id,
          count: stat.count,
          percentage: totalUsers > 0 ? Math.round((stat.count / totalUsers) * 100) : 0
        }))
      },

      // Metadata for mobile app
      metadata: {
        lastUpdated: new Date().toISOString(),
        dataFreshness: 'real-time',
        totalRecords: totalUsers,
        calculationTime: Date.now() - req.startTime
      }
    };

    res.json({
      success: true,
      stats: dashboardStats
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'DASHBOARD_STATS_ERROR'
    });
  }
});

// Enhanced error handling middleware for mobile-optimized responses
app.use((err, req, res, next) => {
  console.error('Error occurred:', {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    error: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });

  // Determine appropriate status code
  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let errorMessage = 'Internal server error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    errorMessage = 'Validation failed';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    errorCode = 'INVALID_ID_FORMAT';
    errorMessage = 'Invalid ID format';
  } else if (err.code === 11000) {
    statusCode = 409;
    errorCode = 'DUPLICATE_ENTRY';
    errorMessage = 'Duplicate entry found';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
    errorMessage = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    errorMessage = 'Authentication token has expired';
  }

  // Mobile-optimized error response
  const errorResponse = {
    success: false,
    error: errorMessage,
    code: errorCode,
    timestamp: new Date().toISOString(),
    requestId: req.requestId || 'unknown'
  };

  // Add validation details for validation errors
  if (err.name === 'ValidationError' && err.errors) {
    errorResponse.details = Object.keys(err.errors).map(key => ({
      field: key,
      message: err.errors[key].message
    }));
  }

  // Don't expose sensitive error details in production
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.debug = {
      originalError: err.message,
      stack: err.stack
    };
  }

  res.status(statusCode).json(errorResponse);
});

// Audit Log Management Routes

// Get audit logs with filtering and pagination
app.get('/api/admin/audit-logs', authenticateToken, requireAdmin, validateAdminEndpoint, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      adminId,
      action,
      resource,
      dateFrom,
      dateTo,
      success,
      ipAddress,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = req.query;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    // Build query object
    const query = {};

    // Apply filters
    if (adminId && mongoose.Types.ObjectId.isValid(adminId)) {
      query.adminId = adminId;
    }

    if (action) {
      query.action = action;
    }

    if (resource) {
      query.resource = resource;
    }

    if (success !== undefined && success !== null) {
      query.success = success === 'true';
    }

    if (ipAddress) {
      query.ipAddress = { $regex: ipAddress, $options: 'i' };
    }

    // Date range filtering
    if (dateFrom || dateTo) {
      query.timestamp = {};
      if (dateFrom) {
        query.timestamp.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        query.timestamp.$lte = endDate;
      }
    }

    // Sorting
    const allowedSortFields = ['timestamp', 'action', 'resource', 'success'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'timestamp';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const sortOptions = {};
    sortOptions[sortField] = sortDirection;

    // Execute query
    const auditLogs = await AuditLog.find(query)
      .populate('adminId', 'username email role')
      .sort(sortOptions)
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .select('-__v');

    // Get total count for pagination
    const total = await AuditLog.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum);

    // Get available filter options
    const [availableActions, availableResources, availableAdmins] = await Promise.all([
      AuditLog.distinct('action'),
      AuditLog.distinct('resource'),
      AuditLog.find({ adminId: { $ne: null } })
        .populate('adminId', 'username email')
        .distinct('adminId')
    ]);

    res.json({
      success: true,
      auditLogs,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalLogs: total,
        logsPerPage: limitNum,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
        nextPage: pageNum < totalPages ? pageNum + 1 : null,
        prevPage: pageNum > 1 ? pageNum - 1 : null
      },
      filters: {
        applied: {
          adminId: adminId || null,
          action: action || null,
          resource: resource || null,
          success: success || null,
          ipAddress: ipAddress || null,
          dateFrom: dateFrom || null,
          dateTo: dateTo || null
        },
        available: {
          actions: availableActions,
          resources: availableResources,
          admins: availableAdmins.map(admin => ({
            id: admin._id,
            username: admin.username,
            email: admin.email
          })),
          successOptions: [
            { value: true, label: 'Successful' },
            { value: false, label: 'Failed' }
          ]
        }
      },
      sorting: {
        sortBy: sortField,
        sortOrder: sortOrder,
        availableFields: allowedSortFields
      },
      metadata: {
        queryExecutionTime: Date.now() - req.startTime,
        filtersApplied: Object.keys(req.query).length,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'AUDIT_LOGS_ERROR',
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

// Get audit logs for a specific user
app.get('/api/admin/audit-logs/user/:userId', authenticateToken, requireAdmin, validateAdminEndpoint, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format',
        code: 'INVALID_USER_ID'
      });
    }

    // Check if user exists
    const user = await User.findById(userId).select('firstName lastName email');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const result = await AuditService.getUserAuditTrail(userId, page, limit);

    res.json({
      success: true,
      user: {
        id: userId,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email
      },
      auditLogs: result.auditLogs,
      pagination: result.pagination,
      metadata: {
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Get user audit trail error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'USER_AUDIT_TRAIL_ERROR'
    });
  }
});

// Get audit logs for a specific admin
app.get('/api/admin/audit-logs/admin/:adminId', authenticateToken, requireAdmin, validateAdminEndpoint, async (req, res) => {
  try {
    const { adminId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Validate adminId format
    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid admin ID format',
        code: 'INVALID_ADMIN_ID'
      });
    }

    // Check if admin exists
    const admin = await Admin.findById(adminId).select('username email role');
    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Admin not found',
        code: 'ADMIN_NOT_FOUND'
      });
    }

    const result = await AuditService.getAdminAuditHistory(adminId, page, limit);

    res.json({
      success: true,
      admin: {
        id: adminId,
        username: admin.username,
        email: admin.email,
        role: admin.role
      },
      auditLogs: result.auditLogs,
      pagination: result.pagination,
      metadata: {
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Get admin audit history error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'ADMIN_AUDIT_HISTORY_ERROR'
    });
  }
});

// Get audit statistics
app.get('/api/admin/audit-logs/stats', authenticateToken, requireAdmin, validateAdminEndpoint, async (req, res) => {
  try {
    const { dateFrom, dateTo, period = '7d' } = req.query;

    let fromDate = null;
    let toDate = null;

    // Handle predefined periods
    if (period && !dateFrom && !dateTo) {
      const now = new Date();
      switch (period) {
        case '1d':
          fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
      toDate = now;
    } else {
      fromDate = dateFrom ? new Date(dateFrom) : null;
      toDate = dateTo ? new Date(dateTo) : null;
    }

    const stats = await AuditService.getAuditStats(fromDate, toDate);

    // Get recent activity (last 10 actions)
    const recentActivity = await AuditLog.find({
      ...(fromDate && toDate ? {
        timestamp: {
          $gte: fromDate,
          $lte: toDate
        }
      } : {})
    })
      .populate('adminId', 'username email')
      .sort({ timestamp: -1 })
      .limit(10)
      .select('-__v');

    res.json({
      success: true,
      stats,
      recentActivity,
      period: {
        from: fromDate,
        to: toDate,
        predefinedPeriod: period
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        dataFreshness: 'real-time'
      }
    });
  } catch (error) {
    console.error('Get audit stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'AUDIT_STATS_ERROR'
    });
  }
});

// Get available audit log filter options
app.get('/api/admin/audit-logs/filters', authenticateToken, requireAdmin, validateAdminEndpoint, async (req, res) => {
  try {
    const [actions, resources, admins] = await Promise.all([
      AuditLog.distinct('action'),
      AuditLog.distinct('resource'),
      AuditLog.find({ adminId: { $ne: null } })
        .populate('adminId', 'username email role')
        .distinct('adminId')
    ]);

    // Get date range for filtering
    const oldestLog = await AuditLog.findOne().sort({ timestamp: 1 }).select('timestamp');
    const newestLog = await AuditLog.findOne().sort({ timestamp: -1 }).select('timestamp');

    res.json({
      success: true,
      filters: {
        actions: {
          options: actions,
          categories: {
            authentication: ['admin_login_attempt', 'admin_login_success', 'admin_login_failed', 'admin_logout'],
            userManagement: ['user_approved', 'user_rejected', 'user_created', 'user_updated', 'user_deleted'],
            adminManagement: ['admin_created', 'admin_updated', 'admin_deleted'],
            system: ['settings_updated', 'bulk_action', 'data_export'],
            access: ['dashboard_accessed', 'profile_viewed']
          }
        },
        resources: {
          options: resources,
          descriptions: {
            user: 'User-related actions',
            admin: 'Admin-related actions',
            system: 'System-level actions',
            dashboard: 'Dashboard access',
            profile: 'Profile views'
          }
        },
        admins: admins.map(admin => ({
          id: admin._id,
          username: admin.username,
          email: admin.email,
          role: admin.role
        })),
        success: [
          { value: true, label: 'Successful Actions' },
          { value: false, label: 'Failed Actions' }
        ],
        dateRange: {
          min: oldestLog?.timestamp || new Date(),
          max: newestLog?.timestamp || new Date(),
          format: 'YYYY-MM-DD'
        },
        predefinedPeriods: [
          { key: '1d', label: 'Last 24 Hours' },
          { key: '7d', label: 'Last 7 Days' },
          { key: '30d', label: 'Last 30 Days' },
          { key: '90d', label: 'Last 90 Days' }
        ]
      },
      sorting: {
        fields: [
          { key: 'timestamp', label: 'Date & Time' },
          { key: 'action', label: 'Action Type' },
          { key: 'resource', label: 'Resource' },
          { key: 'success', label: 'Success Status' }
        ],
        orders: [
          { key: 'desc', label: 'Newest First' },
          { key: 'asc', label: 'Oldest First' }
        ],
        default: {
          sortBy: 'timestamp',
          sortOrder: 'desc'
        }
      },
      pagination: {
        defaultLimit: 50,
        maxLimit: 100,
        minLimit: 1
      },
      metadata: {
        totalLogs: await AuditLog.countDocuments(),
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Get audit filter options error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'AUDIT_FILTER_OPTIONS_ERROR'
    });
  }
});

// Import and use new route modules
const exerciseRoutes = require('./routes/exercises');
const foodRoutes = require('./routes/foods');
const dietPlanRoutes = require('./routes/dietPlans');
const dietHistoryRoutes = require('./routes/dietHistory');
const workoutScheduleRoutes = require('./routes/workoutSchedules');
const chatRoutes = require('./routes/chats');
const bodyMeasurementRoutes = require('./routes/bodyMeasurements');
const onboardingRoutes = require('./routes/onboarding');
const dashboardRoutes = require('./routes/dashboard');
const photoRoutes = require('./routes/photos');
const userProfileRoutes = require('./routes/userProfiles');

// Apply authentication middleware to all new routes
app.use('/api/admin/exercises', authenticateToken, requireAdmin, exerciseRoutes);
app.use('/api/admin/foods', authenticateToken, requireAdmin, foodRoutes);
app.use('/api/admin/diet-plans', authenticateToken, requireAdmin, dietPlanRoutes);
// Temporary route for testing diet plan creation without admin auth
app.use('/api/diet-plans', dietPlanRoutes);
app.use('/api/diet-history', dietHistoryRoutes);
app.use('/api/admin/workout-schedules', authenticateToken, requireAdmin, workoutScheduleRoutes);
app.use('/api/admin/chats', authenticateToken, requireAdmin, chatRoutes);
app.use('/api/admin/body-measurements', authenticateToken, requireAdmin, bodyMeasurementRoutes);
app.use('/api/admin/onboarding', authenticateToken, requireAdmin, onboardingRoutes);
app.use('/api/admin/dashboard', authenticateToken, requireAdmin, dashboardRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/user-profiles', userProfileRoutes);

// Enhanced 404 handler with mobile-optimized response (must be last)
app.use('*', (req, res, next) => {
  const error = new NotFoundError(
    `Route ${req.method} ${req.originalUrl} not found`,
    ErrorCodes.RESOURCE_NOT_FOUND
  );
  next(error);
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Setup global error handlers for unhandled rejections and exceptions
setupGlobalErrorHandlers();

// Setup database connection error handlers
handleDatabaseConnectionError();

// Start server
app.listen(config.PORT, '0.0.0.0', () => {
  console.log(`🚀 FlexCoach Admin Backend running on port ${config.PORT}`);
  console.log(`🌍 Environment: ${config.NODE_ENV}`);
  console.log(`📱 API Base URL: http://0.0.0.0:${config.PORT}`);
  console.log(`🔐 JWT Secret: ${JWT_SECRET.substring(0, 10)}...`);
  console.log(`🗄️  Database: ${config.MONGODB_URI}`);
  console.log(`\n📋 Admin Backend Routes:`);
  console.log(`   POST /api/admin/login - Admin login for mobile app`);
  console.log(`   GET  /api/admin/profile - Get admin profile details`);
  console.log(`   POST /api/admin/logout - Admin logout`);
  console.log(`   POST /api/admin/refresh-token - Refresh JWT token`);
  console.log(`   GET  /api/admin/users - Get all users (with enhanced filtering)`);
  console.log(`   GET  /api/admin/users/pending - Get pending users`);
  console.log(`   GET  /api/admin/users/filters - Get available filter options`);
  console.log(`   GET  /api/admin/users/:userId - Get user by ID`);
  console.log(`   POST /api/admin/users/:userId/approve - Approve user`);
  console.log(`   POST /api/admin/users/:userId/reject - Reject user`);
  console.log(`   PATCH /api/admin/users/:userId/status - Update user status (activate/deactivate)`);
  console.log(`   POST /api/admin/users/bulk-approve - Bulk approve users`);
  console.log(`   POST /api/admin/users/bulk-reject - Bulk reject users`);
  console.log(`   GET  /api/admin/dashboard/stats - Dashboard statistics`);
  console.log(`   GET  /api/admin/audit-logs - Get audit logs with filtering`);
  console.log(`   GET  /api/admin/audit-logs/user/:userId - Get user audit trail`);
  console.log(`   GET  /api/admin/audit-logs/admin/:adminId - Get admin audit history`);
  console.log(`   GET  /api/admin/audit-logs/stats - Get audit statistics`);
  console.log(`   GET  /api/admin/audit-logs/filters - Get audit filter options`);
  console.log(`\n🏋️  Exercise Management:`);
  console.log(`   GET  /api/admin/exercises - Get all exercises`);
  console.log(`   POST /api/admin/exercises - Create exercise`);
  console.log(`   GET  /api/admin/exercises/:id - Get exercise by ID`);
  console.log(`   PUT  /api/admin/exercises/:id - Update exercise`);
  console.log(`   DELETE /api/admin/exercises/:id - Delete exercise`);
  console.log(`\n🍎 Food Management:`);
  console.log(`   GET  /api/admin/foods - Get all foods`);
  console.log(`   POST /api/admin/foods - Create food`);
  console.log(`   GET  /api/admin/foods/:id - Get food by ID`);
  console.log(`   PUT  /api/admin/foods/:id - Update food`);
  console.log(`   DELETE /api/admin/foods/:id - Delete food`);
  console.log(`\n🥗 Diet Plan Management:`);
  console.log(`   GET  /api/admin/diet-plans - Get all diet plans`);
  console.log(`   GET  /api/admin/diet-plans/user/:userId - Get user diet plans`);
  console.log(`   POST /api/admin/diet-plans - Create diet plan`);
  console.log(`   GET  /api/admin/diet-plans/:id - Get diet plan by ID`);
  console.log(`   PUT  /api/admin/diet-plans/:id - Update diet plan`);
  console.log(`   DELETE /api/admin/diet-plans/:id - Delete diet plan`);
  console.log(`\n📅 Workout Schedule Management:`);
  console.log(`   GET  /api/admin/workout-schedules - Get all workout schedules`);
  console.log(`   GET  /api/admin/workout-schedules/user/:userId - Get user schedules`);
  console.log(`   POST /api/admin/workout-schedules - Create workout schedule`);
  console.log(`   GET  /api/admin/workout-schedules/:id - Get schedule by ID`);
  console.log(`   PUT  /api/admin/workout-schedules/:id - Update schedule`);
  console.log(`   PATCH /api/admin/workout-schedules/:id/complete - Mark as completed`);
  console.log(`   DELETE /api/admin/workout-schedules/:id - Delete schedule`);
  console.log(`\n💬 Chat Management:`);
  console.log(`   GET  /api/admin/chats - Get all chats`);
  console.log(`   GET  /api/admin/chats/user/:userId - Get user chat`);
  console.log(`   POST /api/admin/chats/user/:userId/message - Send message`);
  console.log(`   PATCH /api/admin/chats/user/:userId/read - Mark messages as read`);
  console.log(`   DELETE /api/admin/chats/message/:messageId - Delete message`);
  console.log(`   GET  /api/admin/chats/stats - Get chat statistics`);
  console.log(`\n📏 Body Measurement Management:`);
  console.log(`   GET  /api/admin/body-measurements - Get all measurements`);
  console.log(`   GET  /api/admin/body-measurements/user/:userId - Get user measurements`);
  console.log(`   GET  /api/admin/body-measurements/user/:userId/latest - Get latest measurements`);
  console.log(`   POST /api/admin/body-measurements - Create measurement`);
  console.log(`   PUT  /api/admin/body-measurements/:id - Update measurement`);
  console.log(`   DELETE /api/admin/body-measurements/:id - Delete measurement`);
  console.log(`   GET  /api/admin/body-measurements/user/:userId/stats - Get measurement stats`);
});

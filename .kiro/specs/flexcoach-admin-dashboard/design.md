# Design Document

## Overview

The FlexCoach Admin Backend Enhancement focuses on extending and improving the existing backend API (running on port 3001) to provide comprehensive administrative functionality for the FlexCoach Admin mobile application (iOS/Android). The design maintains the current backend architecture while adding new features for enhanced user management, system monitoring, audit logging, and administrative controls to support a mobile admin interface.

## Architecture

### Backend Architecture Enhancement
- **Framework**: Express.js with existing middleware stack
- **Database**: MongoDB with Mongoose ODM (shared database: `mongodb://localhost:27017/flexcoach_dev`)
- **Port**: 3001 (different from client backend on port 3000)
- **Authentication**: JWT token-based authentication with role-based access control
- **API Design**: RESTful API optimized for mobile admin app consumption
- **Security**: Enhanced security middleware and validation
- **Logging**: Comprehensive audit logging and system monitoring
- **Database Sharing**: Uses the same MongoDB database as the client backend to access existing User and Admin collections
- **Mobile Optimization**: API responses optimized for mobile data usage and offline capabilities

### Enhanced Backend Structure
```
backend/
├── models/                 # Database models (existing + new)
│   ├── User.js            # Existing user model
│   ├── Admin.js           # Existing admin model
│   ├── AuditLog.js        # New audit logging model
│   └── SystemSettings.js  # New system configuration model
├── middleware/            # Enhanced middleware
│   ├── auth.js           # Enhanced authentication
│   ├── validation.js     # Input validation
│   ├── audit.js          # Audit logging middleware
│   └── rateLimit.js      # Enhanced rate limiting
├── routes/               # API route handlers
│   ├── admin.js          # Enhanced admin routes
│   ├── users.js          # Enhanced user management
│   ├── dashboard.js      # Dashboard and analytics
│   └── system.js         # System management routes
├── services/             # Business logic services
│   ├── userService.js    # User management logic
│   ├── auditService.js   # Audit logging service
│   └── analyticsService.js # Analytics and reporting
├── utils/                # Utility functions
│   ├── validators.js     # Data validation utilities
│   ├── emailService.js   # Email notification service
│   └── exportService.js  # Data export utilities
└── server.js             # Enhanced main server file
```

## Enhanced API Endpoints

### New Admin Management Endpoints
- **POST /api/admin/create** - Create new admin accounts (super admin only)
- **GET /api/admin/list** - List all admin accounts with filtering
- **PUT /api/admin/:adminId/status** - Activate/deactivate admin accounts
- **PUT /api/admin/:adminId/role** - Update admin role (super admin only)
- **DELETE /api/admin/:adminId** - Delete admin account (super admin only)

### Enhanced User Management Endpoints
- **GET /api/admin/users/export** - Export user data to CSV/Excel
- **POST /api/admin/users/bulk-action** - Bulk approve/reject users
- **GET /api/admin/users/:userId/activity** - Get user activity history
- **PUT /api/admin/users/:userId/status** - Update user active status
- **POST /api/admin/users/:userId/notes** - Add admin notes to user profile

### System Analytics Endpoints
- **GET /api/admin/analytics/registrations** - Registration trends over time
- **GET /api/admin/analytics/user-demographics** - User demographic breakdown
- **GET /api/admin/analytics/activity-summary** - Platform activity summary
- **GET /api/admin/analytics/approval-metrics** - Approval process metrics

### Audit and Logging Endpoints
- **GET /api/admin/audit-logs** - Get system audit logs with filtering
- **GET /api/admin/audit-logs/user/:userId** - Get user-specific audit trail
- **GET /api/admin/audit-logs/admin/:adminId** - Get admin action history

### System Management Endpoints
- **GET /api/admin/system/health** - Enhanced system health check
- **GET /api/admin/system/settings** - Get system configuration
- **PUT /api/admin/system/settings** - Update system settings
- **POST /api/admin/system/backup** - Trigger database backup
- **GET /api/admin/system/logs** - Get application logs

### Middleware Components

#### Enhanced Authentication Middleware
```javascript
// Enhanced auth middleware with role checking
const authenticateAdmin = (requiredRole = 'admin') => {
  return async (req, res, next) => {
    // Token validation
    // Role verification
    // Admin status check
    // Audit logging
  }
}
```

#### Audit Logging Middleware
```javascript
// Automatic audit logging for admin actions
const auditLogger = (action, resource) => {
  return (req, res, next) => {
    // Log admin action
    // Capture request details
    // Record timestamp and IP
  }
}
```

#### Enhanced Validation Middleware
```javascript
// Comprehensive input validation
const validateRequest = (schema) => {
  return (req, res, next) => {
    // Validate request body
    // Sanitize inputs
    // Check required fields
  }
}
```

## Enhanced Data Models

### New Database Models

#### AuditLog Model
```javascript
const auditLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['user_approved', 'user_rejected', 'user_created', 'user_updated', 
           'admin_login', 'admin_logout', 'admin_created', 'admin_updated',
           'settings_updated', 'bulk_action', 'export_data']
  },
  resource: {
    type: String,
    required: true // 'user', 'admin', 'system'
  },
  resourceId: {
    type: String // ID of affected resource
  },
  details: {
    type: mongoose.Schema.Types.Mixed // Additional action details
  },
  ipAddress: String,
  userAgent: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
})
```

#### SystemSettings Model
```javascript
const systemSettingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  description: String,
  category: {
    type: String,
    enum: ['general', 'security', 'notifications', 'approval']
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
})
```

### Enhanced Existing Models

#### Database Configuration
```javascript
// Admin backend will use the same database as client
const MONGODB_URI = 'mongodb://localhost:27017/flexcoach_dev'; // Same as client backend

// This ensures both backends share:
// - User collection (for user management)
// - Admin collection (for admin authentication)
// - All other existing collections (Measurement, Workout, Diet, Photo)
```

#### Enhanced Admin Model
```javascript
// Additional fields to be added to existing Admin model
const adminEnhancements = {
  permissions: [{
    type: String,
    enum: ['user_management', 'admin_management', 'system_settings', 
           'audit_logs', 'analytics', 'bulk_actions', 'data_export']
  }],
  lastPasswordChange: {
    type: Date,
    default: Date.now
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockedUntil: Date,
  preferences: {
    timezone: {
      type: String,
      default: 'UTC'
    },
    dateFormat: {
      type: String,
      default: 'YYYY-MM-DD'
    },
    pageSize: {
      type: Number,
      default: 20
    }
  }
}
```

#### Enhanced User Model
```javascript
// Additional fields to be added to existing User model
const userEnhancements = {
  adminNotes: [{
    note: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastActivity: Date,
  loginCount: {
    type: Number,
    default: 0
  },
  deviceInfo: {
    lastDevice: String,
    lastIP: String,
    lastUserAgent: String
  }
}
```

### Service Layer Architecture

#### UserService
```javascript
class UserService {
  static async getUsersWithFilters(filters, pagination, sorting) {
    // Enhanced user filtering and pagination
  }
  
  static async bulkUpdateUsers(userIds, action, adminId) {
    // Bulk approve/reject users with audit logging
  }
  
  static async exportUsers(filters, format) {
    // Export user data to CSV/Excel
  }
  
  static async getUserActivityHistory(userId) {
    // Get comprehensive user activity
  }
}
```

#### AuditService
```javascript
class AuditService {
  static async logAction(adminId, action, resource, details) {
    // Create audit log entry
  }
  
  static async getAuditLogs(filters, pagination) {
    // Retrieve filtered audit logs
  }
  
  static async getUserAuditTrail(userId) {
    // Get all actions related to specific user
  }
}
```

#### AnalyticsService
```javascript
class AnalyticsService {
  static async getRegistrationTrends(period) {
    // Calculate registration trends over time
  }
  
  static async getUserDemographics() {
    // Analyze user demographic data
  }
  
  static async getApprovalMetrics() {
    // Calculate approval process efficiency
  }
}
```

## Error Handling

### Enhanced Backend Error Management
- **Centralized Error Handler**: Comprehensive error handling middleware with logging
- **Validation Errors**: Detailed field-level validation with clear error messages
- **Authentication Errors**: Specific error codes for different auth failure scenarios
- **Rate Limiting**: Proper error responses for rate limit violations
- **Database Errors**: Graceful handling of MongoDB connection and query errors

### Error Response Structure
```javascript
// Standardized error response format
const errorResponse = {
  success: false,
  error: 'Human readable error message',
  code: 'ERROR_CODE', // Machine readable error code
  details: [], // Additional error details (validation errors, etc.)
  timestamp: new Date().toISOString(),
  requestId: 'unique-request-id' // For tracking and debugging
}
```

### Error Categories
```javascript
const ErrorCodes = {
  // Authentication errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  
  // Validation errors
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Resource errors
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  ADMIN_NOT_FOUND: 'ADMIN_NOT_FOUND',
  DUPLICATE_EMAIL: 'DUPLICATE_EMAIL',
  
  // System errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
}
```

## Testing Strategy

### Backend API Testing
- **Unit Testing**: Jest for testing individual functions, services, and utilities
- **Integration Testing**: Supertest for testing API endpoints and middleware
- **Database Testing**: MongoDB Memory Server for isolated database testing
- **Authentication Testing**: Comprehensive JWT and role-based access testing

### Testing Structure
- **Route Testing**: Test all API endpoints with various scenarios (success, error, edge cases)
- **Service Testing**: Test business logic in service layer with mocked dependencies
- **Model Testing**: Test database models, validations, and relationships
- **Middleware Testing**: Test authentication, validation, and audit logging middleware

### Testing Tools
- **Jest**: Test runner and assertion library
- **Supertest**: HTTP assertion library for API testing
- **MongoDB Memory Server**: In-memory MongoDB for testing
- **Sinon**: Stubbing and mocking library for external dependencies

### Test Coverage Goals
- **API Routes**: 95% coverage for all endpoint handlers
- **Services**: 90% coverage for business logic functions
- **Models**: 85% coverage for database operations
- **Middleware**: 100% coverage for security-critical middleware

### Test Categories
```javascript
// Example test structure
describe('Admin User Management API', () => {
  describe('GET /api/admin/users', () => {
    it('should return paginated users for authenticated admin')
    it('should filter users by status')
    it('should search users by name/email')
    it('should return 401 for unauthenticated requests')
    it('should return 403 for inactive admin')
  })
  
  describe('POST /api/admin/users/:id/approve', () => {
    it('should approve pending user successfully')
    it('should create audit log entry')
    it('should return error for already approved user')
    it('should return 404 for non-existent user')
  })
})
```

## Security Considerations

### Enhanced Authentication Security
- **JWT Token Security**: Secure token generation with proper expiration and refresh mechanisms
- **Role-Based Access Control**: Granular permissions for different admin roles
- **Account Lockout**: Automatic account locking after failed login attempts
- **Password Security**: Strong password requirements and periodic password changes
- **Session Management**: Secure session handling with proper cleanup

### API Security
- **Input Validation**: Comprehensive server-side validation for all inputs
- **SQL Injection Prevention**: Mongoose ODM provides built-in protection
- **Rate Limiting**: Enhanced rate limiting per endpoint and per admin
- **CORS Configuration**: Proper CORS setup for production environments
- **Security Headers**: Implementation of security headers (helmet.js)

### Data Protection
- **Sensitive Data Handling**: Proper handling of user personal information
- **Audit Trail Security**: Immutable audit logs with integrity verification
- **Database Security**: MongoDB security best practices and encryption
- **Backup Security**: Secure backup procedures with encryption

### Security Middleware Stack
```javascript
// Enhanced security middleware
app.use(helmet()) // Security headers
app.use(rateLimit()) // Rate limiting
app.use(mongoSanitize()) // NoSQL injection prevention
app.use(xss()) // XSS protection
app.use(hpp()) // HTTP parameter pollution prevention
```

## Performance Optimization

### Backend Performance
- **Database Indexing**: Optimized indexes for frequent queries
- **Query Optimization**: Efficient MongoDB queries with proper aggregation
- **Caching Strategy**: Redis caching for frequently accessed data
- **Connection Pooling**: Optimized MongoDB connection management
- **Async Processing**: Background processing for heavy operations

### API Performance
- **Pagination**: Efficient server-side pagination with cursor-based navigation
- **Field Selection**: Allow clients to specify required fields to reduce payload
- **Compression**: Gzip compression for API responses
- **Response Caching**: HTTP caching headers for appropriate endpoints
- **Bulk Operations**: Efficient bulk operations for mass user management

### Monitoring and Metrics
```javascript
// Performance monitoring
const performanceMetrics = {
  responseTime: 'Average API response time',
  throughput: 'Requests per second',
  errorRate: 'Error rate percentage',
  databaseConnections: 'Active database connections',
  memoryUsage: 'Server memory utilization'
}
```

## Scalability Considerations

### Horizontal Scaling
- **Stateless Design**: Stateless API design for easy horizontal scaling
- **Load Balancing**: Support for multiple server instances
- **Database Sharding**: Preparation for database sharding if needed
- **Microservices Ready**: Modular design for potential microservices migration

### Vertical Scaling
- **Resource Optimization**: Efficient memory and CPU usage
- **Connection Management**: Optimized database connection pooling
- **Garbage Collection**: Proper memory management and cleanup
- **Process Management**: PM2 or similar for production process management
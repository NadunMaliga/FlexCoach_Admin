const AuditService = require('../services/auditService');

/**
 * Middleware to automatically log admin actions
 * @param {string} action - The action being performed
 * @param {string} resource - The resource being affected
 * @param {Object} options - Additional options
 */
const auditLogger = (action, resource, options = {}) => {
  return async (req, res, next) => {
    // Store audit info in request for later use
    req.auditInfo = {
      action,
      resource,
      options,
      startTime: Date.now()
    };

    // Override res.json to capture response and log audit trail
    const originalJson = res.json;
    res.json = function(data) {
      // Log the action after response is sent
      setImmediate(async () => {
        try {
          const adminId = req.admin?._id || req.user?.userId;
          const ipAddress = getClientIP(req);
          const userAgent = req.get('User-Agent');

          // Determine if the action was successful based on response
          const success = res.statusCode >= 200 && res.statusCode < 400;
          let errorMessage = null;

          if (!success && data && data.error) {
            errorMessage = data.error;
          }

          // Extract resource ID from request params or response data
          let resourceId = null;
          if (req.params.userId) {
            resourceId = req.params.userId;
          } else if (req.params.adminId) {
            resourceId = req.params.adminId;
          } else if (data && data.user && data.user.id) {
            resourceId = data.user.id;
          } else if (data && data.admin && data.admin.id) {
            resourceId = data.admin.id;
          }

          // Build details object
          const details = {
            endpoint: `${req.method} ${req.originalUrl}`,
            responseTime: Date.now() - req.auditInfo.startTime,
            statusCode: res.statusCode,
            ...options.details
          };

          // Add request body details for certain actions (excluding sensitive data)
          if (req.body && Object.keys(req.body).length > 0) {
            const sanitizedBody = { ...req.body };
            // Remove sensitive fields
            delete sanitizedBody.password;
            delete sanitizedBody.token;
            details.requestData = sanitizedBody;
          }

          // Log the audit entry
          await AuditService.logAction({
            adminId,
            action,
            resource,
            resourceId,
            details,
            ipAddress,
            userAgent,
            success,
            errorMessage
          });
        } catch (error) {
          console.error('Audit logging failed:', error);
          // Don't throw error to prevent breaking the response
        }
      });

      // Call original json method
      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Middleware specifically for login attempts
 */
const auditLoginAttempt = async (req, res, next) => {
  // Override res.json to capture login result
  const originalJson = res.json;
  res.json = function(data) {
    // Log login attempt after response
    setImmediate(async () => {
      try {
        const { email } = req.body;
        const ipAddress = getClientIP(req);
        const userAgent = req.get('User-Agent');
        const success = res.statusCode === 200 && data.success;
        
        let adminId = null;
        let errorMessage = null;

        if (success && data.admin) {
          adminId = data.admin.id;
        } else if (data.error) {
          errorMessage = data.error;
        }

        await AuditService.logLoginAttempt(
          adminId,
          email,
          ipAddress,
          userAgent,
          success,
          errorMessage
        );
      } catch (error) {
        console.error('Login audit logging failed:', error);
      }
    });

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Middleware for logout actions
 */
const auditLogout = async (req, res, next) => {
  // Store admin info before processing logout
  const adminId = req.user?.userId;
  const ipAddress = getClientIP(req);
  const userAgent = req.get('User-Agent');

  // Override res.json to log after logout
  const originalJson = res.json;
  res.json = function(data) {
    setImmediate(async () => {
      try {
        if (adminId) {
          await AuditService.logLogout(adminId, ipAddress, userAgent);
        }
      } catch (error) {
        console.error('Logout audit logging failed:', error);
      }
    });

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Middleware for user approval actions
 */
const auditUserApproval = async (req, res, next) => {
  const originalJson = res.json;
  res.json = function(data) {
    setImmediate(async () => {
      try {
        if (res.statusCode === 200 && data.success && req.admin) {
          const userId = req.params.userId;
          const userEmail = data.user?.email;
          const adminId = req.admin._id;
          const ipAddress = getClientIP(req);
          const userAgent = req.get('User-Agent');

          await AuditService.logUserApproval(
            adminId,
            userId,
            userEmail,
            ipAddress,
            userAgent
          );
        }
      } catch (error) {
        console.error('User approval audit logging failed:', error);
      }
    });

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Middleware for user rejection actions
 */
const auditUserRejection = async (req, res, next) => {
  const originalJson = res.json;
  res.json = function(data) {
    setImmediate(async () => {
      try {
        if (res.statusCode === 200 && data.success && req.admin) {
          const userId = req.params.userId;
          const userEmail = data.user?.email;
          const reason = req.body?.reason || 'No reason provided';
          const adminId = req.admin._id;
          const ipAddress = getClientIP(req);
          const userAgent = req.get('User-Agent');

          await AuditService.logUserRejection(
            adminId,
            userId,
            userEmail,
            reason,
            ipAddress,
            userAgent
          );
        }
      } catch (error) {
        console.error('User rejection audit logging failed:', error);
      }
    });

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Helper function to get client IP address
 */
function getClientIP(req) {
  return req.ip ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         'unknown';
}

/**
 * Middleware to log dashboard access
 */
const auditDashboardAccess = async (req, res, next) => {
  try {
    if (req.admin) {
      const adminId = req.admin._id;
      const ipAddress = getClientIP(req);
      const userAgent = req.get('User-Agent');

      await AuditService.logDashboardAccess(adminId, ipAddress, userAgent);
    }
  } catch (error) {
    console.error('Dashboard access audit logging failed:', error);
  }

  next();
};

/**
 * Middleware to log profile views
 */
const auditProfileView = async (req, res, next) => {
  const originalJson = res.json;
  res.json = function(data) {
    setImmediate(async () => {
      try {
        if (res.statusCode === 200 && data.success && req.admin) {
          const viewedUserId = req.params.userId;
          const adminId = req.admin._id;
          const ipAddress = getClientIP(req);
          const userAgent = req.get('User-Agent');

          await AuditService.logProfileView(
            adminId,
            viewedUserId,
            ipAddress,
            userAgent
          );
        }
      } catch (error) {
        console.error('Profile view audit logging failed:', error);
      }
    });

    return originalJson.call(this, data);
  };

  next();
};

module.exports = {
  auditLogger,
  auditLoginAttempt,
  auditLogout,
  auditUserApproval,
  auditUserRejection,
  auditDashboardAccess,
  auditProfileView,
  getClientIP
};
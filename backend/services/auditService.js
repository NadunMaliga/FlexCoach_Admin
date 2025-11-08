const AuditLog = require('../models/AuditLog');

class AuditService {
  /**
   * Log an admin action to the audit trail
   * @param {Object} params - Audit log parameters
   * @param {string} params.adminId - ID of the admin performing the action
   * @param {string} params.action - Action being performed
   * @param {string} params.resource - Resource being affected
   * @param {string} params.resourceId - ID of the resource being affected
   * @param {Object} params.details - Additional details about the action
   * @param {string} params.ipAddress - IP address of the request
   * @param {string} params.userAgent - User agent of the request
   * @param {boolean} params.success - Whether the action was successful
   * @param {string} params.errorMessage - Error message if action failed
   */
  static async logAction({
    adminId,
    action,
    resource,
    resourceId = null,
    details = {},
    ipAddress,
    userAgent = null,
    success = true,
    errorMessage = null
  }) {
    try {
      // Handle the case where adminId is the string "admin" (simple admin)
      // Skip audit logging for simple admin to avoid ObjectId validation errors
      if (adminId === 'admin') {
        console.log(`Skipping audit log for simple admin: ${action} on ${resource}`);
        return null;
      }

      const auditLog = new AuditLog({
        adminId,
        action,
        resource,
        resourceId,
        details,
        ipAddress,
        userAgent,
        success,
        errorMessage,
        timestamp: new Date()
      });

      await auditLog.save();
      return auditLog;
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw error to prevent breaking the main operation
      return null;
    }
  }

  /**
   * Log admin login attempt
   */
  static async logLoginAttempt(adminId, email, ipAddress, userAgent, success, errorMessage = null) {
    return this.logAction({
      adminId: adminId || null,
      action: success ? 'admin_login_success' : 'admin_login_failed',
      resource: 'admin',
      resourceId: adminId,
      details: {
        email,
        loginTime: new Date().toISOString()
      },
      ipAddress,
      userAgent,
      success,
      errorMessage
    });
  }

  /**
   * Log admin logout
   */
  static async logLogout(adminId, ipAddress, userAgent) {
    return this.logAction({
      adminId,
      action: 'admin_logout',
      resource: 'admin',
      resourceId: adminId,
      details: {
        logoutTime: new Date().toISOString()
      },
      ipAddress,
      userAgent,
      success: true
    });
  }

  /**
   * Log user approval action
   */
  static async logUserApproval(adminId, userId, userEmail, ipAddress, userAgent) {
    return this.logAction({
      adminId,
      action: 'user_approved',
      resource: 'user',
      resourceId: userId,
      details: {
        userEmail,
        approvalTime: new Date().toISOString()
      },
      ipAddress,
      userAgent,
      success: true
    });
  }

  /**
   * Log user rejection action
   */
  static async logUserRejection(adminId, userId, userEmail, reason, ipAddress, userAgent) {
    return this.logAction({
      adminId,
      action: 'user_rejected',
      resource: 'user',
      resourceId: userId,
      details: {
        userEmail,
        rejectionReason: reason,
        rejectionTime: new Date().toISOString()
      },
      ipAddress,
      userAgent,
      success: true
    });
  }

  /**
   * Log dashboard access
   */
  static async logDashboardAccess(adminId, ipAddress, userAgent) {
    return this.logAction({
      adminId,
      action: 'dashboard_accessed',
      resource: 'dashboard',
      details: {
        accessTime: new Date().toISOString()
      },
      ipAddress,
      userAgent,
      success: true
    });
  }

  /**
   * Log profile view
   */
  static async logProfileView(adminId, viewedUserId, ipAddress, userAgent) {
    return this.logAction({
      adminId,
      action: 'profile_viewed',
      resource: 'user',
      resourceId: viewedUserId,
      details: {
        viewTime: new Date().toISOString()
      },
      ipAddress,
      userAgent,
      success: true
    });
  }

  /**
   * Log bulk actions
   */
  static async logBulkAction(adminId, action, userIds, ipAddress, userAgent, details = {}) {
    return this.logAction({
      adminId,
      action: 'bulk_action',
      resource: 'user',
      details: {
        bulkAction: action,
        affectedUsers: userIds,
        userCount: userIds.length,
        actionTime: new Date().toISOString(),
        ...details
      },
      ipAddress,
      userAgent,
      success: true
    });
  }

  /**
   * Get audit logs with filtering and pagination
   */
  static async getAuditLogs({
    page = 1,
    limit = 50,
    adminId = null,
    action = null,
    resource = null,
    dateFrom = null,
    dateTo = null,
    success = null,
    ipAddress = null
  }) {
    try {
      const query = {};

      // Apply filters
      if (adminId) {
        query.adminId = adminId;
      }

      if (action) {
        query.action = action;
      }

      if (resource) {
        query.resource = resource;
      }

      if (success !== null) {
        query.success = success;
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

      // Pagination
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

      const auditLogs = await AuditLog.find(query)
        .populate('adminId', 'username email role')
        .sort({ timestamp: -1 })
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum)
        .select('-__v');

      const total = await AuditLog.countDocuments(query);
      const totalPages = Math.ceil(total / limitNum);

      return {
        auditLogs,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalLogs: total,
          logsPerPage: limitNum,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      };
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      throw error;
    }
  }

  /**
   * Get audit logs for a specific user
   */
  static async getUserAuditTrail(userId, page = 1, limit = 20) {
    try {
      const query = {
        $or: [
          { resourceId: userId },
          { 'details.affectedUsers': userId }
        ]
      };

      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

      const auditLogs = await AuditLog.find(query)
        .populate('adminId', 'username email role')
        .sort({ timestamp: -1 })
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum)
        .select('-__v');

      const total = await AuditLog.countDocuments(query);

      return {
        auditLogs,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalLogs: total,
          logsPerPage: limitNum
        }
      };
    } catch (error) {
      console.error('Failed to get user audit trail:', error);
      throw error;
    }
  }

  /**
   * Get audit logs for a specific admin
   */
  static async getAdminAuditHistory(adminId, page = 1, limit = 20) {
    try {
      const query = { adminId };

      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

      const auditLogs = await AuditLog.find(query)
        .populate('adminId', 'username email role')
        .sort({ timestamp: -1 })
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum)
        .select('-__v');

      const total = await AuditLog.countDocuments(query);

      return {
        auditLogs,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalLogs: total,
          logsPerPage: limitNum
        }
      };
    } catch (error) {
      console.error('Failed to get admin audit history:', error);
      throw error;
    }
  }

  /**
   * Get audit statistics
   */
  static async getAuditStats(dateFrom = null, dateTo = null) {
    try {
      const matchQuery = {};

      if (dateFrom || dateTo) {
        matchQuery.timestamp = {};
        if (dateFrom) {
          matchQuery.timestamp.$gte = new Date(dateFrom);
        }
        if (dateTo) {
          const endDate = new Date(dateTo);
          endDate.setHours(23, 59, 59, 999);
          matchQuery.timestamp.$lte = endDate;
        }
      }

      const stats = await AuditLog.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            totalActions: { $sum: 1 },
            successfulActions: {
              $sum: { $cond: [{ $eq: ['$success', true] }, 1, 0] }
            },
            failedActions: {
              $sum: { $cond: [{ $eq: ['$success', false] }, 1, 0] }
            },
            actionsByType: {
              $push: '$action'
            },
            resourcesByType: {
              $push: '$resource'
            },
            uniqueAdmins: {
              $addToSet: '$adminId'
            },
            uniqueIPs: {
              $addToSet: '$ipAddress'
            }
          }
        }
      ]);

      if (stats.length === 0) {
        return {
          totalActions: 0,
          successfulActions: 0,
          failedActions: 0,
          successRate: 0,
          actionBreakdown: {},
          resourceBreakdown: {},
          uniqueAdmins: 0,
          uniqueIPs: 0
        };
      }

      const result = stats[0];

      // Count actions by type
      const actionBreakdown = {};
      result.actionsByType.forEach(action => {
        actionBreakdown[action] = (actionBreakdown[action] || 0) + 1;
      });

      // Count resources by type
      const resourceBreakdown = {};
      result.resourcesByType.forEach(resource => {
        resourceBreakdown[resource] = (resourceBreakdown[resource] || 0) + 1;
      });

      return {
        totalActions: result.totalActions,
        successfulActions: result.successfulActions,
        failedActions: result.failedActions,
        successRate: result.totalActions > 0 ? 
          ((result.successfulActions / result.totalActions) * 100).toFixed(2) : 0,
        actionBreakdown,
        resourceBreakdown,
        uniqueAdmins: result.uniqueAdmins.length,
        uniqueIPs: result.uniqueIPs.length
      };
    } catch (error) {
      console.error('Failed to get audit stats:', error);
      throw error;
    }
  }
}

module.exports = AuditService;
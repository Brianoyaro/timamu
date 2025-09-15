/**
 * Audit logging utility
 * Handles creation and management of audit logs for security and compliance
 */

const { prisma } = require('./database');
const logger = require('./logger');

/**
 * Create an audit log entry
 * @param {Object} options - Audit log options
 * @param {string} options.action - Action performed (e.g., 'USER_LOGIN', 'SESSION_CREATE')
 * @param {string} [options.userId] - ID of the user performing the action
 * @param {string} [options.userEmail] - Email of the user (stored for record keeping)
 * @param {string} [options.resource] - Resource being acted upon
 * @param {string} [options.resourceId] - ID of the resource
 * @param {string} [options.ipAddress] - IP address of the request
 * @param {string} [options.userAgent] - User agent string
 * @param {string} [options.method] - HTTP method
 * @param {string} [options.endpoint] - API endpoint
 * @param {string} options.status - Status of the action ('SUCCESS', 'FAILURE', 'ERROR')
 * @param {Object} [options.details] - Additional details about the action
 */
const createAuditLog = async (options) => {
  try {
    const auditLog = await prisma.auditLog.create({
      data: {
        action: options.action,
        userId: options.userId || null,
        userEmail: options.userEmail || null,
        resource: options.resource || null,
        resourceId: options.resourceId || null,
        ipAddress: options.ipAddress || null,
        userAgent: options.userAgent || null,
        method: options.method || null,
        endpoint: options.endpoint || null,
        status: options.status,
        details: options.details || null
      }
    });

    // Also log to application logger for immediate visibility
    logger.info('Audit log created', {
      id: auditLog.id,
      action: options.action,
      userId: options.userId,
      status: options.status
    });

    return auditLog;
  } catch (error) {
    // Don't let audit logging failure break the main operation
    logger.error('Failed to create audit log:', {
      error: error.message,
      action: options.action,
      userId: options.userId
    });
  }
};

/**
 * Get audit logs with filtering and pagination
 * @param {Object} filters - Filter options
 * @param {string} [filters.userId] - Filter by user ID
 * @param {string} [filters.action] - Filter by action type
 * @param {string} [filters.status] - Filter by status
 * @param {Date} [filters.startDate] - Filter by start date
 * @param {Date} [filters.endDate] - Filter by end date
 * @param {number} [filters.page] - Page number (default: 1)
 * @param {number} [filters.limit] - Items per page (default: 50)
 */
const getAuditLogs = async (filters = {}) => {
  try {
    const {
      userId,
      action,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = filters;

    const where = {};

    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (status) where.status = status;
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [auditLogs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.auditLog.count({ where })
    ]);

    return {
      auditLogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Failed to retrieve audit logs:', error);
    throw new Error('Failed to retrieve audit logs');
  }
};

/**
 * Get audit log statistics
 * @param {Object} filters - Filter options
 * @param {Date} [filters.startDate] - Start date for statistics
 * @param {Date} [filters.endDate] - End date for statistics
 */
const getAuditStats = async (filters = {}) => {
  try {
    const { startDate, endDate } = filters;
    
    const where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [
      totalLogs,
      successfulActions,
      failedActions,
      errorActions,
      uniqueUsers,
      actionBreakdown
    ] = await Promise.all([
      // Total logs
      prisma.auditLog.count({ where }),
      
      // Successful actions
      prisma.auditLog.count({
        where: { ...where, status: 'SUCCESS' }
      }),
      
      // Failed actions
      prisma.auditLog.count({
        where: { ...where, status: 'FAILURE' }
      }),
      
      // Error actions
      prisma.auditLog.count({
        where: { ...where, status: 'ERROR' }
      }),
      
      // Unique users
      prisma.auditLog.findMany({
        where: { ...where, userId: { not: null } },
        select: { userId: true },
        distinct: ['userId']
      }),
      
      // Action breakdown
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: {
          action: true
        },
        orderBy: {
          _count: {
            action: 'desc'
          }
        }
      })
    ]);

    return {
      totalLogs,
      successfulActions,
      failedActions,
      errorActions,
      uniqueUsers: uniqueUsers.length,
      actionBreakdown: actionBreakdown.map(item => ({
        action: item.action,
        count: item._count.action
      })),
      successRate: totalLogs > 0 ? (successfulActions / totalLogs * 100).toFixed(2) : 0
    };
  } catch (error) {
    logger.error('Failed to get audit statistics:', error);
    throw new Error('Failed to get audit statistics');
  }
};

/**
 * Clean up old audit logs (for data retention compliance)
 * @param {number} retentionDays - Number of days to retain logs (default: 365)
 */
const cleanupOldAuditLogs = async (retentionDays = 365) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const deletedCount = await prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        }
      }
    });

    logger.info(`Cleaned up ${deletedCount.count} audit logs older than ${retentionDays} days`);
    return deletedCount.count;
  } catch (error) {
    logger.error('Failed to cleanup old audit logs:', error);
    throw new Error('Failed to cleanup old audit logs');
  }
};

/**
 * Export audit logs to CSV format
 * @param {Object} filters - Filter options (same as getAuditLogs)
 */
const exportAuditLogs = async (filters = {}) => {
  try {
    // Get all logs without pagination for export
    const { auditLogs } = await getAuditLogs({ ...filters, limit: 10000 });

    const csvHeaders = [
      'Timestamp',
      'Action',
      'User Email',
      'User ID',
      'Resource',
      'Resource ID',
      'Status',
      'IP Address',
      'User Agent',
      'Method',
      'Endpoint',
      'Details'
    ];

    const csvRows = auditLogs.map(log => [
      log.createdAt.toISOString(),
      log.action,
      log.userEmail || '',
      log.userId || '',
      log.resource || '',
      log.resourceId || '',
      log.status,
      log.ipAddress || '',
      log.userAgent || '',
      log.method || '',
      log.endpoint || '',
      log.details ? JSON.stringify(log.details) : ''
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  } catch (error) {
    logger.error('Failed to export audit logs:', error);
    throw new Error('Failed to export audit logs');
  }
};

// Common audit actions (for consistency)
const AUDIT_ACTIONS = {
  // Authentication
  USER_REGISTER: 'USER_REGISTER',
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  USER_LOGOUT_ALL: 'USER_LOGOUT_ALL',
  PASSWORD_RESET_REQUEST: 'PASSWORD_RESET_REQUEST',
  PASSWORD_RESET_COMPLETE: 'PASSWORD_RESET_COMPLETE',
  EMAIL_VERIFICATION: 'EMAIL_VERIFICATION',
  OAUTH_LOGIN: 'OAUTH_LOGIN',

  // User Management
  USER_CREATE: 'USER_CREATE',
  USER_UPDATE: 'USER_UPDATE',
  USER_DELETE: 'USER_DELETE',
  USER_ACTIVATE: 'USER_ACTIVATE',
  USER_DEACTIVATE: 'USER_DEACTIVATE',
  THERAPIST_APPROVE: 'THERAPIST_APPROVE',
  THERAPIST_REJECT: 'THERAPIST_REJECT',

  // Sessions
  SESSION_CREATE: 'SESSION_CREATE',
  SESSION_UPDATE: 'SESSION_UPDATE',
  SESSION_DELETE: 'SESSION_DELETE',
  SESSION_START: 'SESSION_START',
  SESSION_END: 'SESSION_END',
  SESSION_JOIN: 'SESSION_JOIN',
  SESSION_LEAVE: 'SESSION_LEAVE',

  // Messages
  MESSAGE_SEND: 'MESSAGE_SEND',
  MESSAGE_READ: 'MESSAGE_READ',
  MESSAGE_DELETE: 'MESSAGE_DELETE',

  // Files
  FILE_UPLOAD: 'FILE_UPLOAD',
  FILE_DOWNLOAD: 'FILE_DOWNLOAD',
  FILE_DELETE: 'FILE_DELETE',

  // Admin Actions
  ADMIN_LOGIN: 'ADMIN_LOGIN',
  ADMIN_USER_IMPERSONATE: 'ADMIN_USER_IMPERSONATE',
  ADMIN_SYSTEM_CONFIG: 'ADMIN_SYSTEM_CONFIG',
  ADMIN_DATA_EXPORT: 'ADMIN_DATA_EXPORT',

  // Security
  SECURITY_BREACH_ATTEMPT: 'SECURITY_BREACH_ATTEMPT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY'
};

module.exports = {
  createAuditLog,
  getAuditLogs,
  getAuditStats,
  cleanupOldAuditLogs,
  exportAuditLogs,
  AUDIT_ACTIONS
};

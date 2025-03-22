const AuditLog = require('../models/auditLog.model');
const User = require('../models/user.model');

/**
 * Get all audit logs
 * @route GET /api/audit-logs
 */
exports.getAllAuditLogs = async (req, res) => {
  try {
    // Only admins can access all logs
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to access audit logs',
      });
    }
    
    // Build filter based on query parameters
    const filter = {};
    
    if (req.query.action) {
      filter.action = req.query.action;
    }
    
    if (req.query.entityType) {
      filter.entityType = req.query.entityType;
    }
    
    if (req.query.userId) {
      filter.userId = req.query.userId;
    }
    
    if (req.query.startDate && req.query.endDate) {
      filter.timestamp = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    } else if (req.query.startDate) {
      filter.timestamp = { $gte: new Date(req.query.startDate) };
    } else if (req.query.endDate) {
      filter.timestamp = { $lte: new Date(req.query.endDate) };
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    
    // Query for audit logs with population
    const auditLogs = await AuditLog.find(filter)
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email')
      .sort({ timestamp: -1 });
    
    // Get total count for pagination
    const total = await AuditLog.countDocuments(filter);
    
    res.status(200).json({
      status: 'success',
      results: auditLogs.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
      data: {
        auditLogs,
      },
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve audit logs',
      error: error.message,
    });
  }
};

/**
 * Get audit logs for a specific entity
 * @route GET /api/audit-logs/entity/:entityType/:entityId
 */
exports.getEntityAuditLogs = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    
    // Check permissions - managers can view logs for their department and employees
    let hasPermission = req.user.role === 'admin';
    
    if (req.user.role === 'manager' && 
        ['department', 'task', 'grievance', 'document'].includes(entityType)) {
      // For departments, check if manager heads this department
      if (entityType === 'department') {
        const departmentCheck = await req.db.collection('departments').findOne({
          _id: entityId,
          head: req.user._id
        });
        
        hasPermission = !!departmentCheck;
      }
      
      // For other entities, allow if they belong to manager's department
      else {
        hasPermission = true; // Simplified - in real app would check if entity belongs to manager's department
      }
    }
    
    if (!hasPermission) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to access these audit logs',
      });
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    // Query for entity audit logs
    const auditLogs = await AuditLog.find({
      entityType,
      entityId
    })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email')
      .sort({ timestamp: -1 });
    
    // Get total count for pagination
    const total = await AuditLog.countDocuments({
      entityType,
      entityId
    });
    
    res.status(200).json({
      status: 'success',
      results: auditLogs.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
      data: {
        auditLogs,
      },
    });
  } catch (error) {
    console.error('Get entity audit logs error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve entity audit logs',
      error: error.message,
    });
  }
};

/**
 * Get audit logs for current user's activity
 * @route GET /api/audit-logs/user-activity
 */
exports.getUserActivity = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter based on query parameters
    const filter = { userId: req.user._id };
    
    if (req.query.action) {
      filter.action = req.query.action;
    }
    
    if (req.query.entityType) {
      filter.entityType = req.query.entityType;
    }
    
    if (req.query.startDate && req.query.endDate) {
      filter.timestamp = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    } else if (req.query.startDate) {
      filter.timestamp = { $gte: new Date(req.query.startDate) };
    } else if (req.query.endDate) {
      filter.timestamp = { $lte: new Date(req.query.endDate) };
    }
    
    // Query for user's audit logs
    const auditLogs = await AuditLog.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ timestamp: -1 });
    
    // Get total count for pagination
    const total = await AuditLog.countDocuments(filter);
    
    res.status(200).json({
      status: 'success',
      results: auditLogs.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
      data: {
        auditLogs,
      },
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve user activity',
      error: error.message,
    });
  }
};

/**
 * Get audit log statistics
 * @route GET /api/audit-logs/stats
 */
exports.getAuditStats = async (req, res) => {
  try {
    // Only admins can access audit statistics
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to access audit statistics',
      });
    }
    
    // Get date range for filtering
    let dateFilter = {};
    const days = parseInt(req.query.days, 10) || 30;
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    dateFilter = {
      timestamp: {
        $gte: startDate,
        $lte: endDate
      }
    };
    
    // Count audit logs by action type
    const actionStats = await AuditLog.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Count audit logs by entity type
    const entityStats = await AuditLog.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$entityType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Count audit logs by user
    const userStats = await AuditLog.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Get user details for top users
    const userIds = userStats.map(stat => stat._id);
    const users = await User.find({ _id: { $in: userIds } })
      .select('name email');
    
    // Map user details to stats
    const userActivityStats = userStats.map(stat => {
      const user = users.find(u => u._id.toString() === stat._id.toString());
      return {
        userId: stat._id,
        name: user ? user.name : 'Unknown User',
        email: user ? user.email : '',
        count: stat.count
      };
    });
    
    // Get total count for the period
    const totalActions = await AuditLog.countDocuments(dateFilter);
    
    // Get count by day for the period
    const dailyStats = await AuditLog.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);
    
    // Format daily stats for easier consumption
    const formattedDailyStats = dailyStats.map(day => {
      const date = new Date(day._id.year, day._id.month - 1, day._id.day);
      return {
        date: date.toISOString().split('T')[0],
        count: day.count
      };
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        totalActions,
        actionStats,
        entityStats,
        userActivityStats,
        dailyStats: formattedDailyStats,
        period: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          days
        }
      },
    });
  } catch (error) {
    console.error('Get audit stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve audit statistics',
      error: error.message,
    });
  }
};

/**
 * Create an audit log entry (internal use by middleware)
 */
exports.createAuditLog = async (action, entityType, entityId, userId, details, ipAddress) => {
  try {
    await AuditLog.create({
      action,
      entityType,
      entityId,
      userId,
      details,
      ipAddress,
      timestamp: new Date()
    });
    
    return true;
  } catch (error) {
    console.error('Create audit log error:', error);
    return false;
  }
}; 
const User = require('../models/user.model');
const Department = require('../models/department.model');
const Task = require('../models/task.model');
const Document = require('../models/document.model');
const Grievance = require('../models/grievance.model');

/**
 * Get dashboard statistics for authorized user
 * @route GET /api/stats/dashboard
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const stats = {};
    const userRole = req.user.role;
    const userId = req.user._id;
    
    // Basic user counts
    if (userRole === 'admin' || userRole === 'manager') {
      // Count of active users
      stats.totalUsers = await User.countDocuments({ isActive: true });
      
      // User count by role
      const userRoleStats = await User.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]);
      
      stats.usersByRole = {};
      userRoleStats.forEach(stat => {
        stats.usersByRole[stat._id] = stat.count;
      });
      
      // Department counts
      stats.totalDepartments = await Department.countDocuments();
    }
    
    // Task statistics
    if (userRole === 'admin' || userRole === 'manager') {
      // For admins and managers - all tasks stats
      stats.tasks = {
        total: await Task.countDocuments(),
        pending: await Task.countDocuments({ status: 'pending' }),
        inProgress: await Task.countDocuments({ status: 'in-progress' }),
        completed: await Task.countDocuments({ status: 'completed' }),
        overdue: await Task.countDocuments({
          dueDate: { $lt: new Date() },
          status: { $nin: ['completed', 'cancelled'] }
        })
      };
      
      if (userRole === 'manager' && req.user.department) {
        // For managers - also get department-specific stats
        stats.departmentTasks = {
          total: await Task.countDocuments({ department: req.user.department }),
          pending: await Task.countDocuments({ 
            department: req.user.department,
            status: 'pending'
          }),
          inProgress: await Task.countDocuments({ 
            department: req.user.department,
            status: 'in-progress'
          }),
          completed: await Task.countDocuments({ 
            department: req.user.department,
            status: 'completed'
          })
        };
      }
    } else {
      // For regular employees - only their assigned tasks
      stats.myTasks = {
        total: await Task.countDocuments({ assignedTo: userId }),
        pending: await Task.countDocuments({ 
          assignedTo: userId,
          status: 'pending'
        }),
        inProgress: await Task.countDocuments({ 
          assignedTo: userId,
          status: 'in-progress'
        }),
        completed: await Task.countDocuments({ 
          assignedTo: userId,
          status: 'completed'
        }),
        overdue: await Task.countDocuments({
          assignedTo: userId,
          dueDate: { $lt: new Date() },
          status: { $nin: ['completed', 'cancelled'] }
        })
      };
    }
    
    // Document statistics
    if (userRole === 'admin') {
      stats.documents = {
        total: await Document.countDocuments(),
        private: await Document.countDocuments({ isPrivate: true }),
        public: await Document.countDocuments({ isPrivate: false })
      };
    } else {
      // For non-admins, count documents they can access
      const docFilter = {
        $or: [
          { isPrivate: false },
          { creator: userId },
          { sharedWith: userId }
        ]
      };
      
      stats.documents = {
        accessible: await Document.countDocuments(docFilter),
        created: await Document.countDocuments({ creator: userId }),
        sharedWithMe: await Document.countDocuments({ 
          sharedWith: userId,
          creator: { $ne: userId }
        })
      };
    }
    
    // Grievance statistics
    if (userRole === 'admin') {
      stats.grievances = {
        total: await Grievance.countDocuments(),
        pending: await Grievance.countDocuments({ status: 'pending' }),
        inProgress: await Grievance.countDocuments({ status: 'in-progress' }),
        resolved: await Grievance.countDocuments({ status: 'resolved' }),
        escalated: await Grievance.countDocuments({ status: 'escalated' })
      };
    } else if (userRole === 'manager' && req.user.department) {
      // For managers, get department-specific grievance stats
      const departmentUsers = await User.find({ 
        department: req.user.department,
        isActive: true
      }).select('_id');
      
      const departmentUserIds = departmentUsers.map(user => user._id);
      
      const grievanceFilter = {
        $or: [
          { reporter: { $in: departmentUserIds } },
          { assignedTo: userId },
          { reporter: userId }
        ]
      };
      
      stats.grievances = {
        departmentTotal: await Grievance.countDocuments(grievanceFilter),
        pending: await Grievance.countDocuments({ 
          ...grievanceFilter, 
          status: 'pending' 
        }),
        inProgress: await Grievance.countDocuments({ 
          ...grievanceFilter, 
          status: 'in-progress' 
        }),
        resolved: await Grievance.countDocuments({ 
          ...grievanceFilter, 
          status: 'resolved' 
        }),
        escalated: await Grievance.countDocuments({ 
          ...grievanceFilter, 
          status: 'escalated' 
        })
      };
    } else {
      // For regular employees, only their grievances
      stats.grievances = {
        submitted: await Grievance.countDocuments({ reporter: userId }),
        pending: await Grievance.countDocuments({ 
          reporter: userId,
          status: 'pending' 
        }),
        inProgress: await Grievance.countDocuments({ 
          reporter: userId,
          status: 'in-progress' 
        }),
        resolved: await Grievance.countDocuments({ 
          reporter: userId,
          status: 'resolved' 
        })
      };
    }
    
    // Recent activity - get counts of recently created items
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    stats.recentActivity = {
      newUsers: await User.countDocuments({ 
        createdAt: { $gte: thirtyDaysAgo },
        isActive: true
      }),
      newTasks: await Task.countDocuments({ 
        createdAt: { $gte: thirtyDaysAgo } 
      }),
      completedTasks: await Task.countDocuments({ 
        completedAt: { $gte: thirtyDaysAgo },
        status: 'completed'
      }),
      newDocuments: await Document.countDocuments({ 
        createdAt: { $gte: thirtyDaysAgo } 
      }),
      newGrievances: await Grievance.countDocuments({ 
        createdAt: { $gte: thirtyDaysAgo } 
      }),
      resolvedGrievances: await Grievance.countDocuments({ 
        resolvedAt: { $gte: thirtyDaysAgo },
        status: 'resolved'
      })
    };
    
    res.status(200).json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve dashboard statistics',
      error: error.message,
    });
  }
};

/**
 * Get system overview statistics (admin only)
 * @route GET /api/stats/system
 */
exports.getSystemStats = async (req, res) => {
  try {
    // Only admins can access system stats
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to access system statistics',
      });
    }
    
    const stats = {};
    
    // Get date ranges for trends
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const lastYear = new Date(today);
    lastYear.setFullYear(lastYear.getFullYear() - 1);
    
    // User stats
    stats.users = {
      total: await User.countDocuments({ isActive: true }),
      inactive: await User.countDocuments({ isActive: false }),
      newThisMonth: await User.countDocuments({
        createdAt: { $gte: lastMonth },
        isActive: true
      }),
      byRole: {}
    };
    
    // Get users by role
    const userRoles = await User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    
    userRoles.forEach(role => {
      stats.users.byRole[role._id] = role.count;
    });
    
    // Department stats
    stats.departments = {
      total: await Department.countDocuments(),
      topLevel: await Department.countDocuments({ parentDepartment: null })
    };
    
    // Task stats
    stats.tasks = {
      total: await Task.countDocuments(),
      byStatus: {},
      byPriority: {},
      completedThisMonth: await Task.countDocuments({
        status: 'completed',
        completedAt: { $gte: lastMonth }
      }),
      overdueCount: await Task.countDocuments({
        dueDate: { $lt: today },
        status: { $nin: ['completed', 'cancelled'] }
      })
    };
    
    // Get tasks by status
    const taskStatuses = await Task.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    taskStatuses.forEach(status => {
      stats.tasks.byStatus[status._id] = status.count;
    });
    
    // Get tasks by priority
    const taskPriorities = await Task.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);
    
    taskPriorities.forEach(priority => {
      stats.tasks.byPriority[priority._id] = priority.count;
    });
    
    // Document stats
    stats.documents = {
      total: await Document.countDocuments(),
      private: await Document.countDocuments({ isPrivate: true }),
      public: await Document.countDocuments({ isPrivate: false }),
      byType: {}
    };
    
    // Get documents by type
    const docTypes = await Document.aggregate([
      { $group: { _id: '$fileType', count: { $sum: 1 } } }
    ]);
    
    docTypes.forEach(type => {
      stats.documents.byType[type._id] = type.count;
    });
    
    // Grievance stats
    stats.grievances = {
      total: await Grievance.countDocuments(),
      byStatus: {},
      byCategory: {},
      resolvedThisMonth: await Grievance.countDocuments({
        status: 'resolved',
        resolvedAt: { $gte: lastMonth }
      })
    };
    
    // Get grievances by status
    const grievanceStatuses = await Grievance.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    grievanceStatuses.forEach(status => {
      stats.grievances.byStatus[status._id] = status.count;
    });
    
    // Get grievances by category
    const grievanceCategories = await Grievance.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    
    grievanceCategories.forEach(category => {
      stats.grievances.byCategory[category._id] = category.count;
    });
    
    // Get monthly trends for the past year
    const getMonthlyTrends = async (model, dateField = 'createdAt') => {
      const trendData = await model.aggregate([
        {
          $match: {
            [dateField]: { $gte: lastYear }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: `$${dateField}` },
              month: { $month: `$${dateField}` }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        }
      ]);
      
      // Format to [{ month: 'YYYY-MM', count: X }, ...]
      return trendData.map(item => ({
        month: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
        count: item.count
      }));
    };
    
    // Add trends
    stats.trends = {
      users: await getMonthlyTrends(User),
      tasks: {
        created: await getMonthlyTrends(Task),
        completed: await getMonthlyTrends(Task, 'completedAt')
      },
      documents: await getMonthlyTrends(Document),
      grievances: {
        created: await getMonthlyTrends(Grievance),
        resolved: await getMonthlyTrends(Grievance, 'resolvedAt')
      }
    };
    
    res.status(200).json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    console.error('Get system stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve system statistics',
      error: error.message,
    });
  }
}; 
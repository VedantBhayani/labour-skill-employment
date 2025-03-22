const Grievance = require('../models/grievance.model');
const User = require('../models/user.model');

/**
 * Get all grievances
 * @route GET /api/grievances
 */
exports.getAllGrievances = async (req, res) => {
  try {
    let filter = {};
    
    // Regular employees can only view their own grievances
    if (req.user.role === 'employee') {
      filter.reporter = req.user._id;
    }
    
    // Managers can view grievances from their department
    else if (req.user.role === 'manager') {
      if (req.user.department) {
        // Find users in manager's department
        const departmentUsers = await User.find({ 
          department: req.user.department,
          isActive: true
        }).select('_id');
        
        const departmentUserIds = departmentUsers.map(user => user._id);
        
        filter.$or = [
          { reporter: { $in: departmentUserIds } },
          { reporter: req.user._id },
          { assignedTo: req.user._id }
        ];
      } else {
        // If manager doesn't have a department, only show their own
        filter.reporter = req.user._id;
      }
    }
    
    // Apply additional filters based on query parameters
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.priority) {
      filter.priority = req.query.priority;
    }
    
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    // Admins can filter by reporter
    if (req.user.role === 'admin' && req.query.reporter) {
      filter.reporter = req.query.reporter;
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    // Query for grievances
    const grievances = await Grievance.find(filter)
      .skip(skip)
      .limit(limit)
      .populate('reporter', 'name email department')
      .populate('assignedTo', 'name email')
      .populate('escalatedTo', 'name email')
      .sort({ createdAt: -1 });
    
    // Get total count for pagination
    const total = await Grievance.countDocuments(filter);
    
    res.status(200).json({
      status: 'success',
      results: grievances.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
      data: {
        grievances,
      },
    });
  } catch (error) {
    console.error('Get grievances error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve grievances',
      error: error.message,
    });
  }
};

/**
 * Get grievance by ID
 * @route GET /api/grievances/:id
 */
exports.getGrievanceById = async (req, res) => {
  try {
    const grievance = await Grievance.findById(req.params.id)
      .populate('reporter', 'name email department position')
      .populate('assignedTo', 'name email position')
      .populate('escalatedTo', 'name email position')
      .populate('comments.user', 'name email');
    
    if (!grievance) {
      return res.status(404).json({
        status: 'error',
        message: 'Grievance not found',
      });
    }
    
    // Check access permissions
    const isReporter = grievance.reporter._id.toString() === req.user._id.toString();
    const isAssigned = grievance.assignedTo && 
                      grievance.assignedTo._id.toString() === req.user._id.toString();
    const isEscalated = grievance.escalatedTo && 
                      grievance.escalatedTo._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    // Check if manager can view (from same department as reporter)
    let canManagerView = false;
    if (req.user.role === 'manager' && req.user.department && 
        grievance.reporter.department && 
        grievance.reporter.department.toString() === req.user.department.toString()) {
      canManagerView = true;
    }
    
    if (!isReporter && !isAssigned && !isEscalated && !isAdmin && !canManagerView) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to view this grievance',
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        grievance,
      },
    });
  } catch (error) {
    console.error('Get grievance error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve grievance',
      error: error.message,
    });
  }
};

/**
 * Create a new grievance
 * @route POST /api/grievances
 */
exports.createGrievance = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      priority,
      attachments
    } = req.body;
    
    // Create new grievance
    const grievance = await Grievance.create({
      title,
      description,
      category,
      priority: priority || 'medium',
      status: 'pending',
      reporter: req.user._id,
      attachments,
      statusHistory: [
        {
          status: 'pending',
          changedBy: req.user._id,
          timestamp: Date.now(),
          note: 'Grievance submitted'
        }
      ]
    });
    
    // Populate created grievance
    const populatedGrievance = await Grievance.findById(grievance._id)
      .populate('reporter', 'name email');
    
    res.status(201).json({
      status: 'success',
      data: {
        grievance: populatedGrievance,
      },
    });
  } catch (error) {
    console.error('Create grievance error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create grievance',
      error: error.message,
    });
  }
};

/**
 * Update a grievance
 * @route PATCH /api/grievances/:id
 */
exports.updateGrievance = async (req, res) => {
  try {
    const {
      title,
      description,
      status,
      priority,
      category,
      assignedTo,
      escalatedTo,
      resolution,
      attachments,
      statusNote
    } = req.body;
    
    // Find grievance first to check permissions
    const grievance = await Grievance.findById(req.params.id);
    
    if (!grievance) {
      return res.status(404).json({
        status: 'error',
        message: 'Grievance not found',
      });
    }
    
    // Check permissions
    const isReporter = grievance.reporter.toString() === req.user._id.toString();
    const isAssigned = grievance.assignedTo && 
                      grievance.assignedTo.toString() === req.user._id.toString();
    const isEscalated = grievance.escalatedTo && 
                      grievance.escalatedTo.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isManager = req.user.role === 'manager';
    
    // Build update object based on permissions
    const updateData = {};
    
    // Reporter can update title, description, and attachments if grievance is still pending
    if (isReporter && grievance.status === 'pending') {
      if (title) updateData.title = title;
      if (description) updateData.description = description;
      if (attachments) updateData.attachments = attachments;
    }
    
    // Admin and assigned/escalated users can update most fields
    if (isAdmin || isAssigned || isEscalated || isManager) {
      if (status && status !== grievance.status) {
        updateData.status = status;
        
        // Add status history entry
        const statusHistoryEntry = {
          status,
          changedBy: req.user._id,
          timestamp: Date.now(),
          note: statusNote || `Status changed to ${status}`
        };
        
        updateData.statusHistory = [...grievance.statusHistory, statusHistoryEntry];
        
        // If resolved, add resolution date
        if (status === 'resolved') {
          updateData.resolvedAt = Date.now();
        }
      }
      
      if (priority) updateData.priority = priority;
      if (category) updateData.category = category;
      if (assignedTo) updateData.assignedTo = assignedTo;
      if (escalatedTo) updateData.escalatedTo = escalatedTo;
      if (resolution) updateData.resolution = resolution;
    }
    
    // Add updater info
    updateData.updatedBy = req.user._id;
    updateData.updatedAt = Date.now();
    
    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No valid fields to update',
      });
    }
    
    // Update grievance
    const updatedGrievance = await Grievance.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('reporter', 'name email')
      .populate('assignedTo', 'name email')
      .populate('escalatedTo', 'name email');
    
    res.status(200).json({
      status: 'success',
      data: {
        grievance: updatedGrievance,
      },
    });
  } catch (error) {
    console.error('Update grievance error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update grievance',
      error: error.message,
    });
  }
};

/**
 * Delete a grievance
 * @route DELETE /api/grievances/:id
 */
exports.deleteGrievance = async (req, res) => {
  try {
    // Find grievance first to check permissions
    const grievance = await Grievance.findById(req.params.id);
    
    if (!grievance) {
      return res.status(404).json({
        status: 'error',
        message: 'Grievance not found',
      });
    }
    
    // Only reporter can delete a pending grievance or admin can delete any
    const isReporter = grievance.reporter.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!(isReporter && grievance.status === 'pending') && !isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to delete this grievance',
      });
    }
    
    // Delete grievance
    await Grievance.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      status: 'success',
      message: 'Grievance deleted successfully',
    });
  } catch (error) {
    console.error('Delete grievance error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete grievance',
      error: error.message,
    });
  }
};

/**
 * Add comment to grievance
 * @route POST /api/grievances/:id/comments
 */
exports.addComment = async (req, res) => {
  try {
    const { content, isPrivate } = req.body;
    
    if (!content) {
      return res.status(400).json({
        status: 'error',
        message: 'Comment content is required',
      });
    }
    
    // Find grievance first to check permissions
    const grievance = await Grievance.findById(req.params.id);
    
    if (!grievance) {
      return res.status(404).json({
        status: 'error',
        message: 'Grievance not found',
      });
    }
    
    // Check permissions - who can comment
    const isReporter = grievance.reporter.toString() === req.user._id.toString();
    const isAssigned = grievance.assignedTo && 
                      grievance.assignedTo.toString() === req.user._id.toString();
    const isEscalated = grievance.escalatedTo && 
                      grievance.escalatedTo.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isManager = req.user.role === 'manager';
    
    const canComment = isReporter || isAssigned || isEscalated || isAdmin || isManager;
    
    if (!canComment) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to comment on this grievance',
      });
    }
    
    // Add comment
    const comment = {
      content,
      user: req.user._id,
      createdAt: Date.now(),
      isPrivate: isPrivate || false
    };
    
    grievance.comments.push(comment);
    await grievance.save();
    
    // Populate updated grievance
    const updatedGrievance = await Grievance.findById(req.params.id)
      .populate('reporter', 'name email')
      .populate('assignedTo', 'name email')
      .populate('escalatedTo', 'name email')
      .populate('comments.user', 'name email');
    
    res.status(200).json({
      status: 'success',
      data: {
        grievance: updatedGrievance,
      },
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add comment',
      error: error.message,
    });
  }
};

/**
 * Get grievance statistics
 * @route GET /api/grievances/stats
 */
exports.getGrievanceStats = async (req, res) => {
  try {
    let filter = {};
    
    // Regular employees can only view stats for their own grievances
    if (req.user.role === 'employee') {
      filter.reporter = req.user._id;
    }
    
    // Managers can view stats for grievances from their department
    else if (req.user.role === 'manager') {
      if (req.user.department) {
        // Find users in manager's department
        const departmentUsers = await User.find({ 
          department: req.user.department,
          isActive: true
        }).select('_id');
        
        const departmentUserIds = departmentUsers.map(user => user._id);
        
        filter.$or = [
          { reporter: { $in: departmentUserIds } },
          { assignedTo: req.user._id }
        ];
      } else {
        // If manager doesn't have a department, only show theirs
        filter.$or = [
          { reporter: req.user._id },
          { assignedTo: req.user._id }
        ];
      }
    }
    
    // Count grievances by status
    const statusStats = await Grievance.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    // Count grievances by category
    const categoryStats = await Grievance.aggregate([
      { $match: filter },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    // Count grievances by priority
    const priorityStats = await Grievance.aggregate([
      { $match: filter },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    // Transform aggregation result for easier consumption
    const statusCounts = { pending: 0, 'in-progress': 0, resolved: 0, rejected: 0, escalated: 0 };
    statusStats.forEach(stat => {
      statusCounts[stat._id] = stat.count;
    });
    
    const categoryCounts = {};
    categoryStats.forEach(stat => {
      categoryCounts[stat._id] = stat.count;
    });
    
    const priorityCounts = { low: 0, medium: 0, high: 0, urgent: 0 };
    priorityStats.forEach(stat => {
      priorityCounts[stat._id] = stat.count;
    });
    
    // Get total count
    const total = await Grievance.countDocuments(filter);
    
    // Get average resolution time for resolved grievances
    const resolvedGrievances = await Grievance.find({
      ...filter,
      status: 'resolved',
      resolvedAt: { $exists: true }
    });
    
    let avgResolutionTimeHours = 0;
    if (resolvedGrievances.length > 0) {
      const totalResolutionTime = resolvedGrievances.reduce((sum, grievance) => {
        const createdTime = new Date(grievance.createdAt).getTime();
        const resolvedTime = new Date(grievance.resolvedAt).getTime();
        return sum + (resolvedTime - createdTime);
      }, 0);
      
      // Convert to hours
      avgResolutionTimeHours = Math.round((totalResolutionTime / resolvedGrievances.length) / (1000 * 60 * 60));
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        total,
        statusCounts,
        categoryCounts,
        priorityCounts,
        avgResolutionTimeHours
      },
    });
  } catch (error) {
    console.error('Get grievance stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve grievance statistics',
      error: error.message,
    });
  }
}; 
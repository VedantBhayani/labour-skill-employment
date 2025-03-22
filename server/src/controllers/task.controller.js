const Task = require('../models/task.model');
const User = require('../models/user.model');

/**
 * Get all tasks
 * @route GET /api/tasks
 */
exports.getAllTasks = async (req, res) => {
  try {
    // Base filter
    const filter = {};
    
    // Add filters based on query parameters
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.priority) {
      filter.priority = req.query.priority;
    }
    
    if (req.query.department) {
      filter.department = req.query.department;
    }
    
    if (req.query.assignedTo) {
      filter.assignedTo = req.query.assignedTo;
    }
    
    if (req.query.createdBy) {
      filter.createdBy = req.query.createdBy;
    }
    
    // For non-admin users, only show tasks they created or are assigned to
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      filter.$or = [
        { assignedTo: req.user._id },
        { createdBy: req.user._id }
      ];
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    // Query for tasks
    const tasks = await Task.find(filter)
      .skip(skip)
      .limit(limit)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name')
      .populate('department', 'name')
      .sort({ createdAt: -1 });
    
    // Get total count for pagination
    const total = await Task.countDocuments(filter);
    
    res.status(200).json({
      status: 'success',
      results: tasks.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
      data: {
        tasks,
      },
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve tasks',
      error: error.message,
    });
  }
};

/**
 * Get task by ID
 * @route GET /api/tasks/:id
 */
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email position')
      .populate('createdBy', 'name email')
      .populate('department', 'name')
      .populate('dependencies', 'title status');
    
    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found',
      });
    }
    
    // Restrict access to task details for regular employees
    if (req.user.role === 'employee' && 
        task.assignedTo?._id.toString() !== req.user._id.toString() && 
        task.createdBy?._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to view this task',
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        task,
      },
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve task',
      error: error.message,
    });
  }
};

/**
 * Create a new task
 * @route POST /api/tasks
 */
exports.createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      assignedTo,
      department,
      dependencies,
      attachments,
      skills
    } = req.body;
    
    // Create new task
    const task = await Task.create({
      title,
      description,
      status: status || 'pending',
      priority: priority || 'medium',
      dueDate,
      assignedTo,
      department,
      dependencies,
      attachments,
      skills,
      createdBy: req.user._id,
    });
    
    // Populate created task
    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name')
      .populate('department', 'name');
    
    res.status(201).json({
      status: 'success',
      data: {
        task: populatedTask,
      },
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create task',
      error: error.message,
    });
  }
};

/**
 * Update a task
 * @route PATCH /api/tasks/:id
 */
exports.updateTask = async (req, res) => {
  try {
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      assignedTo,
      department,
      dependencies,
      attachments,
      skills,
      completionNotes
    } = req.body;
    
    // Find task first to check permissions
    const existingTask = await Task.findById(req.params.id);
    
    if (!existingTask) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found',
      });
    }
    
    // Check permissions
    const isCreator = existingTask.createdBy.toString() === req.user._id.toString();
    const isAssignee = existingTask.assignedTo && 
                      existingTask.assignedTo.toString() === req.user._id.toString();
    const canModifyAll = req.user.role === 'admin' || req.user.role === 'manager';
    
    // Employees can only update task status, completion notes if assigned to them
    if (req.user.role === 'employee' && !isAssignee && !isCreator) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to modify this task',
      });
    }
    
    // Build update object based on permissions
    const updateData = {};
    
    // Everyone assigned to a task can update these fields
    if (isAssignee || isCreator || canModifyAll) {
      if (status) updateData.status = status;
      if (completionNotes) updateData.completionNotes = completionNotes;
    }
    
    // Only creators and admins/managers can update these fields
    if (isCreator || canModifyAll) {
      if (title) updateData.title = title;
      if (description) updateData.description = description;
      if (priority) updateData.priority = priority;
      if (dueDate) updateData.dueDate = dueDate;
      if (assignedTo) updateData.assignedTo = assignedTo;
      if (department) updateData.department = department;
      if (dependencies) updateData.dependencies = dependencies;
      if (attachments) updateData.attachments = attachments;
      if (skills) updateData.skills = skills;
    }
    
    // Add updater info
    updateData.updatedBy = req.user._id;
    updateData.updatedAt = Date.now();
    
    // If status is changed to "completed", add completion date
    if (status === 'completed' && existingTask.status !== 'completed') {
      updateData.completedAt = Date.now();
    }
    
    // Update task
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name')
      .populate('department', 'name');
    
    res.status(200).json({
      status: 'success',
      data: {
        task,
      },
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update task',
      error: error.message,
    });
  }
};

/**
 * Delete a task
 * @route DELETE /api/tasks/:id
 */
exports.deleteTask = async (req, res) => {
  try {
    // Find task first to check permissions
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found',
      });
    }
    
    // Only task creator, managers, or admins can delete tasks
    const isCreator = task.createdBy.toString() === req.user._id.toString();
    if (!isCreator && req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to delete this task',
      });
    }
    
    // Check for dependencies
    const dependentTasks = await Task.countDocuments({
      dependencies: req.params.id,
    });
    
    if (dependentTasks > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete task because other tasks depend on it. Remove dependencies first.',
      });
    }
    
    // Delete task
    await Task.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      status: 'success',
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete task',
      error: error.message,
    });
  }
};

/**
 * Get user's assigned tasks
 * @route GET /api/tasks/assigned
 */
exports.getAssignedTasks = async (req, res) => {
  try {
    // Filter for tasks assigned to the user
    const filter = { assignedTo: req.user._id };
    
    // Add status filter if provided
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    // Query for assigned tasks
    const tasks = await Task.find(filter)
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name')
      .populate('department', 'name')
      .sort({ dueDate: 1, priority: -1 });
    
    // Get total count for pagination
    const total = await Task.countDocuments(filter);
    
    res.status(200).json({
      status: 'success',
      results: tasks.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
      data: {
        tasks,
      },
    });
  } catch (error) {
    console.error('Get assigned tasks error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve assigned tasks',
      error: error.message,
    });
  }
};

/**
 * Get tasks statistics
 * @route GET /api/tasks/stats
 */
exports.getTaskStats = async (req, res) => {
  try {
    let filter = {};
    
    // For non-admin/manager users, only count tasks they created or are assigned to
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      filter = {
        $or: [
          { assignedTo: req.user._id },
          { createdBy: req.user._id }
        ]
      };
    }
    
    // If department filter is provided
    if (req.query.department) {
      filter.department = req.query.department;
    }
    
    // Count tasks by status
    const statusStats = await Task.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    // Count tasks by priority
    const priorityStats = await Task.aggregate([
      { $match: filter },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    // Transform aggregation result for easier consumption
    const statusCounts = { pending: 0, 'in-progress': 0, completed: 0, cancelled: 0 };
    statusStats.forEach(stat => {
      statusCounts[stat._id] = stat.count;
    });
    
    const priorityCounts = { low: 0, medium: 0, high: 0, urgent: 0 };
    priorityStats.forEach(stat => {
      priorityCounts[stat._id] = stat.count;
    });
    
    // Get total count
    const total = await Task.countDocuments(filter);
    
    // Get overdue tasks (due date in past, status not completed/cancelled)
    const overdue = await Task.countDocuments({
      ...filter,
      dueDate: { $lt: new Date() },
      status: { $nin: ['completed', 'cancelled'] }
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        total,
        overdue,
        statusCounts,
        priorityCounts
      },
    });
  } catch (error) {
    console.error('Get task stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve task statistics',
      error: error.message,
    });
  }
}; 
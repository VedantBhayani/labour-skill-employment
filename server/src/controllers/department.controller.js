const Department = require('../models/department.model');
const User = require('../models/user.model');

/**
 * Get all departments
 * @route GET /api/departments
 */
exports.getAllDepartments = async (req, res) => {
  try {
    // Filtering
    const filter = {};
    
    if (req.query.parentDepartment) {
      filter.parentDepartment = req.query.parentDepartment === 'null' ? 
        null : req.query.parentDepartment;
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    // Query for departments with population
    const departments = await Department.find(filter)
      .skip(skip)
      .limit(limit)
      .populate('head', 'name email')
      .populate('parentDepartment', 'name')
      .sort({ name: 1 });
    
    // Get total count for pagination
    const total = await Department.countDocuments(filter);
    
    res.status(200).json({
      status: 'success',
      results: departments.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
      data: {
        departments,
      },
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve departments',
      error: error.message,
    });
  }
};

/**
 * Get department by ID
 * @route GET /api/departments/:id
 */
exports.getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('head', 'name email position')
      .populate('parentDepartment', 'name');
    
    if (!department) {
      return res.status(404).json({
        status: 'error',
        message: 'Department not found',
      });
    }
    
    // Find subdepartments
    const subdepartments = await Department.find({ 
      parentDepartment: department._id 
    }).select('name');
    
    // Find members (users in this department)
    const members = await User.find({ 
      department: department._id,
      isActive: true
    }).select('name email role position');
    
    res.status(200).json({
      status: 'success',
      data: {
        department,
        subdepartments,
        members,
      },
    });
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve department',
      error: error.message,
    });
  }
};

/**
 * Create a new department
 * @route POST /api/departments
 */
exports.createDepartment = async (req, res) => {
  try {
    const { name, description, head, parentDepartment, budget, location } = req.body;
    
    // Check if department name already exists
    const existingDepartment = await Department.findOne({ name });
    if (existingDepartment) {
      return res.status(400).json({
        status: 'error',
        message: 'Department with this name already exists',
      });
    }
    
    // Create new department
    const department = await Department.create({
      name,
      description,
      head,
      parentDepartment,
      budget,
      location,
      createdBy: req.user._id,
    });
    
    // If head is assigned, update the user's role to manager if not already admin
    if (head) {
      const user = await User.findById(head);
      if (user && user.role !== 'admin') {
        await User.findByIdAndUpdate(head, { role: 'manager' });
      }
    }
    
    res.status(201).json({
      status: 'success',
      data: {
        department,
      },
    });
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create department',
      error: error.message,
    });
  }
};

/**
 * Update a department
 * @route PATCH /api/departments/:id
 */
exports.updateDepartment = async (req, res) => {
  try {
    const { name, description, head, parentDepartment, budget, location } = req.body;
    
    // Check if department exists
    const existingDepartment = await Department.findById(req.params.id);
    if (!existingDepartment) {
      return res.status(404).json({
        status: 'error',
        message: 'Department not found',
      });
    }
    
    // If name is being changed, check for duplicates
    if (name && name !== existingDepartment.name) {
      const duplicateName = await Department.findOne({ 
        name, 
        _id: { $ne: req.params.id } 
      });
      
      if (duplicateName) {
        return res.status(400).json({
          status: 'error',
          message: 'Department with this name already exists',
        });
      }
    }
    
    // Update department
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        head,
        parentDepartment,
        budget,
        location,
        updatedBy: req.user._id,
        updatedAt: Date.now(),
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate('head', 'name email')
     .populate('parentDepartment', 'name');
    
    // If head is changed, update the user's role
    if (head && existingDepartment.head && head.toString() !== existingDepartment.head.toString()) {
      // Set new head to manager role if not admin
      const newHead = await User.findById(head);
      if (newHead && newHead.role !== 'admin') {
        await User.findByIdAndUpdate(head, { role: 'manager' });
      }
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        department,
      },
    });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update department',
      error: error.message,
    });
  }
};

/**
 * Delete a department
 * @route DELETE /api/departments/:id
 */
exports.deleteDepartment = async (req, res) => {
  try {
    // Check for users in this department
    const usersInDepartment = await User.countDocuments({ 
      department: req.params.id,
      isActive: true 
    });
    
    if (usersInDepartment > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete department with active users. Reassign users first.',
      });
    }
    
    // Check for subdepartments
    const subdepartments = await Department.countDocuments({ 
      parentDepartment: req.params.id 
    });
    
    if (subdepartments > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete department with subdepartments. Delete or reassign subdepartments first.',
      });
    }
    
    // Delete department
    const department = await Department.findByIdAndDelete(req.params.id);
    
    if (!department) {
      return res.status(404).json({
        status: 'error',
        message: 'Department not found',
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Department deleted successfully',
    });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete department',
      error: error.message,
    });
  }
};

/**
 * Get department hierarchy
 * @route GET /api/departments/hierarchy
 */
exports.getDepartmentHierarchy = async (req, res) => {
  try {
    // Get all departments
    const allDepartments = await Department.find()
      .populate('head', 'name')
      .lean();
    
    // Build hierarchical structure
    const departmentsMap = {};
    const hierarchy = [];
    
    // First pass: create map of id -> department
    allDepartments.forEach(dept => {
      departmentsMap[dept._id] = { 
        ...dept, 
        children: [] 
      };
    });
    
    // Second pass: build hierarchy
    allDepartments.forEach(dept => {
      if (dept.parentDepartment) {
        // Add this department as a child of its parent
        const parentDept = departmentsMap[dept.parentDepartment];
        if (parentDept) {
          parentDept.children.push(departmentsMap[dept._id]);
        } else {
          hierarchy.push(departmentsMap[dept._id]);
        }
      } else {
        // Top-level department
        hierarchy.push(departmentsMap[dept._id]);
      }
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        hierarchy,
      },
    });
  } catch (error) {
    console.error('Get department hierarchy error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve department hierarchy',
      error: error.message,
    });
  }
}; 
const User = require('../models/user.model');

/**
 * Get all users
 * @route GET /api/users
 */
exports.getAllUsers = async (req, res) => {
  try {
    // Filtering
    const filter = { isActive: true };
    
    if (req.query.department) {
      filter.department = req.query.department;
    }
    
    if (req.query.role) {
      filter.role = req.query.role;
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    // Query for users
    const users = await User.find(filter)
      .select('-refreshToken')
      .skip(skip)
      .limit(limit)
      .populate('department', 'name')
      .sort({ createdAt: -1 });
    
    // Get total count for pagination
    const total = await User.countDocuments(filter);
    
    res.status(200).json({
      status: 'success',
      results: users.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
      data: {
        users,
      },
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve users',
      error: error.message,
    });
  }
};

/**
 * Get user by ID
 * @route GET /api/users/:id
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-refreshToken')
      .populate('department', 'name');
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve user',
      error: error.message,
    });
  }
};

/**
 * Create a new user
 * @route POST /api/users
 */
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, department, position, skills, bio } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email already exists',
      });
    }
    
    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'employee',
      department,
      position,
      skills,
      bio,
    });
    
    // Remove password from response
    user.password = undefined;
    user.refreshToken = undefined;
    
    res.status(201).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create user',
      error: error.message,
    });
  }
};

/**
 * Update a user
 * @route PATCH /api/users/:id
 */
exports.updateUser = async (req, res) => {
  try {
    // Get update data
    const { name, role, department, position, skills, bio, phone, address, isActive } = req.body;
    
    // Prevent updating email and password in this route
    if (req.body.email) {
      return res.status(400).json({
        status: 'error',
        message: 'Email cannot be updated through this route',
      });
    }
    
    if (req.body.password) {
      return res.status(400).json({
        status: 'error',
        message: 'Password cannot be updated through this route',
      });
    }
    
    // Find and update user
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        name,
        role,
        department,
        position,
        skills,
        bio,
        phone,
        address,
        isActive,
      },
      {
        new: true, // Return updated document
        runValidators: true, // Run model validators on update
      }
    ).select('-refreshToken');
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update user',
      error: error.message,
    });
  }
};

/**
 * Delete a user (soft delete)
 * @route DELETE /api/users/:id
 */
exports.deleteUser = async (req, res) => {
  try {
    // Soft delete - only mark as inactive
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete user',
      error: error.message,
    });
  }
};

/**
 * Get user profile of the authenticated user
 * @route GET /api/users/profile
 */
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-refreshToken')
      .populate('department', 'name');
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve profile',
      error: error.message,
    });
  }
};

/**
 * Update profile of the authenticated user
 * @route PATCH /api/users/profile
 */
exports.updateProfile = async (req, res) => {
  try {
    // Get update data
    const { name, bio, phone, address, skills } = req.body;
    
    // Prevent updating sensitive fields in this route
    if (req.body.email || req.body.password || req.body.role) {
      return res.status(400).json({
        status: 'error',
        message: 'Email, password, and role cannot be updated through this route',
      });
    }
    
    // Find and update user
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        name,
        bio,
        phone,
        address,
        skills,
      },
      {
        new: true,
        runValidators: true,
      }
    ).select('-refreshToken');
    
    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update profile',
      error: error.message,
    });
  }
}; 
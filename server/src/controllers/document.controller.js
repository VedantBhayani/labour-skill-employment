const Document = require('../models/document.model');
const User = require('../models/user.model');
const path = require('path');
const fs = require('fs');
const util = require('util');
const mkdir = util.promisify(fs.mkdir);

/**
 * Get all documents
 * @route GET /api/documents
 */
exports.getAllDocuments = async (req, res) => {
  try {
    // Base filter - exclude private documents that don't belong to the user
    let filter = {
      $or: [
        { isPrivate: false },
        { creator: req.user._id }
      ]
    };
    
    // Add additional filters based on query parameters
    if (req.query.department) {
      filter.department = req.query.department;
    }
    
    if (req.query.creator) {
      filter.creator = req.query.creator;
    }
    
    if (req.query.fileType) {
      filter.fileType = req.query.fileType;
    }
    
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex }
      ];
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    // Query for documents
    const documents = await Document.find(filter)
      .skip(skip)
      .limit(limit)
      .populate('creator', 'name email')
      .populate('department', 'name')
      .sort({ createdAt: -1 });
    
    // Get total count for pagination
    const total = await Document.countDocuments(filter);
    
    res.status(200).json({
      status: 'success',
      results: documents.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
      data: {
        documents,
      },
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve documents',
      error: error.message,
    });
  }
};

/**
 * Get document by ID
 * @route GET /api/documents/:id
 */
exports.getDocumentById = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('creator', 'name email')
      .populate('department', 'name')
      .populate('sharedWith', 'name email');
    
    if (!document) {
      return res.status(404).json({
        status: 'error',
        message: 'Document not found',
      });
    }
    
    // Check access permission
    const hasAccess = 
      !document.isPrivate || 
      document.creator._id.toString() === req.user._id.toString() ||
      document.sharedWith.some(user => user._id.toString() === req.user._id.toString());
    
    if (!hasAccess) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to access this document',
      });
    }
    
    // Record document view if not the creator
    if (document.creator._id.toString() !== req.user._id.toString()) {
      document.views += 1;
      document.viewedBy.push({
        user: req.user._id,
        viewedAt: Date.now()
      });
      await document.save();
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        document,
      },
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve document',
      error: error.message,
    });
  }
};

/**
 * Create a new document
 * @route POST /api/documents
 */
exports.createDocument = async (req, res) => {
  try {
    const {
      title,
      description,
      fileType,
      fileUrl,
      isPrivate,
      department,
      tags,
      sharedWith
    } = req.body;
    
    // Create new document
    const document = await Document.create({
      title,
      description,
      fileType,
      fileUrl,
      isPrivate: isPrivate || false,
      department,
      tags,
      sharedWith,
      creator: req.user._id,
    });
    
    // Populate created document
    const populatedDocument = await Document.findById(document._id)
      .populate('creator', 'name email')
      .populate('department', 'name');
    
    res.status(201).json({
      status: 'success',
      data: {
        document: populatedDocument,
      },
    });
  } catch (error) {
    console.error('Create document error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create document',
      error: error.message,
    });
  }
};

/**
 * Update a document
 * @route PATCH /api/documents/:id
 */
exports.updateDocument = async (req, res) => {
  try {
    const {
      title,
      description,
      fileType,
      fileUrl,
      isPrivate,
      department,
      tags,
      sharedWith
    } = req.body;
    
    // Find document first to check permissions
    const existingDocument = await Document.findById(req.params.id);
    
    if (!existingDocument) {
      return res.status(404).json({
        status: 'error',
        message: 'Document not found',
      });
    }
    
    // Check if user is the creator or an admin
    const isCreator = existingDocument.creator.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to update this document',
      });
    }
    
    // Update document
    const document = await Document.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        fileType,
        fileUrl,
        isPrivate,
        department,
        tags,
        sharedWith,
        updatedBy: req.user._id,
        updatedAt: Date.now(),
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('creator', 'name email')
      .populate('department', 'name')
      .populate('sharedWith', 'name email');
    
    res.status(200).json({
      status: 'success',
      data: {
        document,
      },
    });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update document',
      error: error.message,
    });
  }
};

/**
 * Delete a document
 * @route DELETE /api/documents/:id
 */
exports.deleteDocument = async (req, res) => {
  try {
    // Find document first to check permissions
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({
        status: 'error',
        message: 'Document not found',
      });
    }
    
    // Check if user is the creator or an admin
    const isCreator = document.creator.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to delete this document',
      });
    }
    
    // Delete document
    await Document.findByIdAndDelete(req.params.id);
    
    // TODO: If file storage is implemented, also delete the file from storage
    
    res.status(200).json({
      status: 'success',
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete document',
      error: error.message,
    });
  }
};

/**
 * Share document with users
 * @route POST /api/documents/:id/share
 */
exports.shareDocument = async (req, res) => {
  try {
    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide at least one valid user ID',
      });
    }
    
    // Find document first to check permissions
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({
        status: 'error',
        message: 'Document not found',
      });
    }
    
    // Check if user is the creator, admin, or already shared with
    const isCreator = document.creator.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to share this document',
      });
    }
    
    // Verify that all userIds exist
    const users = await User.find({
      _id: { $in: userIds },
      isActive: true
    });
    
    if (users.length !== userIds.length) {
      return res.status(400).json({
        status: 'error',
        message: 'One or more user IDs are invalid or inactive',
      });
    }
    
    // Add users to sharedWith list
    const updatedSharedWith = [...new Set([
      ...document.sharedWith.map(id => id.toString()),
      ...userIds
    ])];
    
    // Update document
    const updatedDocument = await Document.findByIdAndUpdate(
      req.params.id,
      {
        sharedWith: updatedSharedWith,
        updatedBy: req.user._id,
        updatedAt: Date.now(),
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('creator', 'name email')
      .populate('sharedWith', 'name email');
    
    res.status(200).json({
      status: 'success',
      data: {
        document: updatedDocument,
      },
    });
  } catch (error) {
    console.error('Share document error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to share document',
      error: error.message,
    });
  }
};

/**
 * Get document stats
 * @route GET /api/documents/stats
 */
exports.getDocumentStats = async (req, res) => {
  try {
    // Base filter depending on user role
    let filter = {};
    
    if (req.user.role !== 'admin') {
      filter = {
        $or: [
          { isPrivate: false },
          { creator: req.user._id },
          { sharedWith: req.user._id }
        ]
      };
    }
    
    // Count documents by type
    const fileTypeStats = await Document.aggregate([
      { $match: filter },
      { $group: { _id: '$fileType', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    // Count total documents
    const total = await Document.countDocuments(filter);
    
    // Count documents created by user
    const createdByUser = await Document.countDocuments({
      creator: req.user._id
    });
    
    // Count documents shared with user
    const sharedWithUser = await Document.countDocuments({
      sharedWith: req.user._id,
      creator: { $ne: req.user._id }
    });
    
    // Transform aggregation result for easier consumption
    const fileTypeCounts = {};
    fileTypeStats.forEach(stat => {
      fileTypeCounts[stat._id] = stat.count;
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        total,
        createdByUser,
        sharedWithUser,
        fileTypeCounts
      },
    });
  } catch (error) {
    console.error('Get document stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve document statistics',
      error: error.message,
    });
  }
}; 
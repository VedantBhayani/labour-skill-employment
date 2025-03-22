const ForumTopic = require('../models/forumTopic.model');
const ForumPost = require('../models/forumPost.model');
const User = require('../models/user.model');
const Department = require('../models/department.model');
const Notification = require('../models/notification.model');
const AuditLog = require('../models/auditLog.model');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');
const { sendNotificationToUser } = require('../services/socket.service');

// Configure file upload for forum post attachments
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../', config.uploadPath, 'forum-attachments');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'forum-' + uniqueSuffix + ext);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Accept images, documents
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not supported'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max size
  }
});

// Export upload middleware
exports.uploadAttachments = upload.array('attachments', 3); // Allow up to 3 attachments

// ======== FORUM TOPIC CONTROLLERS ========

// Get all forum topics
exports.getAllTopics = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const departmentId = req.query.department;
    const tag = req.query.tag;
    const searchQuery = req.query.search;
    
    const query = {};
    
    // Filter by department if provided
    if (departmentId && mongoose.Types.ObjectId.isValid(departmentId)) {
      query.department = departmentId;
    }
    
    // Filter by tag if provided
    if (tag) {
      query.tags = tag;
    }
    
    // Search in title and description
    if (searchQuery) {
      query.$or = [
        { title: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } }
      ];
    }
    
    // Only show topics that the user has access to
    // Filter private topics if not admin
    if (req.user.role !== 'admin') {
      const departmentIds = req.user.department ? [req.user.department] : [];
      
      // Combine with existing query using $and
      const accessQuery = {
        $or: [
          { isPrivate: false }, // Public topics
          {
            isPrivate: true,
            $or: [
              // User belongs to department with access
              { 'accessControl.departments': { $in: departmentIds } },
              // User has the required role
              { 'accessControl.roles': req.user.role }
            ]
          }
        ]
      };
      
      query.$and = query.$and ? [...query.$and, accessQuery.$or] : [accessQuery.$or];
    }
    
    const options = {
      page,
      limit,
      sort: { pinned: -1, lastActivity: -1 }, // Pinned first, then by last activity
      populate: [
        { path: 'creator', select: 'name email avatar' },
        { path: 'department', select: 'name' },
        { path: 'lastPost.user', select: 'name avatar' }
      ]
    };
    
    const topics = await ForumTopic.paginate(query, options);
    
    // Get available tags for filtering
    const availableTags = await ForumTopic.aggregate([
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);
    
    // Get department list for filtering
    const departments = await Department.find({}, 'name');
    
    res.status(200).json({
      status: 'success',
      data: {
        ...topics,
        filters: {
          tags: availableTags.map(tag => ({ name: tag._id, count: tag.count })),
          departments
        }
      }
    });
  } catch (error) {
    console.error('Error getting forum topics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get forum topics'
    });
  }
};

// Get single forum topic with posts
exports.getTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(topicId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid topic ID'
      });
    }
    
    const topic = await ForumTopic.findById(topicId)
      .populate('creator', 'name email avatar')
      .populate('department', 'name')
      .populate('lastPost.user', 'name avatar');
    
    if (!topic) {
      return res.status(404).json({
        status: 'error',
        message: 'Topic not found'
      });
    }
    
    // Check if user has access to this topic
    if (!topic.canAccess(req.user)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to view this topic'
      });
    }
    
    // Get page and limit from query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    // Get posts for this topic (root posts only, no replies)
    const postsQuery = { 
      topic: topicId,
      isReply: false
    };
    
    const postsOptions = {
      page,
      limit,
      sort: { isPinned: -1, createdAt: 1 }, // Pinned first, then oldest first
      populate: [
        { path: 'author', select: 'name email avatar role' }
      ]
    };
    
    const posts = await ForumPost.paginate(postsQuery, postsOptions);
    
    // Get replies for all loaded posts in a single query
    const postIds = posts.docs.map(post => post._id);
    const replies = await ForumPost.find({ 
      parentPost: { $in: postIds },
      isReply: true
    })
      .sort({ createdAt: 1 })
      .populate('author', 'name email avatar role');
    
    // Group replies by parent post
    const repliesByParent = {};
    replies.forEach(reply => {
      const parentId = reply.parentPost.toString();
      if (!repliesByParent[parentId]) {
        repliesByParent[parentId] = [];
      }
      repliesByParent[parentId].push(reply);
    });
    
    // Add replies to their parent posts
    posts.docs = posts.docs.map(post => {
      const postObj = post.toObject();
      postObj.replies = repliesByParent[post._id.toString()] || [];
      return postObj;
    });
    
    // Increment view count
    await topic.incrementViewCount();
    
    // Log access
    await AuditLog.create({
      user: req.user._id,
      action: 'VIEW',
      entity: 'ForumTopic',
      entityId: topic._id,
      details: {
        topicTitle: topic.title
      }
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        topic,
        posts
      }
    });
    
  } catch (error) {
    console.error('Error getting forum topic:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get forum topic'
    });
  }
};

// Create new forum topic
exports.createTopic = async (req, res) => {
  try {
    const {
      title,
      description,
      department,
      tags,
      isPrivate,
      accessControl
    } = req.body;
    
    // Basic validation
    if (!title || !description) {
      return res.status(400).json({
        status: 'error',
        message: 'Title and description are required'
      });
    }
    
    // Check if department exists if provided
    if (department && mongoose.Types.ObjectId.isValid(department)) {
      const deptExists = await Department.exists({ _id: department });
      if (!deptExists) {
        return res.status(400).json({
          status: 'error',
          message: 'Department not found'
        });
      }
    }
    
    // Process tags
    let processedTags = [];
    if (tags) {
      if (Array.isArray(tags)) {
        processedTags = tags.map(tag => tag.trim()).filter(tag => tag.length > 0);
      } else if (typeof tags === 'string') {
        processedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      }
    }
    
    // Create new topic
    const newTopic = new ForumTopic({
      title,
      description,
      creator: req.user._id,
      department: department || null,
      tags: processedTags,
      isPrivate: isPrivate === true,
      accessControl: accessControl || {}
    });
    
    await newTopic.save();
    
    // Populate creator and department info
    await newTopic.populate('creator', 'name email avatar');
    if (newTopic.department) {
      await newTopic.populate('department', 'name');
    }
    
    // Create audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'CREATE',
      entity: 'ForumTopic',
      entityId: newTopic._id,
      details: {
        title: newTopic.title,
        isPrivate: newTopic.isPrivate
      }
    });
    
    // Notify department members if topic is associated with a department
    if (newTopic.department) {
      const departmentUsers = await User.find({ department: newTopic.department }, '_id');
      
      for (const user of departmentUsers) {
        // Skip creator
        if (user._id.toString() === req.user._id.toString()) continue;
        
        const notification = new Notification({
          recipient: user._id,
          sender: req.user._id,
          type: 'FORUM_POST',
          title: 'New Forum Topic',
          content: `${req.user.name} created a new topic in your department: "${newTopic.title}"`,
          data: {
            entityId: newTopic._id,
            entityType: 'ForumTopic',
            metadata: {
              topicTitle: newTopic.title,
              departmentName: newTopic.department.name
            }
          }
        });
        
        await notification.save();
        
        // Send real-time notification if socket service is available
        if (global.io) {
          await sendNotificationToUser(user._id.toString(), notification);
        }
      }
    }
    
    res.status(201).json({
      status: 'success',
      data: {
        topic: newTopic
      }
    });
  } catch (error) {
    console.error('Error creating forum topic:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create forum topic'
    });
  }
};

// Update forum topic
exports.updateTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    const {
      title,
      description,
      department,
      tags,
      isPrivate,
      accessControl,
      pinned,
      locked
    } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(topicId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid topic ID'
      });
    }
    
    const topic = await ForumTopic.findById(topicId);
    
    if (!topic) {
      return res.status(404).json({
        status: 'error',
        message: 'Topic not found'
      });
    }
    
    // Check permissions
    const isAdmin = req.user.role === 'admin';
    const isCreator = topic.creator.toString() === req.user._id.toString();
    const isManager = req.user.role === 'manager';
    
    if (!isAdmin && !isCreator && !isManager) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to update this topic'
      });
    }
    
    // Regular users and managers can only update their own topics
    // Only admins can pin/unpin or lock/unlock topics
    
    if (title) topic.title = title;
    if (description) topic.description = description;
    
    // Only creator or admin can change these properties
    if (isAdmin || isCreator) {
      if (department !== undefined) {
        // Check if department exists if provided
        if (department && mongoose.Types.ObjectId.isValid(department)) {
          const deptExists = await Department.exists({ _id: department });
          if (!deptExists) {
            return res.status(400).json({
              status: 'error',
              message: 'Department not found'
            });
          }
          topic.department = department;
        } else if (department === null) {
          topic.department = null;
        }
      }
      
      // Process tags
      if (tags !== undefined) {
        let processedTags = [];
        if (Array.isArray(tags)) {
          processedTags = tags.map(tag => tag.trim()).filter(tag => tag.length > 0);
        } else if (typeof tags === 'string') {
          processedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        }
        topic.tags = processedTags;
      }
      
      if (isPrivate !== undefined) topic.isPrivate = isPrivate === true;
      if (accessControl) topic.accessControl = accessControl;
    }
    
    // Only admins can pin or lock topics
    if (isAdmin) {
      if (pinned !== undefined) topic.pinned = pinned === true;
      if (locked !== undefined) topic.locked = locked === true;
    }
    
    await topic.save();
    
    // Populate related fields
    await topic.populate('creator', 'name email avatar');
    if (topic.department) {
      await topic.populate('department', 'name');
    }
    if (topic.lastPost && topic.lastPost.user) {
      await topic.populate('lastPost.user', 'name avatar');
    }
    
    // Create audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'UPDATE',
      entity: 'ForumTopic',
      entityId: topic._id,
      details: {
        title: topic.title,
        isPrivate: topic.isPrivate,
        pinned: topic.pinned,
        locked: topic.locked
      }
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        topic
      }
    });
  } catch (error) {
    console.error('Error updating forum topic:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update forum topic'
    });
  }
};

// Delete forum topic
exports.deleteTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(topicId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid topic ID'
      });
    }
    
    const topic = await ForumTopic.findById(topicId);
    
    if (!topic) {
      return res.status(404).json({
        status: 'error',
        message: 'Topic not found'
      });
    }
    
    // Check permissions
    const isAdmin = req.user.role === 'admin';
    const isCreator = topic.creator.toString() === req.user._id.toString();
    
    if (!isAdmin && !isCreator) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to delete this topic'
      });
    }
    
    // Find all posts in the topic to handle attachments
    const posts = await ForumPost.find({ topic: topicId });
    
    // Delete attachments for all posts
    for (const post of posts) {
      if (post.attachments && post.attachments.length > 0) {
        post.attachments.forEach(attachment => {
          try {
            const filePath = path.join(__dirname, '../../', attachment.path);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          } catch (err) {
            console.error('Error deleting attachment:', err);
            // Continue even if attachment deletion fails
          }
        });
      }
    }
    
    // Delete all posts in the topic
    await ForumPost.deleteMany({ topic: topicId });
    
    // Delete the topic
    await topic.deleteOne();
    
    // Create audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'DELETE',
      entity: 'ForumTopic',
      entityId: topicId,
      details: {
        title: topic.title
      }
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Topic and all associated posts deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting forum topic:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete forum topic'
    });
  }
};

// ======== FORUM POST CONTROLLERS ========

// Create a new post in a topic
exports.createPost = async (req, res) => {
  try {
    const { topicId } = req.params;
    const { content, parentPostId } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(topicId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid topic ID'
      });
    }
    
    if (!content || content.trim() === '') {
      return res.status(400).json({
        status: 'error',
        message: 'Post content cannot be empty'
      });
    }
    
    const topic = await ForumTopic.findById(topicId);
    
    if (!topic) {
      return res.status(404).json({
        status: 'error',
        message: 'Topic not found'
      });
    }
    
    // Check if topic is locked
    if (topic.locked && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'This topic is locked and cannot receive new posts'
      });
    }
    
    // Check if user has access to post in this topic
    if (!topic.canAccess(req.user)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to post in this topic'
      });
    }
    
    // Check if this is a reply to an existing post
    let parentPost = null;
    let isReply = false;
    
    if (parentPostId && mongoose.Types.ObjectId.isValid(parentPostId)) {
      parentPost = await ForumPost.findById(parentPostId);
      
      if (!parentPost) {
        return res.status(404).json({
          status: 'error',
          message: 'Parent post not found'
        });
      }
      
      // Make sure parent post is in the same topic
      if (parentPost.topic.toString() !== topicId) {
        return res.status(400).json({
          status: 'error',
          message: 'Parent post must be in the same topic'
        });
      }
      
      isReply = true;
    }
    
    // Prepare attachments if any from request
    const attachments = req.files?.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: `/uploads/forum-attachments/${file.filename}`,
      mimeType: file.mimetype,
      size: file.size
    })) || [];
    
    // Create new post
    const newPost = new ForumPost({
      topic: topicId,
      content,
      author: req.user._id,
      attachments,
      parentPost: parentPost ? parentPost._id : null,
      isReply
    });
    
    await newPost.save();
    
    // Populate author details
    await newPost.populate('author', 'name email avatar role');
    
    // Update topic's last activity and post count
    await topic.updateActivity(newPost, req.user);
    
    // If this is a reply, increment parent post's reply count
    if (parentPost) {
      await parentPost.incrementReplyCount();
    }
    
    // Create audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'CREATE',
      entity: 'ForumPost',
      entityId: newPost._id,
      details: {
        topicId: topic._id,
        topicTitle: topic.title,
        isReply
      }
    });
    
    // Process mentions and send notifications
    const mentionedUsers = newPost.mentions;
    
    if (mentionedUsers && mentionedUsers.length > 0) {
      for (const userId of mentionedUsers) {
        // Skip self-mentions
        if (userId.toString() === req.user._id.toString()) continue;
        
        const notification = new Notification({
          recipient: userId,
          sender: req.user._id,
          type: 'MENTION',
          title: 'You were mentioned in a forum post',
          content: `${req.user.name} mentioned you in a post: "${topic.title}"`,
          data: {
            entityId: newPost._id,
            entityType: 'ForumPost',
            metadata: {
              topicId: topic._id,
              topicTitle: topic.title,
              postContent: content.substring(0, 50) + (content.length > 50 ? '...' : '')
            }
          }
        });
        
        await notification.save();
        
        // Send real-time notification if socket service is available
        if (global.io) {
          await sendNotificationToUser(userId.toString(), notification);
        }
      }
    }
    
    // Notify topic creator if this is not their own post
    if (topic.creator.toString() !== req.user._id.toString()) {
      const notification = new Notification({
        recipient: topic.creator,
        sender: req.user._id,
        type: 'FORUM_POST',
        title: 'New post in your topic',
        content: `${req.user.name} posted in your topic: "${topic.title}"`,
        data: {
          entityId: newPost._id,
          entityType: 'ForumPost',
          metadata: {
            topicId: topic._id,
            topicTitle: topic.title,
            postContent: content.substring(0, 50) + (content.length > 50 ? '...' : '')
          }
        }
      });
      
      await notification.save();
      
      // Send real-time notification if socket service is available
      if (global.io) {
        await sendNotificationToUser(topic.creator.toString(), notification);
      }
    }
    
    // If this is a reply, notify the parent post author if different from current user
    if (parentPost && parentPost.author.toString() !== req.user._id.toString()) {
      const notification = new Notification({
        recipient: parentPost.author,
        sender: req.user._id,
        type: 'FORUM_REPLY',
        title: 'New reply to your post',
        content: `${req.user.name} replied to your post in "${topic.title}"`,
        data: {
          entityId: newPost._id,
          entityType: 'ForumPost',
          metadata: {
            topicId: topic._id,
            topicTitle: topic.title,
            postContent: content.substring(0, 50) + (content.length > 50 ? '...' : '')
          }
        }
      });
      
      await notification.save();
      
      // Send real-time notification if socket service is available
      if (global.io) {
        await sendNotificationToUser(parentPost.author.toString(), notification);
      }
    }
    
    // Emit real-time update to topic viewers
    if (global.io) {
      global.io.to(`forum:topic:${topicId}`).emit('forum:newPost', {
        post: newPost,
        topicId,
        isReply,
        parentPostId: parentPost ? parentPost._id : null
      });
    }
    
    res.status(201).json({
      status: 'success',
      data: {
        post: newPost
      }
    });
  } catch (error) {
    console.error('Error creating forum post:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create forum post'
    });
  }
}; 
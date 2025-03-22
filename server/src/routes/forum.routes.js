const express = require('express');
const forumController = require('../controllers/forum.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Topic routes
router.get('/topics', forumController.getAllTopics);
router.get('/topics/:topicId', forumController.getTopic);
router.post('/topics', forumController.createTopic);
router.patch('/topics/:topicId', forumController.updateTopic);
router.delete('/topics/:topicId', forumController.deleteTopic);

// Post routes
router.post('/topics/:topicId/posts', forumController.uploadAttachments, forumController.createPost);

module.exports = router; 
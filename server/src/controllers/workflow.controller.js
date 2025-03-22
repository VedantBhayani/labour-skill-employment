const Workflow = require('../models/workflow.model');
const WorkflowInstance = require('../models/workflowInstance.model');
const User = require('../models/user.model');
const Task = require('../models/task.model');
const Document = require('../models/document.model');
const AuditLog = require('../models/auditLog.model');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const config = require('../config/config');
const { sendNotificationToUser } = require('../services/socket.service');
const Notification = require('../models/notification.model');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../', config.uploadPath, 'workflow-attachments');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'wf-' + uniqueSuffix + ext);
  }
});

// File filter for attachments
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif',
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv'
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
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Get all workflow templates
exports.getWorkflowTemplates = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { category, isActive, department, search } = req.query;
    
    // Build query
    const query = { isTemplate: true };
    
    if (category) {
      query.category = category;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    if (department) {
      query.department = department;
    }
    
    // Only admins and managers can see all templates
    if (!['admin', 'manager'].includes(req.user.role)) {
      // Regular users can only see public templates or those for their department
      query.$or = [
        { creator: req.user._id },
        { department: req.user.department }
      ];
    }
    
    if (search) {
      query.$text = { $search: search };
    }
    
    const options = {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: [
        { path: 'creator', select: 'name email avatar' },
        { path: 'department', select: 'name' }
      ]
    };
    
    const workflows = await Workflow.paginate(query, options);
    
    res.status(200).json({
      status: 'success',
      data: workflows
    });
    
  } catch (error) {
    console.error('Error fetching workflow templates:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch workflow templates'
    });
  }
};

// Get a single workflow template
exports.getWorkflowTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid workflow ID'
      });
    }
    
    const workflow = await Workflow.findById(id)
      .populate('creator', 'name email avatar')
      .populate('department', 'name')
      .populate('steps.assignedUser', 'name email avatar')
      .populate('steps.assignedDepartment', 'name');
    
    if (!workflow) {
      return res.status(404).json({
        status: 'error',
        message: 'Workflow template not found'
      });
    }
    
    // Check if user has access to this workflow
    if (
      !['admin', 'manager'].includes(req.user.role) &&
      workflow.creator.toString() !== req.user._id.toString() &&
      workflow.department?.toString() !== req.user.department?.toString()
    ) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to view this workflow template'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        workflow
      }
    });
    
  } catch (error) {
    console.error('Error fetching workflow template:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch workflow template'
    });
  }
};

// Create a new workflow template
exports.createWorkflowTemplate = async (req, res) => {
  try {
    // Only admins and managers can create templates
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to create workflow templates'
      });
    }
    
    const { 
      name, description, department, category, priority, steps, tags 
    } = req.body;
    
    if (!name || !steps || !Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Name and at least one step are required'
      });
    }
    
    // Validate and clean steps data
    const validatedSteps = steps.map((step, index) => {
      if (!step.name) {
        throw new Error(`Step ${index + 1} is missing a name`);
      }
      
      // Ensure step number is sequential
      return {
        ...step,
        stepNumber: index + 1
      };
    });
    
    const workflow = new Workflow({
      name,
      description,
      creator: req.user._id,
      department: department || req.user.department,
      isActive: true,
      isTemplate: true,
      category: category || 'custom',
      priority: priority || 'medium',
      steps: validatedSteps,
      tags: tags || []
    });
    
    await workflow.save();
    
    // Create audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'create',
      entity: 'workflow',
      entityId: workflow._id,
      details: `Created workflow template: ${name}`
    });
    
    res.status(201).json({
      status: 'success',
      data: {
        workflow
      }
    });
    
  } catch (error) {
    console.error('Error creating workflow template:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to create workflow template'
    });
  }
};

// Update a workflow template
exports.updateWorkflowTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid workflow ID'
      });
    }
    
    const workflow = await Workflow.findById(id);
    
    if (!workflow) {
      return res.status(404).json({
        status: 'error',
        message: 'Workflow template not found'
      });
    }
    
    // Check permission to update
    if (
      !['admin'].includes(req.user.role) &&
      workflow.creator.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to update this workflow template'
      });
    }
    
    const { 
      name, description, department, category, 
      priority, steps, isActive, tags 
    } = req.body;
    
    // Update the workflow template
    if (name) workflow.name = name;
    if (description !== undefined) workflow.description = description;
    if (department) workflow.department = department;
    if (category) workflow.category = category;
    if (priority) workflow.priority = priority;
    if (isActive !== undefined) workflow.isActive = isActive;
    if (tags) workflow.tags = tags;
    
    // Update steps if provided
    if (steps && Array.isArray(steps)) {
      // Validate and clean steps data
      const validatedSteps = steps.map((step, index) => {
        if (!step.name) {
          throw new Error(`Step ${index + 1} is missing a name`);
        }
        
        // Ensure step number is sequential
        return {
          ...step,
          stepNumber: index + 1
        };
      });
      
      workflow.steps = validatedSteps;
    }
    
    await workflow.save();
    
    // Create audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'update',
      entity: 'workflow',
      entityId: workflow._id,
      details: `Updated workflow template: ${workflow.name}`
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        workflow
      }
    });
    
  } catch (error) {
    console.error('Error updating workflow template:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to update workflow template'
    });
  }
};

// Delete a workflow template
exports.deleteWorkflowTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid workflow ID'
      });
    }
    
    const workflow = await Workflow.findById(id);
    
    if (!workflow) {
      return res.status(404).json({
        status: 'error',
        message: 'Workflow template not found'
      });
    }
    
    // Only admins or the creator can delete
    if (
      !['admin'].includes(req.user.role) &&
      workflow.creator.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to delete this workflow template'
      });
    }
    
    // Check if the template is being used by any active workflows
    if (workflow.currentActiveWorkflows && workflow.currentActiveWorkflows.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'This workflow template is currently in use and cannot be deleted. Consider marking it as inactive instead.'
      });
    }
    
    await workflow.deleteOne();
    
    // Create audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'delete',
      entity: 'workflow',
      entityId: id,
      details: `Deleted workflow template: ${workflow.name}`
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Workflow template deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting workflow template:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete workflow template'
    });
  }
};

// Get all workflow instances for the current user
exports.getWorkflowInstances = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { status, priority, entityType, search } = req.query;
    
    // Build query
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (priority) {
      query.priority = priority;
    }
    
    if (entityType) {
      query['relatedEntity.entityType'] = entityType;
    }
    
    // Admin can see all workflows
    if (req.user.role !== 'admin') {
      // Managers can see their department's workflows and ones they're assigned to
      if (req.user.role === 'manager') {
        query.$or = [
          { initiator: req.user._id },
          { department: req.user.department },
          { 'stepsData.assignedTo': req.user._id }
        ];
      } else {
        // Regular users can only see workflows they initiated or are assigned to
        query.$or = [
          { initiator: req.user._id },
          { 'stepsData.assignedTo': req.user._id }
        ];
      }
    }
    
    if (search) {
      query.$text = { $search: search };
    }
    
    const options = {
      page,
      limit,
      sort: { updatedAt: -1 },
      populate: [
        { path: 'initiator', select: 'name email avatar' },
        { path: 'workflowTemplate', select: 'name category' },
        { path: 'department', select: 'name' },
        {
          path: 'stepsData.assignedTo',
          select: 'name email avatar',
          // Only populate for the current step to optimize
          match: (req.query.currentStepOnly === 'true') ? { 'stepsData.stepNumber': req.query.currentStep } : {}
        }
      ]
    };
    
    const workflows = await WorkflowInstance.paginate(query, options);
    
    res.status(200).json({
      status: 'success',
      data: workflows
    });
    
  } catch (error) {
    console.error('Error fetching workflow instances:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch workflow instances'
    });
  }
};

// Get a single workflow instance
exports.getWorkflowInstance = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid workflow instance ID'
      });
    }
    
    const workflow = await WorkflowInstance.findById(id)
      .populate('initiator', 'name email avatar')
      .populate('workflowTemplate', 'name category steps')
      .populate('department', 'name')
      .populate('stepsData.assignedTo', 'name email avatar')
      .populate('history.user', 'name email avatar')
      .populate('comments.user', 'name email avatar');
    
    if (!workflow) {
      return res.status(404).json({
        status: 'error',
        message: 'Workflow instance not found'
      });
    }
    
    // Check if user has access to this workflow
    const isAdmin = req.user.role === 'admin';
    const isManager = req.user.role === 'manager' && workflow.department?.toString() === req.user.department?.toString();
    const isAssigned = workflow.stepsData.some(step => 
      step.assignedTo && step.assignedTo._id.toString() === req.user._id.toString()
    );
    const isInitiator = workflow.initiator._id.toString() === req.user._id.toString();
    
    if (!isAdmin && !isManager && !isAssigned && !isInitiator) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to view this workflow'
      });
    }
    
    // If this is a related entity, fetch related entity data
    if (workflow.relatedEntity && workflow.relatedEntity.entityId) {
      const { entityType, entityId } = workflow.relatedEntity;
      
      if (mongoose.Types.ObjectId.isValid(entityId)) {
        let entityData;
        
        switch (entityType) {
          case 'task':
            entityData = await Task.findById(entityId)
              .select('title description status assignedTo')
              .populate('assignedTo', 'name email');
            break;
          case 'document':
            entityData = await Document.findById(entityId)
              .select('title description status creator version')
              .populate('creator', 'name email');
            break;
          case 'user':
            entityData = await User.findById(entityId)
              .select('name email department role');
            break;
          // Other entity types...
        }
        
        workflow.relatedEntity.data = entityData;
      }
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        workflow
      }
    });
    
  } catch (error) {
    console.error('Error fetching workflow instance:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch workflow instance'
    });
  }
};

// Create a new workflow instance from a template
exports.createWorkflowInstance = async (req, res) => {
  try {
    const { templateId, name, relatedEntity, dueDate, priority } = req.body;
    
    if (!templateId || !name) {
      return res.status(400).json({
        status: 'error',
        message: 'Workflow template ID and name are required'
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(templateId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid workflow template ID'
      });
    }
    
    // Get the template
    const template = await Workflow.findById(templateId);
    
    if (!template) {
      return res.status(404).json({
        status: 'error',
        message: 'Workflow template not found'
      });
    }
    
    if (!template.isActive) {
      return res.status(400).json({
        status: 'error',
        message: 'This workflow template is not active and cannot be used'
      });
    }
    
    // Validate related entity if provided
    let entityData = null;
    if (relatedEntity && relatedEntity.entityType && relatedEntity.entityId) {
      if (!mongoose.Types.ObjectId.isValid(relatedEntity.entityId)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid related entity ID'
        });
      }
      
      // Verify the entity exists
      switch (relatedEntity.entityType) {
        case 'task':
          entityData = await Task.findById(relatedEntity.entityId);
          break;
        case 'document':
          entityData = await Document.findById(relatedEntity.entityId);
          break;
        case 'user':
          entityData = await User.findById(relatedEntity.entityId);
          break;
        // Other entity types...
      }
      
      if (!entityData) {
        return res.status(404).json({
          status: 'error',
          message: `Related ${relatedEntity.entityType} not found`
        });
      }
    }
    
    // Prepare steps data from template
    const stepsData = template.steps.map(step => ({
      stepNumber: step.stepNumber,
      name: step.name,
      description: step.description,
      status: step.stepNumber === 1 ? 'in_progress' : 'pending',
      assignedTo: step.assignedUser,
      startDate: step.stepNumber === 1 ? new Date() : undefined,
      dueDate: step.durationInDays ? new Date(Date.now() + (step.durationInDays * 24 * 60 * 60 * 1000)) : undefined,
      actions: [],
      formData: new Map()
    }));
    
    // Create the workflow instance
    const workflowInstance = new WorkflowInstance({
      workflowTemplate: templateId,
      name,
      initiator: req.user._id,
      status: 'active',
      priority: priority || template.priority || 'medium',
      startDate: new Date(),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      currentStep: 1, // Start at step 1
      relatedEntity: relatedEntity || { entityType: 'none' },
      stepsData,
      department: req.user.department,
      history: [{
        action: 'created',
        user: req.user._id,
        timestamp: new Date(),
        details: `Workflow started by ${req.user.name}`
      }]
    });
    
    await workflowInstance.save();
    
    // Update template with reference to this active instance
    await Workflow.findByIdAndUpdate(templateId, {
      $push: { currentActiveWorkflows: workflowInstance._id }
    });
    
    // Update related entity with workflow reference if needed
    if (entityData) {
      switch (relatedEntity.entityType) {
        case 'task':
          await Task.findByIdAndUpdate(relatedEntity.entityId, {
            approvalWorkflow: workflowInstance._id,
            approvalStatus: 'pending'
          });
          break;
        case 'document':
          await Document.findByIdAndUpdate(relatedEntity.entityId, {
            approvalWorkflow: workflowInstance._id,
            approvalStatus: 'pending'
          });
          break;
        // Other entity types...
      }
    }
    
    // Notify the assignee of the first step
    const firstStep = stepsData[0];
    if (firstStep.assignedTo) {
      const notification = new Notification({
        recipient: firstStep.assignedTo,
        sender: req.user._id,
        type: 'WORKFLOW_TASK',
        title: 'New Workflow Step Assigned',
        content: `You have been assigned to step "${firstStep.name}" in workflow "${name}"`,
        data: {
          entityId: workflowInstance._id,
          entityType: 'WorkflowInstance',
          metadata: {
            workflowName: name,
            stepName: firstStep.name,
            stepNumber: firstStep.stepNumber
          }
        }
      });
      
      await notification.save();
      
      // Send real-time notification
      sendNotificationToUser(firstStep.assignedTo, notification);
    }
    
    // Create audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'create',
      entity: 'workflow_instance',
      entityId: workflowInstance._id,
      details: `Created workflow instance: ${name}`
    });
    
    res.status(201).json({
      status: 'success',
      data: {
        workflowInstance
      }
    });
    
  } catch (error) {
    console.error('Error creating workflow instance:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to create workflow instance'
    });
  }
};

// Process a workflow step (approve/reject/etc.)
exports.processWorkflowStep = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comment, formData } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid workflow instance ID'
      });
    }
    
    if (!action || !['approve', 'reject', 'request_changes', 'delegate', 'comment'].includes(action)) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid action is required'
      });
    }
    
    const workflowInstance = await WorkflowInstance.findById(id)
      .populate('workflowTemplate', 'name steps')
      .populate('initiator', 'name email');
    
    if (!workflowInstance) {
      return res.status(404).json({
        status: 'error',
        message: 'Workflow instance not found'
      });
    }
    
    if (workflowInstance.status !== 'active') {
      return res.status(400).json({
        status: 'error',
        message: `Cannot process workflow step: workflow is ${workflowInstance.status}`
      });
    }
    
    // Get current step
    const currentStepIndex = workflowInstance.stepsData.findIndex(
      step => step.stepNumber === workflowInstance.currentStep
    );
    
    if (currentStepIndex === -1) {
      return res.status(400).json({
        status: 'error',
        message: 'Current step not found in workflow data'
      });
    }
    
    const currentStep = workflowInstance.stepsData[currentStepIndex];
    
    // Check if user is assigned to this step or has admin privileges
    const isAdmin = req.user.role === 'admin';
    const isAssignedToStep = 
      currentStep.assignedTo && 
      currentStep.assignedTo.toString() === req.user._id.toString();
    
    if (!isAdmin && !isAssignedToStep) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to process this workflow step'
      });
    }
    
    // Process attachments if any
    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map(file => ({
        name: file.originalname,
        path: `/uploads/workflow-attachments/${file.filename}`,
        mimeType: file.mimetype,
        size: file.size
      }));
    }
    
    // Record the action
    const actionData = {
      action,
      user: req.user._id,
      timestamp: new Date(),
      comment: comment || '',
      attachments
    };
    
    // Store form data if provided
    if (formData) {
      // Convert form data to map entries
      Object.entries(formData).forEach(([key, value]) => {
        currentStep.formData.set(key, value);
      });
    }
    
    // Add the action to step history
    currentStep.actions.push(actionData);
    
    // Process based on action type
    switch (action) {
      case 'approve':
        // Move to next step
        await workflowInstance.moveToNextStep(req.user._id, comment);
        break;
        
      case 'reject':
        if (!comment) {
          return res.status(400).json({
            status: 'error',
            message: 'A comment is required when rejecting a step'
          });
        }
        // Reject the workflow
        await workflowInstance.rejectStep(req.user._id, comment);
        break;
        
      case 'request_changes':
        if (!comment) {
          return res.status(400).json({
            status: 'error',
            message: 'A comment is required when requesting changes'
          });
        }
        
        // Add history entry
        workflowInstance.history.push({
          action: 'updated',
          user: req.user._id,
          stepNumber: workflowInstance.currentStep,
          details: `Changes requested for step ${workflowInstance.currentStep}: ${comment}`
        });
        
        // Update the related entity
        if (workflowInstance.relatedEntity && workflowInstance.relatedEntity.entityId) {
          const { entityType, entityId } = workflowInstance.relatedEntity;
          
          switch (entityType) {
            case 'task':
              await Task.findByIdAndUpdate(entityId, { 
                status: 'in_progress',
                approvalStatus: 'changes_requested'
              });
              break;
            case 'document':
              await Document.findByIdAndUpdate(entityId, { 
                approvalStatus: 'changes_requested'
              });
              break;
            // Other entity types...
          }
        }
        
        // Notify the initiator
        const initiatorNotification = new Notification({
          recipient: workflowInstance.initiator._id,
          sender: req.user._id,
          type: 'WORKFLOW_CHANGES',
          title: 'Workflow Changes Requested',
          content: `Changes requested for "${currentStep.name}" in workflow "${workflowInstance.name}": ${comment.substring(0, 100)}${comment.length > 100 ? '...' : ''}`,
          data: {
            entityId: workflowInstance._id,
            entityType: 'WorkflowInstance',
            metadata: {
              workflowName: workflowInstance.name,
              stepName: currentStep.name,
              stepNumber: currentStep.stepNumber
            }
          }
        });
        await initiatorNotification.save();
        sendNotificationToUser(workflowInstance.initiator._id, initiatorNotification);
        
        break;
        
      case 'delegate':
        // Handle delegation (not implemented in this example)
        break;
        
      case 'comment':
        // Just add the comment to history
        workflowInstance.comments.push({
          user: req.user._id,
          comment: comment || '',
          timestamp: new Date()
        });
        break;
    }
    
    await workflowInstance.save();
    
    // Create audit log
    await AuditLog.create({
      user: req.user._id,
      action: action,
      entity: 'workflow_instance',
      entityId: workflowInstance._id,
      details: `${action.charAt(0).toUpperCase() + action.slice(1)} action on workflow: ${workflowInstance.name}, step: ${currentStep.name}`
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        workflowInstance
      }
    });
    
  } catch (error) {
    console.error('Error processing workflow step:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to process workflow step'
    });
  }
};

// Upload handler for workflow step attachments
exports.uploadStepAttachment = upload.array('attachments', 5);

// Export workflow elements for frontend
exports.getWorkflowInfo = async (req, res) => {
  try {
    // Get all workflow categories and types for dropdown menus
    const categories = [
      { value: 'approval', label: 'Approval Workflow' },
      { value: 'onboarding', label: 'Employee Onboarding' },
      { value: 'offboarding', label: 'Employee Offboarding' },
      { value: 'procurement', label: 'Procurement Process' },
      { value: 'review', label: 'Review Process' },
      { value: 'custom', label: 'Custom Workflow' }
    ];
    
    const statuses = [
      { value: 'draft', label: 'Draft' },
      { value: 'active', label: 'Active' },
      { value: 'paused', label: 'Paused' },
      { value: 'completed', label: 'Completed' },
      { value: 'cancelled', label: 'Cancelled' },
      { value: 'rejected', label: 'Rejected' }
    ];
    
    const priorities = [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
      { value: 'urgent', label: 'Urgent' }
    ];
    
    const stepActions = [
      { value: 'approve', label: 'Approve' },
      { value: 'reject', label: 'Reject' },
      { value: 'request_changes', label: 'Request Changes' },
      { value: 'delegate', label: 'Delegate' },
      { value: 'comment', label: 'Comment' }
    ];
    
    const formFieldTypes = [
      { value: 'text', label: 'Text Field' },
      { value: 'textarea', label: 'Text Area' },
      { value: 'select', label: 'Dropdown Select' },
      { value: 'checkbox', label: 'Checkbox' },
      { value: 'radio', label: 'Radio Buttons' },
      { value: 'date', label: 'Date Picker' },
      { value: 'file', label: 'File Upload' }
    ];
    
    const assignedRoles = [
      { value: 'admin', label: 'Administrator' },
      { value: 'manager', label: 'Manager' },
      { value: 'employee', label: 'Employee' },
      { value: 'department_head', label: 'Department Head' },
      { value: 'specific_user', label: 'Specific User' }
    ];
    
    res.status(200).json({
      status: 'success',
      data: {
        categories,
        statuses,
        priorities,
        stepActions,
        formFieldTypes,
        assignedRoles
      }
    });
    
  } catch (error) {
    console.error('Error fetching workflow info:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch workflow information'
    });
  }
}; 
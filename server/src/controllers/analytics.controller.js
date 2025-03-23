const { Prediction, ScheduledReport, Dashboard } = require('../models/analytics.model');
const analyticsService = require('../services/analytics.service');
const schedulerService = require('../services/scheduler.service');
const mongoose = require('mongoose');

/**
 * Get department performance data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getDepartmentPerformance(req, res) {
  try {
    const { department, timeframe } = req.query;
    
    if (!department) {
      return res.status(400).json({ message: 'Department ID is required' });
    }
    
    // Default to MONTHLY if timeframe not provided
    const period = timeframe || 'MONTHLY';
    
    const performanceData = await analyticsService.getDepartmentPerformance(department, period);
    
    return res.status(200).json(performanceData);
  } catch (error) {
    console.error('Error fetching department performance:', error);
    return res.status(500).json({ message: 'Error fetching performance data', error: error.message });
  }
}

/**
 * Get workload distribution data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getWorkloadDistribution(req, res) {
  try {
    const { department } = req.query;
    
    if (!department) {
      return res.status(400).json({ message: 'Department ID is required' });
    }
    
    const workloadData = await analyticsService.getWorkloadDistribution(department);
    
    return res.status(200).json(workloadData);
  } catch (error) {
    console.error('Error fetching workload distribution:', error);
    return res.status(500).json({ message: 'Error fetching workload data', error: error.message });
  }
}

/**
 * Get department efficiency metrics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getDepartmentEfficiency(req, res) {
  try {
    const { department, timeframe } = req.query;
    
    if (!department) {
      return res.status(400).json({ message: 'Department ID is required' });
    }
    
    // Default to MONTHLY if timeframe not provided
    const period = timeframe || 'MONTHLY';
    
    const efficiencyData = await analyticsService.getDepartmentEfficiency(department, period);
    
    return res.status(200).json(efficiencyData);
  } catch (error) {
    console.error('Error fetching department efficiency:', error);
    return res.status(500).json({ message: 'Error fetching efficiency data', error: error.message });
  }
}

/**
 * Get department skills analysis
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getDepartmentSkillsAnalysis(req, res) {
  try {
    const { department } = req.query;
    
    if (!department) {
      return res.status(400).json({ message: 'Department ID is required' });
    }
    
    const skillsData = await analyticsService.getDepartmentSkillsAnalysis(department);
    
    return res.status(200).json(skillsData);
  } catch (error) {
    console.error('Error fetching skills analysis:', error);
    return res.status(500).json({ message: 'Error fetching skills data', error: error.message });
  }
}

/**
 * Create a new prediction
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function createPrediction(req, res) {
  try {
    const { metricType, timeframe, department } = req.body;
    const userId = req.user.id;
    
    // Validation
    if (!metricType || !timeframe || !department) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        requiredFields: ['metricType', 'timeframe', 'department']
      });
    }
    
    // Generate the prediction
    const prediction = await analyticsService.generatePrediction({
      metricType,
      timeframe,
      department,
      userId
    });
    
    return res.status(201).json(prediction);
  } catch (error) {
    console.error('Error creating prediction:', error);
    return res.status(500).json({ message: 'Error creating prediction', error: error.message });
  }
}

/**
 * Get all predictions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getAllPredictions(req, res) {
  try {
    const { department, metricType, limit = 10 } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (department) {
      filter.department = mongoose.Types.ObjectId(department);
    }
    
    if (metricType) {
      filter.metricType = metricType;
    }
    
    // Get predictions sorted by creation date (newest first)
    const predictions = await Prediction.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10));
    
    return res.status(200).json(predictions);
  } catch (error) {
    console.error('Error fetching predictions:', error);
    return res.status(500).json({ message: 'Error fetching predictions', error: error.message });
  }
}

/**
 * Get a specific prediction
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getPredictionById(req, res) {
  try {
    const { id } = req.params;
    
    const prediction = await Prediction.findById(id);
    
    if (!prediction) {
      return res.status(404).json({ message: 'Prediction not found' });
    }
    
    return res.status(200).json(prediction);
  } catch (error) {
    console.error('Error fetching prediction:', error);
    return res.status(500).json({ message: 'Error fetching prediction', error: error.message });
  }
}

/**
 * Delete a prediction
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function deletePrediction(req, res) {
  try {
    const { id } = req.params;
    
    const prediction = await Prediction.findById(id);
    
    if (!prediction) {
      return res.status(404).json({ message: 'Prediction not found' });
    }
    
    // Check if user has permission (either admin or the creator)
    if (req.user.role !== 'admin' && prediction.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to delete this prediction' });
    }
    
    await Prediction.findByIdAndDelete(id);
    
    return res.status(200).json({ message: 'Prediction deleted successfully' });
  } catch (error) {
    console.error('Error deleting prediction:', error);
    return res.status(500).json({ message: 'Error deleting prediction', error: error.message });
  }
}

/**
 * Create a scheduled report
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function createScheduledReport(req, res) {
  try {
    const {
      name,
      description,
      metricType,
      timeframe,
      recipients,
      includeDataExport,
      includeVisualizations,
      department,
      isActive
    } = req.body;
    
    // Validation
    if (!name || !metricType || !timeframe || !department) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        requiredFields: ['name', 'metricType', 'timeframe', 'department']
      });
    }
    
    // Create the report
    const report = new ScheduledReport({
      name,
      description,
      metricType,
      timeframe,
      recipients: recipients || [],
      includeDataExport: includeDataExport !== undefined ? includeDataExport : true,
      includeVisualizations: includeVisualizations !== undefined ? includeVisualizations : true,
      department,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user.id
    });
    
    await report.save();
    
    // Schedule the report if it's active
    if (report.isActive) {
      schedulerService.scheduleNewReport(report);
    }
    
    return res.status(201).json(report);
  } catch (error) {
    console.error('Error creating scheduled report:', error);
    return res.status(500).json({ message: 'Error creating scheduled report', error: error.message });
  }
}

/**
 * Get all scheduled reports
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getAllScheduledReports(req, res) {
  try {
    const { department, isActive } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (department) {
      filter.department = mongoose.Types.ObjectId(department);
    }
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    
    // Get reports sorted by creation date (newest first)
    const reports = await ScheduledReport.find(filter)
      .sort({ createdAt: -1 });
    
    return res.status(200).json(reports);
  } catch (error) {
    console.error('Error fetching scheduled reports:', error);
    return res.status(500).json({ message: 'Error fetching scheduled reports', error: error.message });
  }
}

/**
 * Get a specific scheduled report
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getScheduledReportById(req, res) {
  try {
    const { id } = req.params;
    
    const report = await ScheduledReport.findById(id);
    
    if (!report) {
      return res.status(404).json({ message: 'Scheduled report not found' });
    }
    
    return res.status(200).json(report);
  } catch (error) {
    console.error('Error fetching scheduled report:', error);
    return res.status(500).json({ message: 'Error fetching scheduled report', error: error.message });
  }
}

/**
 * Update a scheduled report
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function updateScheduledReport(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Find the report
    const report = await ScheduledReport.findById(id);
    
    if (!report) {
      return res.status(404).json({ message: 'Scheduled report not found' });
    }
    
    // Check if user has permission (either admin or the creator)
    if (req.user.role !== 'admin' && report.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to update this report' });
    }
    
    // Update the report
    const updatedReport = await ScheduledReport.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    // Update the schedule if necessary
    if (
      updateData.isActive !== undefined ||
      updateData.timeframe !== undefined
    ) {
      schedulerService.updateReportSchedule(id);
    }
    
    return res.status(200).json(updatedReport);
  } catch (error) {
    console.error('Error updating scheduled report:', error);
    return res.status(500).json({ message: 'Error updating scheduled report', error: error.message });
  }
}

/**
 * Delete a scheduled report
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function deleteScheduledReport(req, res) {
  try {
    const { id } = req.params;
    
    const report = await ScheduledReport.findById(id);
    
    if (!report) {
      return res.status(404).json({ message: 'Scheduled report not found' });
    }
    
    // Check if user has permission (either admin or the creator)
    if (req.user.role !== 'admin' && report.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to delete this report' });
    }
    
    // Stop the schedule
    schedulerService.stopReportSchedule(id);
    
    // Delete the report
    await ScheduledReport.findByIdAndDelete(id);
    
    return res.status(200).json({ message: 'Scheduled report deleted successfully' });
  } catch (error) {
    console.error('Error deleting scheduled report:', error);
    return res.status(500).json({ message: 'Error deleting scheduled report', error: error.message });
  }
}

/**
 * Run a scheduled report immediately
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function runScheduledReport(req, res) {
  try {
    const { id } = req.params;
    
    const report = await ScheduledReport.findById(id);
    
    if (!report) {
      return res.status(404).json({ message: 'Scheduled report not found' });
    }
    
    // Process the report
    await schedulerService.processScheduledReport(id);
    
    return res.status(200).json({ message: 'Report processing started' });
  } catch (error) {
    console.error('Error running scheduled report:', error);
    return res.status(500).json({ message: 'Error running scheduled report', error: error.message });
  }
}

/**
 * Create a dashboard
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function createDashboard(req, res) {
  try {
    const { name, description, layout, isDefault, departments } = req.body;
    
    // Validation
    if (!name || !layout) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        requiredFields: ['name', 'layout']
      });
    }
    
    // If setting as default, unset any existing default dashboards
    if (isDefault) {
      await Dashboard.updateMany(
        { isDefault: true, createdBy: req.user.id },
        { isDefault: false }
      );
    }
    
    // Create the dashboard
    const dashboard = new Dashboard({
      name,
      description,
      layout,
      isDefault: isDefault || false,
      departments: departments || [],
      createdBy: req.user.id
    });
    
    await dashboard.save();
    
    return res.status(201).json(dashboard);
  } catch (error) {
    console.error('Error creating dashboard:', error);
    return res.status(500).json({ message: 'Error creating dashboard', error: error.message });
  }
}

/**
 * Get all dashboards
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getAllDashboards(req, res) {
  try {
    const { isDefault } = req.query;
    
    // Build filter object
    const filter = {};
    
    // Filter for dashboards created by the user or shared with their department
    filter.$or = [
      { createdBy: req.user.id },
      { departments: { $in: [req.user.department] } }
    ];
    
    if (isDefault !== undefined) {
      filter.isDefault = isDefault === 'true';
    }
    
    // Get dashboards sorted by creation date (newest first)
    const dashboards = await Dashboard.find(filter)
      .sort({ isDefault: -1, createdAt: -1 });
    
    return res.status(200).json(dashboards);
  } catch (error) {
    console.error('Error fetching dashboards:', error);
    return res.status(500).json({ message: 'Error fetching dashboards', error: error.message });
  }
}

/**
 * Get a specific dashboard
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getDashboardById(req, res) {
  try {
    const { id } = req.params;
    
    const dashboard = await Dashboard.findById(id);
    
    if (!dashboard) {
      return res.status(404).json({ message: 'Dashboard not found' });
    }
    
    // Check if user has access to the dashboard
    const hasAccess = 
      dashboard.createdBy.toString() === req.user.id ||
      dashboard.departments.includes(req.user.department);
    
    if (!hasAccess) {
      return res.status(403).json({ message: 'You do not have permission to view this dashboard' });
    }
    
    return res.status(200).json(dashboard);
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return res.status(500).json({ message: 'Error fetching dashboard', error: error.message });
  }
}

/**
 * Update a dashboard
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function updateDashboard(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Find the dashboard
    const dashboard = await Dashboard.findById(id);
    
    if (!dashboard) {
      return res.status(404).json({ message: 'Dashboard not found' });
    }
    
    // Check if user has permission (must be the creator)
    if (dashboard.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to update this dashboard' });
    }
    
    // If setting as default, unset any existing default dashboards
    if (updateData.isDefault) {
      await Dashboard.updateMany(
        { isDefault: true, createdBy: req.user.id, _id: { $ne: id } },
        { isDefault: false }
      );
    }
    
    // Update the dashboard
    const updatedDashboard = await Dashboard.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    return res.status(200).json(updatedDashboard);
  } catch (error) {
    console.error('Error updating dashboard:', error);
    return res.status(500).json({ message: 'Error updating dashboard', error: error.message });
  }
}

/**
 * Delete a dashboard
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function deleteDashboard(req, res) {
  try {
    const { id } = req.params;
    
    const dashboard = await Dashboard.findById(id);
    
    if (!dashboard) {
      return res.status(404).json({ message: 'Dashboard not found' });
    }
    
    // Check if user has permission (must be the creator)
    if (dashboard.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to delete this dashboard' });
    }
    
    await Dashboard.findByIdAndDelete(id);
    
    return res.status(200).json({ message: 'Dashboard deleted successfully' });
  } catch (error) {
    console.error('Error deleting dashboard:', error);
    return res.status(500).json({ message: 'Error deleting dashboard', error: error.message });
  }
}

module.exports = {
  // Performance and analytics
  getDepartmentPerformance,
  getWorkloadDistribution,
  getDepartmentEfficiency,
  getDepartmentSkillsAnalysis,
  
  // Predictions
  createPrediction,
  getAllPredictions,
  getPredictionById,
  deletePrediction,
  
  // Scheduled reports
  createScheduledReport,
  getAllScheduledReports,
  getScheduledReportById,
  updateScheduledReport,
  deleteScheduledReport,
  runScheduledReport,
  
  // Dashboards
  createDashboard,
  getAllDashboards,
  getDashboardById,
  updateDashboard,
  deleteDashboard
}; 
const mongoose = require('mongoose');
const Task = require('../models/task.model');
const User = require('../models/user.model');
const Department = require('../models/department.model');
const { Prediction } = require('../models/analytics.model');
const { v4: uuidv4 } = require('uuid');

/**
 * Get department performance data
 * @param {String} department - Department ID
 * @param {String} timeframe - Time period (DAILY, WEEKLY, MONTHLY, QUARTERLY)
 */
async function getDepartmentPerformance(department, timeframe) {
  const timeRanges = getTimeRange(timeframe);
  
  // MongoDB aggregation pipeline for task completion rate by department
  const taskCompletion = await Task.aggregate([
    {
      $match: {
        department: mongoose.Types.ObjectId(department),
        createdAt: { $gte: timeRanges.startDate },
        updatedAt: { $lte: timeRanges.endDate }
      }
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Calculate performance metrics
  const completedTasks = taskCompletion.find(t => t._id === 'completed')?.count || 0;
  const totalTasks = taskCompletion.reduce((sum, t) => sum + t.count, 0) || 1; // Avoid division by zero
  
  const performanceRate = (completedTasks / totalTasks) * 100;
  
  // Get productivity trend
  const productivityTrend = await getProductivityTrend(department, timeframe);
  
  return {
    performanceRate,
    completedTasks,
    totalTasks,
    productivityTrend
  };
}

/**
 * Get workload distribution data
 * @param {String} department - Department ID
 */
async function getWorkloadDistribution(department) {
  // Aggregate to find number of assigned tasks per user in department
  const workloadData = await Task.aggregate([
    {
      $match: {
        department: mongoose.Types.ObjectId(department),
        status: { $nin: ['completed', 'cancelled'] }
      }
    },
    {
      $group: {
        _id: "$assignedTo",
        taskCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: {
        path: '$user',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        _id: 1,
        name: '$user.name',
        taskCount: 1,
        role: '$user.role'
      }
    },
    {
      $sort: { taskCount: -1 }
    }
  ]);
  
  return workloadData;
}

/**
 * Get efficiency metrics by department
 * @param {String} department - Department ID
 * @param {String} timeframe - Time period (DAILY, WEEKLY, MONTHLY, QUARTERLY)
 */
async function getDepartmentEfficiency(department, timeframe) {
  const timeRanges = getTimeRange(timeframe);
  
  // Aggregation for average task completion time
  const taskEfficiency = await Task.aggregate([
    {
      $match: {
        department: mongoose.Types.ObjectId(department),
        status: 'completed',
        completedAt: { $gte: timeRanges.startDate, $lte: timeRanges.endDate }
      }
    },
    {
      $project: {
        completionTime: { 
          $subtract: ['$completedAt', '$createdAt'] 
        },
        priority: 1
      }
    },
    {
      $group: {
        _id: '$priority',
        avgCompletionTime: { $avg: '$completionTime' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
  
  // Convert milliseconds to hours for readability
  const efficiencyData = taskEfficiency.map(item => ({
    priority: item._id || 'unspecified',
    avgCompletionHours: Math.round(item.avgCompletionTime / (1000 * 60 * 60) * 10) / 10, // Round to 1 decimal
    taskCount: item.count
  }));
  
  // Calculate overall efficiency metrics
  const totalTasks = efficiencyData.reduce((sum, item) => sum + item.taskCount, 0);
  const weightedAvgTime = efficiencyData.reduce((sum, item) => {
    return sum + (item.avgCompletionHours * item.taskCount);
  }, 0) / (totalTasks || 1);
  
  return {
    efficiencyByPriority: efficiencyData,
    overallAvgCompletionHours: Math.round(weightedAvgTime * 10) / 10,
    totalCompletedTasks: totalTasks
  };
}

/**
 * Get department-level skills analytics
 * @param {String} department - Department ID
 */
async function getDepartmentSkillsAnalysis(department) {
  // Get all team members in department
  const teamMembers = await User.find({ department: mongoose.Types.ObjectId(department) });
  
  // Extract and count skills
  const skillsMap = new Map();
  
  teamMembers.forEach(member => {
    if (member.skills && member.skills.length > 0) {
      member.skills.forEach(skill => {
        const count = skillsMap.get(skill) || 0;
        skillsMap.set(skill, count + 1);
      });
    }
  });
  
  // Convert to sorted array
  const skillsData = Array.from(skillsMap.entries())
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count);
  
  // Calculate skill coverage percentage
  const totalMembers = teamMembers.length || 1; // Avoid division by zero
  
  const skillsCoverage = skillsData.map(item => ({
    ...item,
    coverage: Math.round((item.count / totalMembers) * 100)
  }));
  
  return {
    skillsCoverage,
    teamSize: totalMembers,
    topSkills: skillsCoverage.slice(0, 5),
    skillGaps: skillsCoverage.filter(item => item.coverage < 30) // Skills with less than 30% coverage
  };
}

/**
 * Get time-based productivity trend
 * @param {String} department - Department ID
 * @param {String} timeframe - Time period (DAILY, WEEKLY, MONTHLY, QUARTERLY)
 */
async function getProductivityTrend(department, timeframe) {
  const timeRanges = getTimeRange(timeframe);
  const intervals = getIntervals(timeframe, timeRanges);
  
  // Prepare date boundaries for each interval
  const dateBoundaries = intervals.map(interval => ({
    start: interval.start,
    end: interval.end
  }));
  
  // Get task completion data for each interval
  const productivityData = [];
  
  for (const boundary of dateBoundaries) {
    const completedTasksCount = await Task.countDocuments({
      department: mongoose.Types.ObjectId(department),
      status: 'completed',
      updatedAt: { $gte: boundary.start, $lte: boundary.end }
    });
    
    const totalTasksCount = await Task.countDocuments({
      department: mongoose.Types.ObjectId(department),
      createdAt: { $lte: boundary.end }
    });
    
    const productivity = totalTasksCount > 0 
      ? (completedTasksCount / totalTasksCount) * 100
      : 0;
    
    productivityData.push({
      date: boundary.end,
      value: Math.round(productivity * 10) / 10
    });
  }
  
  return productivityData;
}

/**
 * Generate a new prediction
 * @param {Object} data - Prediction parameters
 * @param {String} data.metricType - Type of metric (PERFORMANCE, WORKLOAD, etc.)
 * @param {String} data.timeframe - Time period (DAILY, WEEKLY, MONTHLY, QUARTERLY)
 * @param {String} data.department - Department ID
 * @param {String} data.userId - User creating the prediction
 */
async function generatePrediction(data) {
  const { metricType, timeframe, department, userId } = data;
  
  // Get historical data based on metric type
  let historicalData = [];
  let baseline = [];
  let predictedValues = [];
  
  switch (metricType) {
    case 'PERFORMANCE':
      const performance = await getDepartmentPerformance(department, timeframe);
      historicalData = performance.productivityTrend;
      break;
    case 'WORKLOAD':
      const workload = await getWorkloadDistribution(department);
      // Transform workload data for prediction
      historicalData = workload.map(user => ({
        date: new Date(),
        value: user.taskCount,
        userId: user._id
      }));
      break;
    case 'EFFICIENCY':
      const efficiency = await getDepartmentEfficiency(department, timeframe);
      // Use completion time as the metric
      historicalData = [{ date: new Date(), value: efficiency.overallAvgCompletionHours }];
      break;
    default:
      // Use default sample data if no specific metric type handling
      historicalData = Array.from({ length: 5 }, (_, i) => ({
        date: new Date(Date.now() - (i * 86400000)), // Past days
        value: 50 + Math.random() * 20 // Random value between 50-70
      }));
  }
  
  // Simple prediction algorithm (linear regression would be used in production)
  baseline = historicalData.map(point => ({
    timestamp: point.date,
    value: point.value,
    department: department
  }));
  
  // Generate predicted values (simple example - in production this would use proper ML)
  // For this example, we'll use a naive approach of adding a small growth trend
  const lastValue = historicalData.length > 0 
    ? historicalData[historicalData.length - 1].value 
    : 50;
    
  // Different trends for different metrics
  let trend = 0.05; // 5% positive trend for example
  
  switch (metricType) {
    case 'PERFORMANCE':
      trend = 0.03; // 3% improvement trend for performance
      break;
    case 'WORKLOAD':
      trend = 0.08; // 8% growth in workload
      break;
    case 'EFFICIENCY':
      trend = -0.02; // -2% trend means improving efficiency (less time)
      break;
    case 'SKILLS':
      trend = 0.04; // 4% growth in skills coverage
      break;
    case 'PROGRESS':
      trend = 0.05; // 5% improvement in progress rate
      break;
  }
  
  // Generate future dates based on timeframe
  const futureDates = generateFutureDates(timeframe, 10); // 10 future points
  
  predictedValues = futureDates.map((date, index) => ({
    timestamp: date,
    value: calculatePredictedValue(lastValue, trend, index),
    department: department
  }));
  
  // Create confidence interval (simplified)
  const confidence = getConfidenceInterval(metricType);
  
  const confidenceInterval = {
    upper: predictedValues.map(point => ({
      timestamp: point.timestamp,
      value: point.value * (1 + confidence) // Upper bound
    })),
    lower: predictedValues.map(point => ({
      timestamp: point.timestamp,
      value: point.value * (1 - confidence) // Lower bound
    }))
  };
  
  // Create prediction title and description
  const departmentName = await getDepartmentName(department);
  const { title, description } = getPredictionDescription(metricType, timeframe, departmentName);
  
  // Create new prediction
  const prediction = new Prediction({
    title,
    description,
    metricType,
    timeframe,
    model: 'STATISTICAL', // Basic model for now
    department,
    baseline,
    predicted: predictedValues,
    confidenceInterval,
    accuracy: 0.65 + (Math.random() * 0.2), // Example accuracy between 0.65 and 0.85
    createdBy: userId,
    updatedAt: new Date()
  });
  
  await prediction.save();
  return prediction;
}

/**
 * Generate a report based on scheduled report configuration
 * @param {Object} report - ScheduledReport object
 */
async function generateReport(report) {
  try {
    const { metricType, timeframe, department } = report;
    let reportData = { html: '', csv: '' };
    
    // Get appropriate data based on metric type
    switch (metricType) {
      case 'PERFORMANCE':
        const performance = await getDepartmentPerformance(department, timeframe);
        reportData = formatReportData('Performance Analysis', performance, timeframe);
        break;
      case 'WORKLOAD':
        const workload = await getWorkloadDistribution(department);
        reportData = formatReportData('Workload Distribution', workload, timeframe);
        break;
      case 'EFFICIENCY':
        const efficiency = await getDepartmentEfficiency(department, timeframe);
        reportData = formatReportData('Efficiency Metrics', efficiency, timeframe);
        break;
      case 'SKILLS':
        const skills = await getDepartmentSkillsAnalysis(department);
        reportData = formatReportData('Skills Analysis', skills, timeframe);
        break;
      default:
        reportData = {
          html: `<p>No data available for ${metricType}</p>`,
          csv: `No data available for ${metricType}`
        };
    }
    
    return reportData;
  } catch (error) {
    console.error('Error generating report:', error);
    return {
      html: '<p>Error generating report</p>',
      csv: 'Error generating report'
    };
  }
}

/**
 * Format report data as HTML and CSV
 * @param {String} title - Report title
 * @param {Object} data - Report data
 * @param {String} timeframe - Time period
 */
function formatReportData(title, data, timeframe) {
  // Format as HTML (simplified example)
  let html = `
    <h2>${title}</h2>
    <p>Report period: ${timeframe}</p>
    <div>
      ${JSON.stringify(data, null, 2)}
    </div>
  `;
  
  // Format as CSV (simplified example)
  let csv = `${title}\nReport period: ${timeframe}\n\n`;
  csv += Object.entries(data)
    .map(([key, value]) => `${key},${JSON.stringify(value)}`)
    .join('\n');
  
  return { html, csv };
}

/**
 * Get department name by ID
 * @param {String} departmentId - Department ID
 */
async function getDepartmentName(departmentId) {
  try {
    const department = await Department.findById(departmentId);
    return department ? department.name : 'Unknown Department';
  } catch (error) {
    console.error('Error getting department name:', error);
    return 'Unknown Department';
  }
}

/**
 * Get prediction title and description
 * @param {String} metricType - Type of metric
 * @param {String} timeframe - Time period
 * @param {String} departmentName - Department name
 */
function getPredictionDescription(metricType, timeframe, departmentName) {
  const timeframeText = {
    'DAILY': 'Daily',
    'WEEKLY': 'Weekly',
    'MONTHLY': 'Monthly',
    'QUARTERLY': 'Quarterly'
  }[timeframe] || timeframe;
  
  const metricTypeText = {
    'PERFORMANCE': 'Performance',
    'WORKLOAD': 'Workload',
    'EFFICIENCY': 'Efficiency',
    'SKILLS': 'Skills Gap',
    'PROGRESS': 'Progress'
  }[metricType] || metricType;
  
  return {
    title: `${departmentName} ${metricTypeText} ${timeframeText} Forecast`,
    description: `AI-generated ${timeframeText.toLowerCase()} forecast for ${metricTypeText.toLowerCase()} metrics in the ${departmentName} department.`
  };
}

/**
 * Calculate predicted value based on last value, trend and position
 * @param {Number} lastValue - Last historical value
 * @param {Number} trend - Growth trend
 * @param {Number} position - Position in the prediction sequence
 */
function calculatePredictedValue(lastValue, trend, position) {
  // Simple linear model: value = lastValue * (1 + trend * position)
  // Add some small random noise for more realistic predictions
  const noise = (Math.random() * 0.04) - 0.02; // Random noise between -2% and 2%
  const predictedValue = lastValue * (1 + (trend * (position + 1)) + noise);
  
  // Round to 1 decimal place
  return Math.round(predictedValue * 10) / 10;
}

/**
 * Get confidence interval percentage based on metric type
 * @param {String} metricType - Type of metric
 */
function getConfidenceInterval(metricType) {
  switch (metricType) {
    case 'PERFORMANCE':
      return 0.08; // 8% confidence interval
    case 'WORKLOAD':
      return 0.15; // 15% confidence interval (more variable)
    case 'EFFICIENCY':
      return 0.12; // 12% confidence interval
    case 'SKILLS':
      return 0.10; // 10% confidence interval
    case 'PROGRESS':
      return 0.08; // 8% confidence interval
    default:
      return 0.10; // Default 10% confidence interval
  }
}

/**
 * Helper function to get time range based on timeframe
 * @param {String} timeframe - Time period (DAILY, WEEKLY, MONTHLY, QUARTERLY)
 */
function getTimeRange(timeframe) {
  const now = new Date();
  let startDate;
  
  switch (timeframe) {
    case 'DAILY':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7); // Past week for context
      break;
    case 'WEEKLY':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 28); // Past 4 weeks
      break;
    case 'MONTHLY':
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 6); // Past 6 months
      break;
    case 'QUARTERLY':
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 12); // Past year
      break;
    default:
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 30); // Default: past 30 days
  }
  
  return {
    startDate,
    endDate: now
  };
}

/**
 * Helper to generate intervals for trend analysis
 * @param {String} timeframe - Time period (DAILY, WEEKLY, MONTHLY, QUARTERLY)
 * @param {Object} timeRanges - Start and end dates
 */
function getIntervals(timeframe, timeRanges) {
  const { startDate, endDate } = timeRanges;
  const intervals = [];
  
  let intervalSize;
  let current = new Date(startDate);
  
  switch (timeframe) {
    case 'DAILY':
      intervalSize = { days: 1 };
      break;
    case 'WEEKLY':
      intervalSize = { days: 7 };
      break;
    case 'MONTHLY':
      intervalSize = { months: 1 };
      break;
    case 'QUARTERLY':
      intervalSize = { months: 3 };
      break;
    default:
      intervalSize = { days: 7 }; // Default: weekly
  }
  
  while (current <= endDate) {
    const intervalEnd = new Date(current);
    
    if (intervalSize.days) {
      intervalEnd.setDate(current.getDate() + intervalSize.days);
    } else if (intervalSize.months) {
      intervalEnd.setMonth(current.getMonth() + intervalSize.months);
    }
    
    // Don't exceed the end date
    if (intervalEnd > endDate) {
      intervalEnd.setTime(endDate.getTime());
    }
    
    intervals.push({
      start: new Date(current),
      end: new Date(intervalEnd)
    });
    
    // Break if we've reached the end
    if (intervalEnd.getTime() >= endDate.getTime()) {
      break;
    }
    
    current = new Date(intervalEnd);
  }
  
  return intervals;
}

/**
 * Generate future dates based on timeframe
 * @param {String} timeframe - Time period (DAILY, WEEKLY, MONTHLY, QUARTERLY)
 * @param {Number} count - Number of points to generate
 */
function generateFutureDates(timeframe, count) {
  const now = new Date();
  const futureDates = [];
  
  for (let i = 1; i <= count; i++) {
    const date = new Date(now);
    
    switch (timeframe) {
      case 'DAILY':
        date.setDate(now.getDate() + i);
        break;
      case 'WEEKLY':
        date.setDate(now.getDate() + (i * 7));
        break;
      case 'MONTHLY':
        date.setMonth(now.getMonth() + i);
        break;
      case 'QUARTERLY':
        date.setMonth(now.getMonth() + (i * 3));
        break;
      default:
        date.setDate(now.getDate() + (i * 7)); // Default: weekly
    }
    
    futureDates.push(date);
  }
  
  return futureDates;
}

module.exports = {
  getDepartmentPerformance,
  getWorkloadDistribution,
  getDepartmentEfficiency,
  getDepartmentSkillsAnalysis,
  getProductivityTrend,
  generatePrediction,
  generateReport
}; 
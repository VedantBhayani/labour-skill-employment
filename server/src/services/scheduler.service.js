const cron = require('node-cron');
const nodemailer = require('nodemailer');
const { ScheduledReport } = require('../models/analytics.model');
const analyticsService = require('./analytics.service');

// Store active schedules
let activeSchedules = {};

/**
 * Initialize the scheduler
 */
function initScheduler() {
  console.log('Initializing report scheduler...');
  
  // Load all active scheduled reports from the database and schedule them
  loadActiveSchedules();
  
  // Also schedule a daily job to check for new/updated schedules
  cron.schedule('0 0 * * *', async () => {
    console.log('Running daily schedule refresh...');
    await loadActiveSchedules();
  });
}

/**
 * Load all active scheduled reports and set up their cron jobs
 */
async function loadActiveSchedules() {
  try {
    // Cancel all existing schedules to avoid duplicates
    Object.values(activeSchedules).forEach(schedule => {
      if (schedule && typeof schedule.stop === 'function') {
        schedule.stop();
      }
    });
    
    // Reset active schedules
    activeSchedules = {};
    
    // Get all active scheduled reports
    const reports = await ScheduledReport.find({ isActive: true });
    console.log(`Found ${reports.length} active scheduled reports`);
    
    // Schedule each report
    reports.forEach(report => {
      scheduleReport(report);
    });
  } catch (error) {
    console.error('Error loading active schedules:', error);
  }
}

/**
 * Schedule a report based on its configuration
 * @param {Object} report - ScheduledReport document
 */
function scheduleReport(report) {
  try {
    // Generate cron expression based on timeframe
    const cronExpression = getCronExpression(report.timeframe);
    
    // Validate cron expression
    if (!cronExpression) {
      console.error(`Invalid timeframe for report ${report._id}: ${report.timeframe}`);
      return;
    }
    
    console.log(`Scheduling report ${report._id} (${report.name}) with cron: ${cronExpression}`);
    
    // Create the scheduled job
    const job = cron.schedule(cronExpression, async () => {
      await processScheduledReport(report._id);
    });
    
    // Store the job reference for potential cancellation
    activeSchedules[report._id] = job;
    
    // Calculate and update the next run date
    const nextRun = calculateNextRunDate(cronExpression);
    ScheduledReport.findByIdAndUpdate(report._id, { nextRun })
      .catch(err => console.error(`Error updating next run date for report ${report._id}:`, err));
      
  } catch (error) {
    console.error(`Error scheduling report ${report._id}:`, error);
  }
}

/**
 * Process a scheduled report when its time comes
 * @param {String} reportId - ScheduledReport ID
 */
async function processScheduledReport(reportId) {
  try {
    console.log(`Processing scheduled report: ${reportId}`);
    
    // Get the report with fresh data
    const report = await ScheduledReport.findById(reportId);
    
    if (!report || !report.isActive) {
      console.log(`Report ${reportId} is no longer active or was deleted`);
      if (activeSchedules[reportId]) {
        activeSchedules[reportId].stop();
        delete activeSchedules[reportId];
      }
      return;
    }
    
    // Generate the report data
    const reportData = await analyticsService.generateReport(report);
    
    // Send the report to recipients
    const success = await sendReportToRecipients(report, reportData);
    
    // Update the last run time and next run time
    const now = new Date();
    const cronExpression = getCronExpression(report.timeframe);
    const nextRun = calculateNextRunDate(cronExpression);
    
    await ScheduledReport.findByIdAndUpdate(reportId, { 
      lastRun: now,
      nextRun
    });
    
    console.log(`Report ${reportId} processed successfully. Next run: ${nextRun}`);
    
  } catch (error) {
    console.error(`Error processing scheduled report ${reportId}:`, error);
  }
}

/**
 * Send the report to its recipients
 * @param {Object} report - ScheduledReport document
 * @param {Object} reportData - Generated report data (HTML and CSV)
 */
async function sendReportToRecipients(report, reportData) {
  try {
    // Check if there are recipients
    if (!report.recipients || report.recipients.length === 0) {
      console.log(`No recipients for report ${report._id}`);
      return false;
    }
    
    // Get email configuration from environment variables
    const emailConfig = {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    };
    
    // Create email transporter
    const transporter = nodemailer.createTransport(emailConfig);
    
    // Prepare attachments if needed
    const attachments = [];
    
    if (report.includeDataExport) {
      attachments.push({
        filename: `${report.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`,
        content: reportData.csv
      });
    }
    
    // Send email to each recipient
    const emailPromises = report.recipients.map(recipient => {
      return transporter.sendMail({
        from: `"Analytics System" <${process.env.EMAIL_USER}>`,
        to: recipient.email,
        subject: `Scheduled Report: ${report.name}`,
        html: reportData.html,
        attachments
      });
    });
    
    // Wait for all emails to be sent
    await Promise.all(emailPromises);
    
    console.log(`Report ${report._id} sent to ${report.recipients.length} recipients`);
    return true;
    
  } catch (error) {
    console.error(`Error sending report ${report._id} to recipients:`, error);
    return false;
  }
}

/**
 * Get cron expression based on timeframe
 * @param {String} timeframe - DAILY, WEEKLY, MONTHLY, QUARTERLY
 * @returns {String} cron expression
 */
function getCronExpression(timeframe) {
  // Default cron expressions for different timeframes
  // Format: second minute hour day-of-month month day-of-week
  switch (timeframe) {
    case 'DAILY':
      return '0 8 * * *'; // Every day at 8 AM
    case 'WEEKLY':
      return '0 8 * * 1'; // Every Monday at 8 AM
    case 'MONTHLY':
      return '0 8 1 * *'; // 1st day of every month at 8 AM
    case 'QUARTERLY':
      return '0 8 1 1,4,7,10 *'; // 1st day of Jan, Apr, Jul, Oct at 8 AM
    default:
      return null; // Invalid timeframe
  }
}

/**
 * Calculate the next run date based on cron expression
 * @param {String} cronExpression - Cron expression
 * @returns {Date} next run date
 */
function calculateNextRunDate(cronExpression) {
  try {
    // Simple approach: use node-cron's next date function 
    const scheduler = cron.schedule(cronExpression, () => {});
    const nextDate = scheduler.nextDate();
    scheduler.stop();
    return nextDate.toDate();
  } catch (error) {
    console.error('Error calculating next run date:', error);
    return new Date(Date.now() + 86400000); // Default: tomorrow
  }
}

/**
 * Schedule a new report
 * @param {Object} report - ScheduledReport document
 */
function scheduleNewReport(report) {
  // Calculate next run date
  const cronExpression = getCronExpression(report.timeframe);
  const nextRun = calculateNextRunDate(cronExpression);
  
  // Update the report with next run date if it doesn't have one
  if (!report.nextRun) {
    ScheduledReport.findByIdAndUpdate(report._id, { nextRun })
      .catch(err => console.error(`Error updating next run date for new report ${report._id}:`, err));
  }
  
  // Schedule it if active
  if (report.isActive) {
    scheduleReport(report);
  }
}

/**
 * Update an existing report schedule
 * @param {String} reportId - ScheduledReport ID
 */
async function updateReportSchedule(reportId) {
  try {
    // Get the updated report
    const report = await ScheduledReport.findById(reportId);
    
    if (!report) {
      console.log(`Report ${reportId} not found`);
      return;
    }
    
    // Stop existing schedule if any
    if (activeSchedules[reportId]) {
      activeSchedules[reportId].stop();
      delete activeSchedules[reportId];
    }
    
    // Re-schedule if active
    if (report.isActive) {
      scheduleReport(report);
    }
    
  } catch (error) {
    console.error(`Error updating report schedule for ${reportId}:`, error);
  }
}

/**
 * Stop a report schedule
 * @param {String} reportId - ScheduledReport ID
 */
function stopReportSchedule(reportId) {
  if (activeSchedules[reportId]) {
    activeSchedules[reportId].stop();
    delete activeSchedules[reportId];
    console.log(`Stopped schedule for report ${reportId}`);
  }
}

module.exports = {
  initScheduler,
  loadActiveSchedules,
  scheduleNewReport,
  updateReportSchedule,
  stopReportSchedule,
  processScheduledReport // Exported for manual triggering if needed
}; 
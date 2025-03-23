/**
 * Integration Examples
 * 
 * This file demonstrates how to use the HR and Payroll API clients.
 */

import { createHrApiClient, HrSystemConfig, HrEvent, HrEventType } from './hrIntegration';
import { createPayrollApiClient, PayrollSystemConfig, PayrollEvent, PayrollEventType } from './payrollIntegration';

/**
 * Example of setting up and using HR system integration
 */
export function setupHrIntegration() {
  // Configure HR system
  const hrConfig: HrSystemConfig = {
    baseUrl: 'https://api.hrsystem.example.com/v1',
    authMethod: 'oauth2',
    credentials: {
      clientId: 'your-client-id',
      clientSecret: 'your-client-secret'
    },
    syncInterval: 1800000, // 30 minutes
    webhookEndpoint: 'https://your-app.example.com/api/webhooks/hr',
    websocketUrl: 'wss://api.hrsystem.example.com/v1/realtime',
    realtimeUpdates: true // Enable real-time updates
  };

  // Create HR client
  const hrClient = createHrApiClient('primary-hr', hrConfig);
  
  // Set up real-time event listeners
  setupHrEventListeners(hrClient);
  
  // Start synchronization
  hrClient.startSync();
  
  // Example: Get all employees
  hrClient.getEmployees().then(employees => {
    console.log(`Retrieved ${employees.length} employees`);
    
    // Example: Get specific employee details
    if (employees.length > 0) {
      const employeeId = employees[0].id;
      return hrClient.getEmployee(employeeId);
    }
  }).then(employee => {
    if (employee) {
      console.log(`Employee details: ${employee.firstName} ${employee.lastName}`);
      
      // Example: Update employee
      return hrClient.updateEmployee(employee.id, {
        status: 'onLeave'
      });
    }
  }).then(updatedEmployee => {
    if (updatedEmployee) {
      console.log(`Updated employee status to: ${updatedEmployee.status}`);
    }
  }).catch(error => {
    console.error('HR API Error:', error);
  });
  
  return hrClient;
}

/**
 * Set up real-time event listeners for HR system
 */
function setupHrEventListeners(hrClient: ReturnType<typeof createHrApiClient>) {
  // Listen for employee creation events
  hrClient.on('employee.created', (event: HrEvent) => {
    console.log('Real-time event: New employee created', event.data);
    notifyUser(`New employee added: ${event.data.firstName} ${event.data.lastName}`);
  });
  
  // Listen for employee updates
  hrClient.on('employee.updated', (event: HrEvent) => {
    console.log('Real-time event: Employee updated', event.data);
    
    // Check if it's a status change
    if (event.data.status === 'onLeave') {
      notifyUser(`Employee ${event.data.firstName} ${event.data.lastName} is now on leave`);
    } else if (event.data.status === 'inactive') {
      notifyUser(`Employee ${event.data.firstName} ${event.data.lastName} is now inactive`);
    }
  });
  
  // Listen for employee deletion
  hrClient.on('employee.deleted', (event: HrEvent) => {
    console.log('Real-time event: Employee deleted', event.data);
    notifyUser(`Employee removed from system (ID: ${event.data.id})`);
  });
  
  // Listen for department events
  hrClient.on('department.created', (event: HrEvent) => {
    console.log('Real-time event: New department created', event.data);
    notifyUser(`New department added: ${event.data.name}`);
  });
  
  // Listen for position events
  hrClient.on('position.created', (event: HrEvent) => {
    console.log('Real-time event: New position created', event.data);
    notifyUser(`New position added: ${event.data.title}`);
  });
}

/**
 * Example of setting up and using Payroll system integration
 */
export function setupPayrollIntegration() {
  // Configure Payroll system
  const payrollConfig: PayrollSystemConfig = {
    baseUrl: 'https://api.payroll.example.com/v2',
    authMethod: 'apiKey',
    credentials: {
      apiKey: 'your-api-key'
    },
    syncInterval: 3600000, // 1 hour
    encryptionKey: 'your-encryption-key',
    websocketUrl: 'wss://api.payroll.example.com/v2/realtime',
    realtimeUpdates: true // Enable real-time updates
  };

  // Create Payroll client
  const payrollClient = createPayrollApiClient('primary-payroll', payrollConfig);
  
  // Set up real-time event listeners
  setupPayrollEventListeners(payrollClient);
  
  // Start synchronization
  payrollClient.startSync();
  
  // Example: Get all payroll periods
  payrollClient.getPayrollPeriods().then(periods => {
    console.log(`Retrieved ${periods.length} payroll periods`);
    
    // Example: Get active payroll period
    const activePeriod = periods.find(p => p.status === 'pending' || p.status === 'processing');
    
    if (activePeriod) {
      return payrollClient.getEmployeePayrolls(activePeriod.id);
    }
    
    // If no active period, create a new one
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(1); // First day of the month
    
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of the month
    
    const newPeriod = {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      processDate: endDate.toISOString().split('T')[0],
      status: 'pending' as const
    };
    
    return payrollClient.createPayrollPeriod(newPeriod)
      .then(period => {
        console.log(`Created new payroll period: ${period.id}`);
        return [];
      });
  }).then(employeePayrolls => {
    console.log(`Retrieved ${employeePayrolls.length} employee payrolls`);
  }).catch(error => {
    console.error('Payroll API Error:', error);
  });
  
  return payrollClient;
}

/**
 * Set up real-time event listeners for Payroll system
 */
function setupPayrollEventListeners(payrollClient: ReturnType<typeof createPayrollApiClient>) {
  // Listen for payroll period events
  payrollClient.on('payrollPeriod.created', (event: PayrollEvent) => {
    console.log('Real-time event: New payroll period created', event.data);
    notifyUser(`New payroll period created for ${event.data.startDate} to ${event.data.endDate}`);
  });
  
  payrollClient.on('payrollPeriod.processed', (event: PayrollEvent) => {
    console.log('Real-time event: Payroll period processed', event.data);
    notifyUser(`Payroll processing completed for period ending ${event.data.endDate}`);
    
    // When payroll is processed, could trigger notifications to employees
    sendPayrollCompletionNotifications(event.data.id);
  });
  
  // Listen for employee payroll events
  payrollClient.on('employeePayroll.created', (event: PayrollEvent) => {
    console.log('Real-time event: Employee payroll created', event.data);
  });
  
  payrollClient.on('employeePayroll.approved', (event: PayrollEvent) => {
    console.log('Real-time event: Employee payroll approved', event.data);
    notifyUser(`Payroll approved for employee ID: ${event.data.employeeId}`);
  });
  
  payrollClient.on('employeePayroll.paid', (event: PayrollEvent) => {
    console.log('Real-time event: Employee payroll paid', event.data);
    notifyPaymentToEmployee(event.data);
  });
}

/**
 * Example of integration between HR and Payroll systems
 */
export function integrateHrAndPayroll() {
  const hrClient = setupHrIntegration();
  const payrollClient = setupPayrollIntegration();
  
  // Set up cross-system real-time integrations
  setupCrossSystemIntegration(hrClient, payrollClient);
  
  // Example: Sync employee data from HR to Payroll system
  hrClient.getEmployees().then(employees => {
    console.log(`Syncing ${employees.length} employees to payroll system`);
    
    return payrollClient.getPayrollPeriods();
  }).then(periods => {
    // Find active period
    const activePeriod = periods.find(p => p.status === 'pending');
    
    if (!activePeriod) {
      throw new Error('No active payroll period found');
    }
    
    // Now we could create payroll entries for employees...
    console.log(`Would create payroll entries for period: ${activePeriod.id}`);
    
    // Example: Process payroll
    return payrollClient.processPayroll(activePeriod.id);
  }).then(processedPeriod => {
    console.log(`Processed payroll period: ${processedPeriod.id}`);
  }).catch(error => {
    console.error('Integration Error:', error);
  });
  
  // Setup webhook handlers or other integration points
  setupIntegrationWebhooks();
  
  return {
    hrClient,
    payrollClient,
    close: () => {
      // Properly close all real-time connections
      hrClient.close();
      payrollClient.close();
      console.log('All API clients closed');
    }
  };
}

/**
 * Set up cross-system real-time integrations
 */
function setupCrossSystemIntegration(
  hrClient: ReturnType<typeof createHrApiClient>,
  payrollClient: ReturnType<typeof createPayrollApiClient>
) {
  // When an employee is terminated in HR, update their payroll records
  hrClient.on('employee.updated', (event: HrEvent) => {
    if (event.data.status === 'inactive') {
      console.log(`Employee ${event.data.id} has been terminated, updating payroll records`);
      
      // This would typically involve marking them as inactive in the payroll system
      // or ensuring they don't appear in future payroll runs
    }
  });
  
  // When a payroll is processed, update the HR system with payment info
  payrollClient.on('payrollPeriod.processed', (event: PayrollEvent) => {
    console.log(`Payroll period ${event.data.id} processed, updating HR system with payment data`);
    
    // This would typically involve updating the HR system with payment records
    // that could be displayed to employees in the HR portal
  });
}

/**
 * Example of setting up webhooks for integration
 */
function setupIntegrationWebhooks() {
  // This would be set up in your server endpoints
  console.log('Setting up webhooks for HR and Payroll integration');
  
  // Example of handling HR webhook
  const handleHrWebhook = (payload: any) => {
    console.log('Received HR webhook:', payload);
    
    // Example: If employee is terminated, update payroll
    if (payload.event === 'employee.terminated') {
      const employeeId = payload.data.id;
      console.log(`Employee ${employeeId} terminated, updating payroll`);
      
      // Logic to update payroll system
    }
  };
  
  // Example of handling Payroll webhook
  const handlePayrollWebhook = (payload: any) => {
    console.log('Received Payroll webhook:', payload);
    
    // Example: If payroll is processed, notify employees
    if (payload.event === 'payroll.processed') {
      const periodId = payload.data.id;
      console.log(`Payroll ${periodId} processed, notifying employees`);
      
      // Logic to notify employees
    }
  };
  
  // In a real application, these would be registered with your web server
  console.log('Webhook handlers prepared');
}

/**
 * Utility function to notify users of events
 */
function notifyUser(message: string) {
  // In a real application, this could be a toast notification, email, or other alert
  console.log(`NOTIFICATION: ${message}`);
  
  // Example of showing a browser notification if supported
  if (typeof window !== 'undefined' && 'Notification' in window) {
    // Check if notification permissions are granted
    if (Notification.permission === 'granted') {
      new Notification('System Notification', { body: message });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('System Notification', { body: message });
        }
      });
    }
  }
}

/**
 * Utility function to notify employees of payment
 */
function notifyPaymentToEmployee(payrollData: any) {
  // This would typically send an email or push notification to the employee
  console.log(`PAYMENT NOTIFICATION: Payment of $${payrollData.netPay} processed for employee ID ${payrollData.employeeId}`);
}

/**
 * Utility function to send payroll completion notifications
 */
function sendPayrollCompletionNotifications(periodId: string) {
  console.log(`Sending payroll completion notifications for period ${periodId}`);
  
  // This would typically involve emailing all employees or sending push notifications
  // to let them know their pay statements are available
}

// Export a convenience function to run all examples
export function runIntegrationExamples() {
  console.log('Running HR and Payroll integration examples with real-time communications');
  const integration = integrateHrAndPayroll();
  
  // Example of cleanup when the application is done with the integration
  setTimeout(() => {
    console.log('Cleaning up integration resources after 1 hour');
    integration.close();
  }, 3600000); // 1 hour
  
  return integration;
} 
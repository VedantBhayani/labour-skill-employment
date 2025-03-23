/**
 * Payroll System Integration
 * 
 * This module provides API clients for connecting to external payroll systems.
 * It handles authentication, data synchronization, and error recovery.
 */

import { ApiClient, apiRegistry, IntegrationType } from './api';
import axios from 'axios';

// Payroll system-specific configuration
export interface PayrollSystemConfig {
  baseUrl: string;
  authMethod: 'apiKey' | 'oauth2' | 'basic';
  credentials: {
    apiKey?: string;
    clientId?: string;
    clientSecret?: string;
    username?: string;
    password?: string;
  };
  syncInterval?: number; // in milliseconds
  webhookEndpoint?: string;
  encryptionKey?: string; // For sensitive data encryption
  websocketUrl?: string; // WebSocket endpoint URL
  realtimeUpdates?: boolean; // Enable real-time updates
}

// Payroll data types
export interface PayrollPeriod {
  id: string;
  startDate: string;
  endDate: string;
  processDate: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

export interface EmployeePayroll {
  id: string;
  employeeId: string;
  periodId: string;
  grossPay: number;
  netPay: number;
  deductions: Deduction[];
  taxes: Tax[];
  status: 'draft' | 'approved' | 'paid';
  paymentDate?: string;
  paymentMethod?: 'directDeposit' | 'check' | 'cash';
  bankAccount?: string; // Should be encrypted/masked
  accountingEntries?: AccountingEntry[];
}

export interface Deduction {
  id: string;
  type: string;
  description: string;
  amount: number;
  isPreTax: boolean;
}

export interface Tax {
  id: string;
  type: string;
  description: string;
  amount: number;
  taxableAmount: number;
  rate: number;
}

export interface AccountingEntry {
  id: string;
  type: 'debit' | 'credit';
  accountCode: string;
  amount: number;
  description: string;
}

// Real-time event types
export type PayrollEventType = 
  | 'payrollPeriod.created' 
  | 'payrollPeriod.updated'
  | 'payrollPeriod.processed'
  | 'employeePayroll.created'
  | 'employeePayroll.updated'
  | 'employeePayroll.approved'
  | 'employeePayroll.paid';

export interface PayrollEvent {
  type: PayrollEventType;
  timestamp: string;
  data: any;
}

// Event handler type
export type PayrollEventHandler = (event: PayrollEvent) => void;

// Payroll API client class
export class PayrollApiClient {
  private apiClient: ApiClient;
  private config: PayrollSystemConfig;
  private syncIntervalId?: number;
  private retryAttempts: Record<string, number> = {};
  private maxRetries = 3;
  private retryDelay = 5000; // 5 seconds
  private wsConnection?: WebSocket;
  private wsReconnectTimer?: number;
  private eventHandlers: Map<PayrollEventType, PayrollEventHandler[]> = new Map();
  private sseConnection?: EventSource;
  
  constructor(name: string, config: PayrollSystemConfig) {
    this.config = config;
    
    // Create or get API client
    if (apiRegistry.has(name)) {
      this.apiClient = apiRegistry.get(name)!;
    } else {
      // Convert Payroll config to API config
      const apiConfig = {
        baseUrl: config.baseUrl,
        timeout: 15000, // Longer timeout for payroll operations
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };
      
      // Add auth headers based on auth method
      if (config.authMethod === 'apiKey' && config.credentials.apiKey) {
        apiConfig.headers!['Authorization'] = `Bearer ${config.credentials.apiKey}`;
      } else if (config.authMethod === 'basic' && config.credentials.username && config.credentials.password) {
        const basicAuth = btoa(`${config.credentials.username}:${config.credentials.password}`);
        apiConfig.headers!['Authorization'] = `Basic ${basicAuth}`;
      }
      
      this.apiClient = apiRegistry.register(name, 'custom', apiConfig);
    }
    
    // Setup OAuth if needed
    if (config.authMethod === 'oauth2') {
      this.setupOAuth();
    }
    
    // Initialize real-time communications if enabled
    if (config.realtimeUpdates) {
      this.initializeRealTimeCommunication();
    }
  }
  
  /**
   * Setup OAuth authentication
   */
  private async setupOAuth() {
    if (!this.config.credentials.clientId || !this.config.credentials.clientSecret) {
      throw new Error('OAuth2 requires clientId and clientSecret');
    }
    
    try {
      // Request OAuth token
      const tokenResponse = await axios.post(`${this.config.baseUrl}/oauth/token`, {
        grant_type: 'client_credentials',
        client_id: this.config.credentials.clientId,
        client_secret: this.config.credentials.clientSecret,
        scope: 'payroll:read payroll:write'
      });
      
      const { access_token, expires_in } = tokenResponse.data;
      
      // Set the token in the API client
      this.apiClient['client'].defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      // Setup token refresh (5 minutes before expiry)
      const refreshTime = (expires_in - 300) * 1000;
      setTimeout(() => this.setupOAuth(), refreshTime);
      
    } catch (error) {
      console.error('Failed to obtain OAuth token:', error);
      // Retry after delay
      setTimeout(() => this.setupOAuth(), this.retryDelay);
    }
  }
  
  /**
   * Initialize real-time communication channels
   */
  private initializeRealTimeCommunication() {
    // Set up WebSocket connection if URL is provided
    if (this.config.websocketUrl) {
      this.setupWebSocketConnection();
    }
    
    // Set up Server-Sent Events connection as fallback or additional channel
    this.setupSSEConnection();
  }
  
  /**
   * Set up WebSocket connection for real-time updates
   */
  private setupWebSocketConnection() {
    if (!this.config.websocketUrl) return;
    
    try {
      // Create WebSocket with authentication
      let wsUrl = this.config.websocketUrl;
      
      // Append authentication as query parameters based on auth method
      if (this.config.authMethod === 'apiKey' && this.config.credentials.apiKey) {
        wsUrl += `?apiKey=${this.config.credentials.apiKey}`;
      } else if (this.config.authMethod === 'oauth2' && this.apiClient['client'].defaults.headers.common['Authorization']) {
        const token = this.apiClient['client'].defaults.headers.common['Authorization'].replace('Bearer ', '');
        wsUrl += `?token=${token}`;
      }
      
      // Create WebSocket connection
      this.wsConnection = new WebSocket(wsUrl);
      
      // Set up WebSocket event handlers
      this.wsConnection.onopen = this.handleWebSocketOpen.bind(this);
      this.wsConnection.onmessage = this.handleWebSocketMessage.bind(this);
      this.wsConnection.onerror = this.handleWebSocketError.bind(this);
      this.wsConnection.onclose = this.handleWebSocketClose.bind(this);
      
      console.log('Payroll WebSocket connection initialized');
    } catch (error) {
      console.error('Failed to initialize Payroll WebSocket connection:', error);
      // Attempt to reconnect after delay
      this.scheduleWebSocketReconnect();
    }
  }
  
  /**
   * Handle WebSocket connection open
   */
  private handleWebSocketOpen(event: Event) {
    console.log('Payroll WebSocket connection established');
    
    // Clear any reconnect timers
    if (this.wsReconnectTimer) {
      clearTimeout(this.wsReconnectTimer);
      this.wsReconnectTimer = undefined;
    }
    
    // Subscribe to relevant channels/topics
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify({
        action: 'subscribe',
        topics: ['payrollPeriods', 'employeePayrolls']
      }));
    }
  }
  
  /**
   * Handle WebSocket messages
   */
  private handleWebSocketMessage(event: MessageEvent) {
    try {
      const eventData = JSON.parse(event.data) as PayrollEvent;
      
      // Process the event based on type
      this.processPayrollEvent(eventData);
      
      // Update local cache
      this.updateLocalCache(eventData);
      
      // Log the event
      console.log(`Payroll WebSocket event received: ${eventData.type}`);
    } catch (error) {
      console.error('Error processing Payroll WebSocket message:', error, event.data);
    }
  }
  
  /**
   * Handle WebSocket errors
   */
  private handleWebSocketError(event: Event) {
    console.error('Payroll WebSocket error:', event);
  }
  
  /**
   * Handle WebSocket connection close
   */
  private handleWebSocketClose(event: CloseEvent) {
    console.log(`Payroll WebSocket connection closed: ${event.code} ${event.reason}`);
    
    // Attempt to reconnect
    this.scheduleWebSocketReconnect();
  }
  
  /**
   * Schedule WebSocket reconnection
   */
  private scheduleWebSocketReconnect() {
    if (this.wsReconnectTimer) {
      clearTimeout(this.wsReconnectTimer);
    }
    
    // Reconnect after a delay with exponential backoff
    const reconnectDelay = this.retryDelay * Math.pow(1.5, Math.min(this.retryAttempts['websocket'] || 0, 5));
    this.retryAttempts['websocket'] = (this.retryAttempts['websocket'] || 0) + 1;
    
    this.wsReconnectTimer = window.setTimeout(() => {
      console.log(`Attempting to reconnect Payroll WebSocket (attempt ${this.retryAttempts['websocket']})`);
      this.setupWebSocketConnection();
    }, reconnectDelay);
  }
  
  /**
   * Set up Server-Sent Events connection
   */
  private setupSSEConnection() {
    // Only set up SSE if WebSocket is not available or as a fallback
    if (this.wsConnection?.readyState === WebSocket.OPEN) return;
    
    try {
      // Create SSE connection with authentication
      let sseUrl = `${this.config.baseUrl}/events/payroll`;
      
      // Create headers for EventSource
      const headers: Record<string, string> = {};
      
      // Add authentication based on auth method
      if (this.config.authMethod === 'apiKey' && this.config.credentials.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.credentials.apiKey}`;
      } else if (this.config.authMethod === 'oauth2' && this.apiClient['client'].defaults.headers.common['Authorization']) {
        headers['Authorization'] = this.apiClient['client'].defaults.headers.common['Authorization'];
      }
      
      // Create SSE connection with polyfill if needed
      if (typeof EventSource !== 'undefined') {
        this.sseConnection = new EventSource(sseUrl, { 
          withCredentials: true,
          // @ts-ignore - Adding headers to EventSource
          headers
        });
        
        // Set up SSE event handlers
        this.sseConnection.onopen = () => console.log('Payroll SSE connection established');
        this.sseConnection.onerror = this.handleSSEError.bind(this);
        
        // Register event listeners for specific event types
        this.sseConnection.addEventListener('payrollPeriod', this.handleSSEEvent.bind(this));
        this.sseConnection.addEventListener('employeePayroll', this.handleSSEEvent.bind(this));
        
        console.log('Payroll SSE connection initialized');
      } else {
        console.warn('EventSource not supported in this browser, Payroll SSE unavailable');
      }
    } catch (error) {
      console.error('Failed to initialize Payroll SSE connection:', error);
    }
  }
  
  /**
   * Handle SSE errors
   */
  private handleSSEError(event: Event) {
    console.error('Payroll SSE connection error:', event);
    
    // Close current connection
    if (this.sseConnection) {
      this.sseConnection.close();
      this.sseConnection = undefined;
    }
    
    // Attempt to reconnect after delay
    setTimeout(() => this.setupSSEConnection(), this.retryDelay);
  }
  
  /**
   * Handle SSE events
   */
  private handleSSEEvent(event: MessageEvent) {
    try {
      const eventData = JSON.parse(event.data) as PayrollEvent;
      
      // Process the event based on type
      this.processPayrollEvent(eventData);
      
      // Update local cache
      this.updateLocalCache(eventData);
      
      // Log the event
      console.log(`Payroll SSE event received: ${eventData.type}`);
    } catch (error) {
      console.error('Error processing Payroll SSE event:', error, event.data);
    }
  }
  
  /**
   * Process Payroll events from real-time sources
   */
  private processPayrollEvent(event: PayrollEvent) {
    // Trigger registered event handlers for this event type
    const handlers = this.eventHandlers.get(event.type) || [];
    handlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error(`Error in event handler for ${event.type}:`, error);
      }
    });
  }
  
  /**
   * Update local cache based on real-time events
   */
  private updateLocalCache(event: PayrollEvent) {
    try {
      if (event.type.startsWith('payrollPeriod')) {
        // Handle payroll period events
        const periods = JSON.parse(localStorage.getItem('payroll_periods') || '[]');
        
        if (event.type === 'payrollPeriod.created') {
          periods.push(event.data);
        } else if (event.type === 'payrollPeriod.updated' || event.type === 'payrollPeriod.processed') {
          const index = periods.findIndex((p: any) => p.id === event.data.id);
          if (index !== -1) {
            periods[index] = { ...periods[index], ...event.data };
          }
        }
        
        localStorage.setItem('payroll_periods', JSON.stringify(periods));
      } 
      else if (event.type.startsWith('employeePayroll')) {
        // Handle employee payroll events - we need to know which period
        if (!event.data.periodId) return;
        
        const payrolls = JSON.parse(
          localStorage.getItem(`payroll_employee_${event.data.periodId}`) || '[]'
        );
        
        if (event.type === 'employeePayroll.created') {
          payrolls.push(event.data);
        } else if (event.type.includes('updated') || event.type.includes('approved') || event.type.includes('paid')) {
          const index = payrolls.findIndex((p: any) => p.id === event.data.id);
          if (index !== -1) {
            payrolls[index] = { ...payrolls[index], ...event.data };
          }
        }
        
        localStorage.setItem(`payroll_employee_${event.data.periodId}`, JSON.stringify(payrolls));
      }
    } catch (error) {
      console.error('Error updating payroll local cache:', error);
    }
  }
  
  /**
   * Register an event handler for a specific event type
   */
  on(eventType: PayrollEventType, handler: PayrollEventHandler): void {
    const handlers = this.eventHandlers.get(eventType) || [];
    handlers.push(handler);
    this.eventHandlers.set(eventType, handlers);
  }
  
  /**
   * Remove an event handler
   */
  off(eventType: PayrollEventType, handler: PayrollEventHandler): void {
    const handlers = this.eventHandlers.get(eventType) || [];
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
      this.eventHandlers.set(eventType, handlers);
    }
  }
  
  /**
   * Send an event to the Payroll system
   */
  async sendEvent(event: Omit<PayrollEvent, 'timestamp'>): Promise<void> {
    // Add timestamp
    const fullEvent: PayrollEvent = {
      ...event,
      timestamp: new Date().toISOString()
    };
    
    // Send via WebSocket if connected
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify(fullEvent));
      return;
    }
    
    // Fall back to REST API
    return this.apiRequest(
      () => this.apiClient.post<void>('/events', fullEvent),
      '/events'
    ).then(() => {
      this.logApiActivity('POST', '/events', 'success');
    }).catch(error => {
      this.logApiActivity('POST', '/events', 'error', error);
      throw error;
    });
  }
  
  /**
   * Start scheduled data synchronization
   */
  startSync() {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
    }
    
    const interval = this.config.syncInterval || 7200000; // Default 2 hours
    this.syncIntervalId = window.setInterval(() => {
      this.syncPayrollPeriods();
      this.syncEmployeePayrolls();
    }, interval);
    
    // Sync immediately
    this.syncPayrollPeriods();
    this.syncEmployeePayrolls();
  }
  
  /**
   * Stop scheduled data synchronization
   */
  stopSync() {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = undefined;
    }
  }
  
  /**
   * Close all real-time connections
   */
  close() {
    // Close WebSocket
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = undefined;
    }
    
    // Clear reconnect timer
    if (this.wsReconnectTimer) {
      clearTimeout(this.wsReconnectTimer);
      this.wsReconnectTimer = undefined;
    }
    
    // Close SSE connection
    if (this.sseConnection) {
      this.sseConnection.close();
      this.sseConnection = undefined;
    }
    
    // Stop sync interval
    this.stopSync();
    
    console.log('Payroll API client closed');
  }
  
  /**
   * Handles API request with retry logic
   */
  private async apiRequest<T>(
    requestFn: () => Promise<T>,
    endpoint: string
  ): Promise<T> {
    try {
      return await requestFn();
    } catch (error) {
      const currentAttempt = this.retryAttempts[endpoint] || 0;
      
      if (currentAttempt < this.maxRetries) {
        this.retryAttempts[endpoint] = currentAttempt + 1;
        console.log(`Retrying ${endpoint} (attempt ${currentAttempt + 1}/${this.maxRetries})...`);
        
        // Exponential backoff
        const delay = this.retryDelay * Math.pow(2, currentAttempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return this.apiRequest(requestFn, endpoint);
      } else {
        // Reset retry counter but don't retry
        this.retryAttempts[endpoint] = 0;
        console.error(`Failed to execute ${endpoint} after ${this.maxRetries} attempts`);
        throw error;
      }
    }
  }
  
  /**
   * Logs API activity with timestamps
   */
  private logApiActivity(action: string, endpoint: string, status: 'success' | 'error', data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      action,
      endpoint,
      status,
      data: status === 'error' ? data : undefined
    };
    
    console.log(`Payroll API [${timestamp}] ${action} ${endpoint} - ${status}`);
    
    // Could extend with server-side logging or monitoring
  }
  
  /**
   * Encrypt sensitive data
   */
  private encryptData(data: string): string {
    if (!this.config.encryptionKey) {
      console.warn('Encryption key not provided, data will not be encrypted');
      return data;
    }
    
    // Simple encryption for demonstration (in production, use a proper encryption library)
    // This is just a placeholder - implement proper encryption in a real application
    return btoa(`${this.config.encryptionKey}:${data}`);
  }
  
  /**
   * Decrypt sensitive data
   */
  private decryptData(encryptedData: string): string {
    if (!this.config.encryptionKey) {
      console.warn('Encryption key not provided, cannot decrypt data');
      return encryptedData;
    }
    
    // Simple decryption for demonstration
    const decoded = atob(encryptedData);
    const parts = decoded.split(':');
    
    if (parts.length !== 2 || parts[0] !== this.config.encryptionKey) {
      throw new Error('Invalid encrypted data or wrong encryption key');
    }
    
    return parts[1];
  }
  
  // ===== Payroll Period Endpoints =====
  
  /**
   * Get all payroll periods
   */
  async getPayrollPeriods(): Promise<PayrollPeriod[]> {
    return this.apiRequest(
      () => this.apiClient.get<PayrollPeriod[]>('/payroll-periods'),
      '/payroll-periods'
    ).then(data => {
      this.logApiActivity('GET', '/payroll-periods', 'success');
      return data;
    }).catch(error => {
      this.logApiActivity('GET', '/payroll-periods', 'error', error);
      throw error;
    });
  }
  
  /**
   * Get payroll period by ID
   */
  async getPayrollPeriod(id: string): Promise<PayrollPeriod> {
    return this.apiRequest(
      () => this.apiClient.get<PayrollPeriod>(`/payroll-periods/${id}`),
      `/payroll-periods/${id}`
    ).then(data => {
      this.logApiActivity('GET', `/payroll-periods/${id}`, 'success');
      return data;
    }).catch(error => {
      this.logApiActivity('GET', `/payroll-periods/${id}`, 'error', error);
      throw error;
    });
  }
  
  /**
   * Create a new payroll period
   */
  async createPayrollPeriod(period: Omit<PayrollPeriod, 'id'>): Promise<PayrollPeriod> {
    return this.apiRequest(
      () => this.apiClient.post<PayrollPeriod>('/payroll-periods', period),
      '/payroll-periods'
    ).then(data => {
      this.logApiActivity('POST', '/payroll-periods', 'success');
      
      // Emit real-time event
      this.sendEvent({
        type: 'payrollPeriod.created',
        data
      }).catch(error => console.error('Failed to send real-time event:', error));
      
      return data;
    }).catch(error => {
      this.logApiActivity('POST', '/payroll-periods', 'error', error);
      throw error;
    });
  }
  
  /**
   * Update an existing payroll period
   */
  async updatePayrollPeriod(id: string, period: Partial<PayrollPeriod>): Promise<PayrollPeriod> {
    return this.apiRequest(
      () => this.apiClient.put<PayrollPeriod>(`/payroll-periods/${id}`, period),
      `/payroll-periods/${id}`
    ).then(data => {
      this.logApiActivity('PUT', `/payroll-periods/${id}`, 'success');
      
      // Emit real-time event
      this.sendEvent({
        type: 'payrollPeriod.updated',
        data
      }).catch(error => console.error('Failed to send real-time event:', error));
      
      return data;
    }).catch(error => {
      this.logApiActivity('PUT', `/payroll-periods/${id}`, 'error', error);
      throw error;
    });
  }
  
  // ===== Employee Payroll Endpoints =====
  
  /**
   * Get all employee payrolls for a period
   */
  async getEmployeePayrolls(periodId: string): Promise<EmployeePayroll[]> {
    return this.apiRequest(
      () => this.apiClient.get<EmployeePayroll[]>(`/payroll-periods/${periodId}/employee-payrolls`),
      `/payroll-periods/${periodId}/employee-payrolls`
    ).then(data => {
      this.logApiActivity('GET', `/payroll-periods/${periodId}/employee-payrolls`, 'success');
      
      // Decrypt sensitive data
      return data.map(payroll => ({
        ...payroll,
        bankAccount: payroll.bankAccount ? this.decryptData(payroll.bankAccount) : undefined
      }));
    }).catch(error => {
      this.logApiActivity('GET', `/payroll-periods/${periodId}/employee-payrolls`, 'error', error);
      throw error;
    });
  }
  
  /**
   * Get employee payroll by ID
   */
  async getEmployeePayroll(periodId: string, employeePayrollId: string): Promise<EmployeePayroll> {
    return this.apiRequest(
      () => this.apiClient.get<EmployeePayroll>(
        `/payroll-periods/${periodId}/employee-payrolls/${employeePayrollId}`
      ),
      `/payroll-periods/${periodId}/employee-payrolls/${employeePayrollId}`
    ).then(data => {
      this.logApiActivity(
        'GET', 
        `/payroll-periods/${periodId}/employee-payrolls/${employeePayrollId}`, 
        'success'
      );
      
      // Decrypt sensitive data
      return {
        ...data,
        bankAccount: data.bankAccount ? this.decryptData(data.bankAccount) : undefined
      };
    }).catch(error => {
      this.logApiActivity(
        'GET', 
        `/payroll-periods/${periodId}/employee-payrolls/${employeePayrollId}`, 
        'error',
        error
      );
      throw error;
    });
  }
  
  /**
   * Create a new employee payroll
   */
  async createEmployeePayroll(
    periodId: string, 
    employeePayroll: Omit<EmployeePayroll, 'id'>
  ): Promise<EmployeePayroll> {
    // Encrypt sensitive data
    const payloadWithEncryptedData = {
      ...employeePayroll,
      bankAccount: employeePayroll.bankAccount 
        ? this.encryptData(employeePayroll.bankAccount) 
        : undefined
    };
    
    return this.apiRequest(
      () => this.apiClient.post<EmployeePayroll>(
        `/payroll-periods/${periodId}/employee-payrolls`, 
        payloadWithEncryptedData
      ),
      `/payroll-periods/${periodId}/employee-payrolls`
    ).then(data => {
      this.logApiActivity('POST', `/payroll-periods/${periodId}/employee-payrolls`, 'success');
      
      // Decrypt data for client use
      const decryptedData = {
        ...data,
        bankAccount: data.bankAccount ? this.decryptData(data.bankAccount) : undefined
      };
      
      // Emit real-time event
      this.sendEvent({
        type: 'employeePayroll.created',
        data: { ...decryptedData, periodId }  // Make sure periodId is included
      }).catch(error => console.error('Failed to send real-time event:', error));
      
      // Return decrypted data
      return decryptedData;
    }).catch(error => {
      this.logApiActivity('POST', `/payroll-periods/${periodId}/employee-payrolls`, 'error', error);
      throw error;
    });
  }
  
  /**
   * Update an existing employee payroll
   */
  async updateEmployeePayroll(
    periodId: string,
    employeePayrollId: string,
    employeePayroll: Partial<EmployeePayroll>
  ): Promise<EmployeePayroll> {
    // Encrypt sensitive data
    const payloadWithEncryptedData = {
      ...employeePayroll,
      bankAccount: employeePayroll.bankAccount 
        ? this.encryptData(employeePayroll.bankAccount) 
        : undefined
    };
    
    return this.apiRequest(
      () => this.apiClient.put<EmployeePayroll>(
        `/payroll-periods/${periodId}/employee-payrolls/${employeePayrollId}`, 
        payloadWithEncryptedData
      ),
      `/payroll-periods/${periodId}/employee-payrolls/${employeePayrollId}`
    ).then(data => {
      this.logApiActivity(
        'PUT', 
        `/payroll-periods/${periodId}/employee-payrolls/${employeePayrollId}`, 
        'success'
      );
      
      // Decrypt data for client use
      const decryptedData = {
        ...data,
        bankAccount: data.bankAccount ? this.decryptData(data.bankAccount) : undefined
      };
      
      // Emit real-time event
      this.sendEvent({
        type: 'employeePayroll.updated',
        data: { ...decryptedData, periodId }  // Make sure periodId is included
      }).catch(error => console.error('Failed to send real-time event:', error));
      
      // Return decrypted data
      return decryptedData;
    }).catch(error => {
      this.logApiActivity(
        'PUT', 
        `/payroll-periods/${periodId}/employee-payrolls/${employeePayrollId}`, 
        'error',
        error
      );
      throw error;
    });
  }
  
  /**
   * Process payroll for a period
   */
  async processPayroll(periodId: string): Promise<PayrollPeriod> {
    return this.apiRequest(
      () => this.apiClient.post<PayrollPeriod>(
        `/payroll-periods/${periodId}/process`, 
        {}
      ),
      `/payroll-periods/${periodId}/process`
    ).then(data => {
      this.logApiActivity('POST', `/payroll-periods/${periodId}/process`, 'success');
      
      // Emit real-time event
      this.sendEvent({
        type: 'payrollPeriod.processed',
        data
      }).catch(error => console.error('Failed to send real-time event:', error));
      
      return data;
    }).catch(error => {
      this.logApiActivity('POST', `/payroll-periods/${periodId}/process`, 'error', error);
      throw error;
    });
  }
  
  /**
   * Approve an employee payroll
   */
  async approveEmployeePayroll(periodId: string, employeePayrollId: string): Promise<EmployeePayroll> {
    return this.apiRequest(
      () => this.apiClient.post<EmployeePayroll>(
        `/payroll-periods/${periodId}/employee-payrolls/${employeePayrollId}/approve`, 
        {}
      ),
      `/payroll-periods/${periodId}/employee-payrolls/${employeePayrollId}/approve`
    ).then(data => {
      this.logApiActivity(
        'POST', 
        `/payroll-periods/${periodId}/employee-payrolls/${employeePayrollId}/approve`, 
        'success'
      );
      
      // Decrypt data for client use
      const decryptedData = {
        ...data,
        bankAccount: data.bankAccount ? this.decryptData(data.bankAccount) : undefined
      };
      
      // Emit real-time event
      this.sendEvent({
        type: 'employeePayroll.approved',
        data: { ...decryptedData, periodId }  // Make sure periodId is included
      }).catch(error => console.error('Failed to send real-time event:', error));
      
      // Return decrypted data
      return decryptedData;
    }).catch(error => {
      this.logApiActivity(
        'POST', 
        `/payroll-periods/${periodId}/employee-payrolls/${employeePayrollId}/approve`, 
        'error',
        error
      );
      throw error;
    });
  }
  
  // ===== Synchronization Methods =====
  
  /**
   * Synchronize payroll periods data
   */
  private async syncPayrollPeriods(): Promise<void> {
    try {
      const payrollPeriods = await this.getPayrollPeriods();
      localStorage.setItem('payroll_periods', JSON.stringify(payrollPeriods));
      console.log(`Synchronized ${payrollPeriods.length} payroll periods`);
    } catch (error) {
      console.error('Failed to sync payroll periods:', error);
    }
  }
  
  /**
   * Synchronize employee payrolls data for active periods
   */
  private async syncEmployeePayrolls(): Promise<void> {
    try {
      const payrollPeriods = await this.getPayrollPeriods();
      const activePeriods = payrollPeriods.filter(
        period => ['pending', 'processing'].includes(period.status)
      );
      
      for (const period of activePeriods) {
        const employeePayrolls = await this.getEmployeePayrolls(period.id);
        localStorage.setItem(`payroll_employee_${period.id}`, JSON.stringify(employeePayrolls));
        console.log(`Synchronized ${employeePayrolls.length} employee payrolls for period ${period.id}`);
      }
    } catch (error) {
      console.error('Failed to sync employee payrolls:', error);
    }
  }
  
  /**
   * Generate payroll reports
   */
  async generateReport(periodId: string, reportType: 'summary' | 'detailed'): Promise<Blob> {
    return this.apiRequest(
      () => this.apiClient.request<Blob>({
        method: 'GET',
        url: `/payroll-periods/${periodId}/reports/${reportType}`,
        responseType: 'blob'
      }),
      `/payroll-periods/${periodId}/reports/${reportType}`
    ).then(data => {
      this.logApiActivity(
        'GET', 
        `/payroll-periods/${periodId}/reports/${reportType}`, 
        'success'
      );
      return data;
    }).catch(error => {
      this.logApiActivity(
        'GET', 
        `/payroll-periods/${periodId}/reports/${reportType}`, 
        'error',
        error
      );
      throw error;
    });
  }
}

// Export a factory function to create Payroll API clients
export function createPayrollApiClient(name: string, config: PayrollSystemConfig): PayrollApiClient {
  return new PayrollApiClient(name, config);
} 
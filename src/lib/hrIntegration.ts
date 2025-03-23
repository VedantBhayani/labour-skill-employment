/**
 * HR System Integration
 * 
 * This module provides API clients for connecting to external HR systems.
 * It handles authentication, data synchronization, and error recovery.
 */

import { ApiClient, apiRegistry, IntegrationType } from './api';
import axios from 'axios';

// HR system-specific configuration
export interface HrSystemConfig {
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
  websocketUrl?: string; // WebSocket endpoint URL
  realtimeUpdates?: boolean; // Enable real-time updates
}

// HR data types
export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  hireDate: string;
  status: 'active' | 'inactive' | 'onLeave';
  managerId?: string;
  [key: string]: any; // For additional custom fields
}

export interface Department {
  id: string;
  name: string;
  code: string;
  managerId?: string;
  parentDepartmentId?: string;
}

export interface Position {
  id: string;
  title: string;
  code: string;
  departmentId: string;
  level: number;
  [key: string]: any;
}

// Real-time event types
export type HrEventType = 
  | 'employee.created' 
  | 'employee.updated' 
  | 'employee.deleted'
  | 'department.created'
  | 'department.updated'
  | 'department.deleted'
  | 'position.created'
  | 'position.updated'
  | 'position.deleted';

export interface HrEvent {
  type: HrEventType;
  timestamp: string;
  data: any;
}

// Event handler type
export type HrEventHandler = (event: HrEvent) => void;

// HR API client class
export class HrApiClient {
  private apiClient: ApiClient;
  private config: HrSystemConfig;
  private syncIntervalId?: number;
  private retryAttempts: Record<string, number> = {};
  private maxRetries = 3;
  private retryDelay = 5000; // 5 seconds
  private wsConnection?: WebSocket;
  private wsReconnectTimer?: number;
  private eventHandlers: Map<HrEventType, HrEventHandler[]> = new Map();
  private sseConnection?: EventSource;
  
  constructor(name: string, config: HrSystemConfig) {
    this.config = config;
    
    // Create or get API client
    if (apiRegistry.has(name)) {
      this.apiClient = apiRegistry.get(name)!;
    } else {
      // Convert HR config to API config
      const apiConfig = {
        baseUrl: config.baseUrl,
        timeout: 10000,
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
      
      this.apiClient = apiRegistry.register(name, 'hrms', apiConfig);
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
        client_secret: this.config.credentials.clientSecret
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
      
      console.log('WebSocket connection initialized');
    } catch (error) {
      console.error('Failed to initialize WebSocket connection:', error);
      // Attempt to reconnect after delay
      this.scheduleWebSocketReconnect();
    }
  }
  
  /**
   * Handle WebSocket connection open
   */
  private handleWebSocketOpen(event: Event) {
    console.log('WebSocket connection established');
    
    // Clear any reconnect timers
    if (this.wsReconnectTimer) {
      clearTimeout(this.wsReconnectTimer);
      this.wsReconnectTimer = undefined;
    }
    
    // Subscribe to relevant channels/topics
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify({
        action: 'subscribe',
        topics: ['employees', 'departments', 'positions']
      }));
    }
  }
  
  /**
   * Handle WebSocket messages
   */
  private handleWebSocketMessage(event: MessageEvent) {
    try {
      const eventData = JSON.parse(event.data) as HrEvent;
      
      // Process the event based on type
      this.processHrEvent(eventData);
      
      // Update local cache
      this.updateLocalCache(eventData);
      
      // Log the event
      console.log(`WebSocket event received: ${eventData.type}`);
    } catch (error) {
      console.error('Error processing WebSocket message:', error, event.data);
    }
  }
  
  /**
   * Handle WebSocket errors
   */
  private handleWebSocketError(event: Event) {
    console.error('WebSocket error:', event);
  }
  
  /**
   * Handle WebSocket connection close
   */
  private handleWebSocketClose(event: CloseEvent) {
    console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
    
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
      console.log(`Attempting to reconnect WebSocket (attempt ${this.retryAttempts['websocket']})`);
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
      let sseUrl = `${this.config.baseUrl}/events/hr`;
      
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
        this.sseConnection.onopen = () => console.log('SSE connection established');
        this.sseConnection.onerror = this.handleSSEError.bind(this);
        
        // Register event listeners for specific event types
        this.sseConnection.addEventListener('employee', this.handleSSEEvent.bind(this));
        this.sseConnection.addEventListener('department', this.handleSSEEvent.bind(this));
        this.sseConnection.addEventListener('position', this.handleSSEEvent.bind(this));
        
        console.log('SSE connection initialized');
      } else {
        console.warn('EventSource not supported in this browser, SSE unavailable');
      }
    } catch (error) {
      console.error('Failed to initialize SSE connection:', error);
    }
  }
  
  /**
   * Handle SSE errors
   */
  private handleSSEError(event: Event) {
    console.error('SSE connection error:', event);
    
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
      const eventData = JSON.parse(event.data) as HrEvent;
      
      // Process the event based on type
      this.processHrEvent(eventData);
      
      // Update local cache
      this.updateLocalCache(eventData);
      
      // Log the event
      console.log(`SSE event received: ${eventData.type}`);
    } catch (error) {
      console.error('Error processing SSE event:', error, event.data);
    }
  }
  
  /**
   * Process HR events from real-time sources
   */
  private processHrEvent(event: HrEvent) {
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
  private updateLocalCache(event: HrEvent) {
    // Update localStorage or other cache
    const storageKey = event.type.split('.')[0] + 's'; // e.g., 'employee.created' -> 'employees'
    
    try {
      const existingCache = localStorage.getItem(`hr_${storageKey}`);
      if (!existingCache) return;
      
      const items = JSON.parse(existingCache);
      
      if (event.type.endsWith('.created')) {
        // Add new item to cache
        items.push(event.data);
      } else if (event.type.endsWith('.updated')) {
        // Update existing item
        const index = items.findIndex((item: any) => item.id === event.data.id);
        if (index !== -1) {
          items[index] = { ...items[index], ...event.data };
        }
      } else if (event.type.endsWith('.deleted')) {
        // Remove item from cache
        const index = items.findIndex((item: any) => item.id === event.data.id);
        if (index !== -1) {
          items.splice(index, 1);
        }
      }
      
      // Save updated cache
      localStorage.setItem(`hr_${storageKey}`, JSON.stringify(items));
    } catch (error) {
      console.error('Error updating local cache:', error);
    }
  }
  
  /**
   * Register an event handler for a specific event type
   */
  on(eventType: HrEventType, handler: HrEventHandler): void {
    const handlers = this.eventHandlers.get(eventType) || [];
    handlers.push(handler);
    this.eventHandlers.set(eventType, handlers);
  }
  
  /**
   * Remove an event handler
   */
  off(eventType: HrEventType, handler: HrEventHandler): void {
    const handlers = this.eventHandlers.get(eventType) || [];
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
      this.eventHandlers.set(eventType, handlers);
    }
  }
  
  /**
   * Send an event to the HR system
   */
  async sendEvent(event: Omit<HrEvent, 'timestamp'>): Promise<void> {
    // Add timestamp
    const fullEvent: HrEvent = {
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
    
    const interval = this.config.syncInterval || 3600000; // Default 1 hour
    this.syncIntervalId = window.setInterval(() => {
      this.syncEmployees();
      this.syncDepartments();
      this.syncPositions();
    }, interval);
    
    // Sync immediately
    this.syncEmployees();
    this.syncDepartments();
    this.syncPositions();
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
    
    console.log('HR API client closed');
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
    
    console.log(`HR API [${timestamp}] ${action} ${endpoint} - ${status}`);
    
    // Could extend with server-side logging or monitoring
  }
  
  // ===== Employee Endpoints =====
  
  /**
   * Get all employees
   */
  async getEmployees(): Promise<Employee[]> {
    return this.apiRequest(
      () => this.apiClient.get<Employee[]>('/employees'),
      '/employees'
    ).then(data => {
      this.logApiActivity('GET', '/employees', 'success');
      return data;
    }).catch(error => {
      this.logApiActivity('GET', '/employees', 'error', error);
      throw error;
    });
  }
  
  /**
   * Get employee by ID
   */
  async getEmployee(id: string): Promise<Employee> {
    return this.apiRequest(
      () => this.apiClient.get<Employee>(`/employees/${id}`),
      `/employees/${id}`
    ).then(data => {
      this.logApiActivity('GET', `/employees/${id}`, 'success');
      return data;
    }).catch(error => {
      this.logApiActivity('GET', `/employees/${id}`, 'error', error);
      throw error;
    });
  }
  
  /**
   * Create a new employee
   */
  async createEmployee(employee: Omit<Employee, 'id'>): Promise<Employee> {
    return this.apiRequest(
      () => this.apiClient.post<Employee>('/employees', employee),
      '/employees'
    ).then(data => {
      this.logApiActivity('POST', '/employees', 'success');
      
      // Emit real-time event
      this.sendEvent({
        type: 'employee.created',
        data
      }).catch(error => console.error('Failed to send real-time event:', error));
      
      return data;
    }).catch(error => {
      this.logApiActivity('POST', '/employees', 'error', error);
      throw error;
    });
  }
  
  /**
   * Update an existing employee
   */
  async updateEmployee(id: string, employee: Partial<Employee>): Promise<Employee> {
    return this.apiRequest(
      () => this.apiClient.put<Employee>(`/employees/${id}`, employee),
      `/employees/${id}`
    ).then(data => {
      this.logApiActivity('PUT', `/employees/${id}`, 'success');
      
      // Emit real-time event
      this.sendEvent({
        type: 'employee.updated',
        data
      }).catch(error => console.error('Failed to send real-time event:', error));
      
      return data;
    }).catch(error => {
      this.logApiActivity('PUT', `/employees/${id}`, 'error', error);
      throw error;
    });
  }
  
  /**
   * Delete an employee
   */
  async deleteEmployee(id: string): Promise<void> {
    return this.apiRequest(
      () => this.apiClient.delete<void>(`/employees/${id}`),
      `/employees/${id}`
    ).then(() => {
      this.logApiActivity('DELETE', `/employees/${id}`, 'success');
      
      // Emit real-time event
      this.sendEvent({
        type: 'employee.deleted',
        data: { id }
      }).catch(error => console.error('Failed to send real-time event:', error));
    }).catch(error => {
      this.logApiActivity('DELETE', `/employees/${id}`, 'error', error);
      throw error;
    });
  }
  
  // ===== Department Endpoints =====
  
  /**
   * Get all departments
   */
  async getDepartments(): Promise<Department[]> {
    return this.apiRequest(
      () => this.apiClient.get<Department[]>('/departments'),
      '/departments'
    ).then(data => {
      this.logApiActivity('GET', '/departments', 'success');
      return data;
    }).catch(error => {
      this.logApiActivity('GET', '/departments', 'error', error);
      throw error;
    });
  }
  
  /**
   * Get department by ID
   */
  async getDepartment(id: string): Promise<Department> {
    return this.apiRequest(
      () => this.apiClient.get<Department>(`/departments/${id}`),
      `/departments/${id}`
    ).then(data => {
      this.logApiActivity('GET', `/departments/${id}`, 'success');
      return data;
    }).catch(error => {
      this.logApiActivity('GET', `/departments/${id}`, 'error', error);
      throw error;
    });
  }
  
  // ===== Position Endpoints =====
  
  /**
   * Get all positions
   */
  async getPositions(): Promise<Position[]> {
    return this.apiRequest(
      () => this.apiClient.get<Position[]>('/positions'),
      '/positions'
    ).then(data => {
      this.logApiActivity('GET', '/positions', 'success');
      return data;
    }).catch(error => {
      this.logApiActivity('GET', '/positions', 'error', error);
      throw error;
    });
  }
  
  /**
   * Get position by ID
   */
  async getPosition(id: string): Promise<Position> {
    return this.apiRequest(
      () => this.apiClient.get<Position>(`/positions/${id}`),
      `/positions/${id}`
    ).then(data => {
      this.logApiActivity('GET', `/positions/${id}`, 'success');
      return data;
    }).catch(error => {
      this.logApiActivity('GET', `/positions/${id}`, 'error', error);
      throw error;
    });
  }
  
  // ===== Synchronization Methods =====
  
  /**
   * Synchronize employees data
   */
  private async syncEmployees(): Promise<void> {
    try {
      const employees = await this.getEmployees();
      // Store in local storage, state management, or dispatch to a data store
      localStorage.setItem('hr_employees', JSON.stringify(employees));
      console.log(`Synchronized ${employees.length} employees`);
    } catch (error) {
      console.error('Failed to sync employees:', error);
    }
  }
  
  /**
   * Synchronize departments data
   */
  private async syncDepartments(): Promise<void> {
    try {
      const departments = await this.getDepartments();
      localStorage.setItem('hr_departments', JSON.stringify(departments));
      console.log(`Synchronized ${departments.length} departments`);
    } catch (error) {
      console.error('Failed to sync departments:', error);
    }
  }
  
  /**
   * Synchronize positions data
   */
  private async syncPositions(): Promise<void> {
    try {
      const positions = await this.getPositions();
      localStorage.setItem('hr_positions', JSON.stringify(positions));
      console.log(`Synchronized ${positions.length} positions`);
    } catch (error) {
      console.error('Failed to sync positions:', error);
    }
  }
}

// Export a factory function to create HR API clients
export function createHrApiClient(name: string, config: HrSystemConfig): HrApiClient {
  return new HrApiClient(name, config);
} 
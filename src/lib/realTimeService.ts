import { websocketService, WebSocketMessage } from './websocketService';
import { notificationService } from './notificationService';
import { User } from '@/components/CommunicationProvider';
import { toast } from '@/hooks/use-toast';

// Disable mock mode for real backend connection
export const MOCK_MODE = false;

interface RealTimeServiceOptions {
  userId: string;
  authToken: string;
  websocketUrl?: string;
  enablePushNotifications?: boolean;
  onUserStatusChange?: (userId: string, status: 'online' | 'offline' | 'away') => void;
  onNotificationReceived?: (notification: any) => void;
  onMessageReceived?: (message: any) => void;
  onConnectionStatusChange?: (status: 'connected' | 'connecting' | 'disconnected' | 'reconnecting') => void;
}

class RealTimeService {
  private initialized = false;
  private options: RealTimeServiceOptions | null = null;
  private processedMessageIds: Set<string> | null = null;
  
  /**
   * Initialize all real-time services
   */
  public async initialize(options: RealTimeServiceOptions): Promise<boolean> {
    if (this.initialized) {
      console.warn('RealTimeService already initialized');
      return true;
    }
    
    this.options = {
      ...options,
      websocketUrl: options.websocketUrl || 'ws://localhost:8080'
    };
    
    try {
      // Check if we're in mock mode
      if (MOCK_MODE) {
        console.info('🧪 RealTimeService running in MOCK MODE');
        
        // In mock mode, we'll simulate a connection
        if (this.options.onConnectionStatusChange) {
          // Simulate connecting
          this.options.onConnectionStatusChange('connecting');
          
          // Simulate successful connection after a short delay
          setTimeout(() => {
            if (this.options?.onConnectionStatusChange) {
              this.options.onConnectionStatusChange('connected');
              
              toast({
                title: 'Connected (Mock)',
                description: 'Successfully connected to mock WebSocket service',
              });
            }
          }, 1500);
        }
        
        this.initialized = true;
        return true;
      }
      
      // Real initialization for production
      // Initialize WebSocket service
      if (options.websocketUrl) {
        // Only override the default URL if specified
        websocketService.setUrl(options.websocketUrl);
      }
      
      websocketService.setCredentials(options.userId, options.authToken);
      
      // Set up event handlers for WebSocket
      this.setupWebSocketEventHandlers();
      
      // Connect to WebSocket
      await websocketService.connect();
      
      // Initialize push notifications if requested
      if (options.enablePushNotifications) {
        await this.initializePushNotifications();
      }
      
      this.initialized = true;
      
      return true;
    } catch (error) {
      console.error('Failed to initialize real-time services:', error);
      return false;
    }
  }
  
  /**
   * Update user ID and auth token (e.g., after user login/switch)
   */
  public updateCredentials(userId: string, authToken: string): void {
    if (!this.initialized) {
      console.warn('RealTimeService not initialized');
      return;
    }
    
    if (this.options) {
      this.options.userId = userId;
      this.options.authToken = authToken;
    }
    
    websocketService.setCredentials(userId, authToken);
    
    // Reconnect with new credentials
    websocketService.disconnect();
    websocketService.connect().catch(console.error);
  }
  
  /**
   * Set up WebSocket event handlers
   */
  private setupWebSocketEventHandlers(): void {
    if (!this.options) return;
    
    // Connection status change
    websocketService.onStatusChange((status) => {
      if (this.options?.onConnectionStatusChange) {
        this.options.onConnectionStatusChange(status);
      }
      
      // Show toast notifications for status changes
      switch (status) {
        case 'connected':
          toast({
            title: 'Connected',
            description: 'You are now connected to the server',
          });
          break;
        case 'disconnected':
          toast({
            title: 'Disconnected',
            description: 'You have been disconnected from the server',
            variant: 'destructive',
          });
          break;
        case 'reconnecting':
          toast({
            title: 'Reconnecting',
            description: 'Attempting to reconnect to the server...',
          });
          break;
      }
    });
    
    // Register handlers for all message types using our centralized handler
    websocketService.on('MESSAGE', this.handleWebSocketMessage.bind(this));
    websocketService.on('NOTIFICATION', this.handleWebSocketMessage.bind(this));
    websocketService.on('USER_STATUS', this.handleWebSocketMessage.bind(this));
    websocketService.on('CONNECT', this.handleWebSocketMessage.bind(this));
    websocketService.on('DISCONNECT', this.handleWebSocketMessage.bind(this));
  }
  
  /**
   * Initialize push notifications
   */
  private async initializePushNotifications(): Promise<boolean> {
    if (!notificationService.isSupported()) {
      console.warn('Push notifications are not supported in this browser');
      return false;
    }
    
    const permission = await notificationService.getPermissionStatus();
    
    if (permission === 'default') {
      // Ask for permission
      try {
        const newPermission = await notificationService.requestPermission();
        return newPermission === 'granted';
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
      }
    }
    
    return permission === 'granted';
  }
  
  /**
   * Show a browser notification for an incoming notification
   */
  private showBrowserNotification(notification: any): void {
    if (!notification) return;
    
    // Get notification permission
    notificationService.getPermissionStatus().then((permission) => {
      if (permission !== 'granted') return;
      
      // Format the notification
      const title = notification.title || `New ${notification.type}`;
      const body = notification.content || '';
      const tag = `notification-${notification.id}`;
      
      // Determine URL based on notification type
      let url = '/notifications';
      
      // Convert message type to URL
      switch (notification.type) {
        case 'message':
          url = `/messages?channel=${notification.channelId}`;
          break;
        case 'task':
          url = `/tasks?task=${notification.taskId}`;
          break;
        case 'document':
          url = `/documents?document=${notification.documentId}`;
          break;
        case 'meeting':
          url = `/calendar?event=${notification.meetingId}`;
          break;
      }
      
      // Show the notification
      notificationService.showNotification({
        title,
        body,
        tag,
        url,
        data: notification
      });
    });
  }
  
  /**
   * Clean up and disconnect all real-time services
   */
  public dispose(): void {
    if (!this.initialized) return;
    
    // Disconnect WebSocket
    websocketService.disconnect();
    
    this.initialized = false;
    this.options = null;
  }
  
  /**
   * Get current connection status
   */
  public getConnectionStatus() {
    return websocketService.getStatus();
  }
  
  /**
   * Manually reconnect to WebSocket
   */
  public async reconnect(): Promise<boolean> {
    websocketService.disconnect();
    try {
      await websocketService.connect();
      return true;
    } catch (error) {
      console.error('Failed to reconnect:', error);
      return false;
    }
  }
  
  /**
   * Send a user presence update
   */
  public updateUserStatus(status: 'online' | 'offline' | 'away'): void {
    if (!this.initialized || !this.options) return;
    
    websocketService.send('USER_STATUS', {
      userId: this.options.userId,
      status
    });
  }
  
  /**
   * Check if notifications are enabled
   */
  public async areNotificationsEnabled(): Promise<boolean> {
    const permission = await notificationService.getPermissionStatus();
    return permission === 'granted';
  }

  private handleWebSocketMessage(message: WebSocketMessage) {
    // Check if we've already processed this message to prevent duplicates
    if (message.type === 'MESSAGE' && message.payload?.message?.id) {
      // Keep track of recently processed message IDs to avoid duplicates
      const messageId = message.payload.message.id;
      
      // Create a deduplication cache if it doesn't exist
      if (!this.processedMessageIds) {
        this.processedMessageIds = new Set<string>();
      }
      
      // If we've already processed this message, ignore it
      if (this.processedMessageIds.has(messageId)) {
        console.log(`Ignoring duplicate message: ${messageId}`);
        return;
      }
      
      // Add this message ID to our processed set
      this.processedMessageIds.add(messageId);
      
      // Keep the set size reasonable by removing old entries when it gets too large
      if (this.processedMessageIds.size > 100) {
        const iterator = this.processedMessageIds.values();
        this.processedMessageIds.delete(iterator.next().value);
      }
    }
    
    // Process different message types
    switch (message.type) {
      case 'MESSAGE':
        if (this.options?.onMessageReceived && message.payload?.message) {
          this.options.onMessageReceived(message.payload.message);
        }
        break;
        
      case 'NOTIFICATION':
        if (this.options?.onNotificationReceived && message.payload?.notification) {
          this.options.onNotificationReceived(message.payload.notification);
          this.showBrowserNotification(message.payload.notification);
        }
        break;
        
      case 'USER_STATUS':
        if (this.options?.onUserStatusChange && message.payload?.userId && message.payload?.status) {
          this.options.onUserStatusChange(
            message.payload.userId, 
            message.payload.status
          );
        }
        break;
        
      case 'CLEAR_CHANNEL':
        console.log('CLEAR_CHANNEL received:', message.payload);
        if (this.options?.onMessageReceived && message.payload?.channelId) {
          // We'll send a special message to the handler to clear messages
          this.options.onMessageReceived({
            _clearChannel: true,
            channelId: message.payload.channelId,
            senderId: message.payload.clearedBy || 'system',
            timestamp: message.payload.timestamp || new Date().toISOString()
          });
        }
        break;
        
      case 'READ_RECEIPT':
        console.log('READ_RECEIPT received:', message.payload);
        // Handle read receipts if needed
        break;
        
      case 'CONNECT':
      case 'DISCONNECT':
        console.log(`Connection event: ${message.type} from ${message.senderId || 'unknown'}`);
        break;
        
      default:
        console.log(`Unhandled message type: ${message.type}`);
        break;
    }
  }
}

// Export a singleton instance
export const realTimeService = new RealTimeService(); 
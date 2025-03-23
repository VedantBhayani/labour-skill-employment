import { toast } from "@/hooks/use-toast";
import { MOCK_MODE } from "./realTimeService";

// Dedupe cache to prevent duplicate message processing
const processedMessageIds = new Set<string>();
const MESSAGE_CACHE_SIZE = 100;

export type WebSocketMessageType = 
  | 'CONNECT' 
  | 'DISCONNECT' 
  | 'MESSAGE' 
  | 'NOTIFICATION' 
  | 'USER_STATUS' 
  | 'TYPING' 
  | 'READ_RECEIPT'
  | 'TASK_UPDATE'
  | 'DOCUMENT_UPDATE'
  | 'MEETING_UPDATE'
  | 'CLEAR_CHANNEL';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: any;
  timestamp: string;
  senderId?: string;
}

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'reconnecting';

type WebSocketEventCallback = (event: WebSocketMessage) => void;

export class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectInterval = 2000; // Start with 2 seconds
  private reconnectTimer: number | null = null;
  private messageListeners: Map<WebSocketMessageType, WebSocketEventCallback[]> = new Map();
  private statusCallback: ((status: ConnectionStatus) => void) | null = null;
  private userId: string | null = null;
  private authToken: string | null = null;
  private url: string;
  private heartbeatInterval: number | null = null;
  private lastMessageTime: number = 0;
  private heartbeatTimeout = 30000; // 30 seconds
  
  constructor(url: string) {
    this.url = url;
  }

  /**
   * Set the WebSocket URL
   * @param url The new WebSocket URL
   */
  public setUrl(url: string): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      console.warn('Cannot change WebSocket URL while connected. Disconnect first.');
      return;
    }
    
    this.url = url;
  }

  public setCredentials(userId: string, authToken: string) {
    this.userId = userId;
    this.authToken = authToken;
  }

  public connect(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        resolve(true);
        return;
      }

      // If we're in mock mode, simulate a connection
      if (MOCK_MODE) {
        console.log('🧪 WebSocketService running in MOCK MODE - simulating connection');
        this.updateStatus('connecting');
        
        // Simulate connection delay
        setTimeout(() => {
          this.updateStatus('connected');
          this.startMockMessageSimulation();
          resolve(true);
        }, 1000);
        
        return;
      }

      // Add auth parameters to the URL
      let connectionUrl = this.url;
      if (this.userId && this.authToken) {
        connectionUrl += `?userId=${this.userId}&token=${this.authToken}`;
      }

      console.log(`Attempting to connect to WebSocket at: ${connectionUrl}`);
      
      try {
        this.updateStatus('connecting');
        this.socket = new WebSocket(connectionUrl);

        this.socket.onopen = () => {
          console.log('WebSocket connection established successfully');
          this.reconnectAttempts = 0;
          this.updateStatus('connected');
          this.startHeartbeat();
          resolve(true);
        };

        this.socket.onmessage = (event) => {
          this.lastMessageTime = Date.now();
          try {
            const message = JSON.parse(event.data) as WebSocketMessage;
            console.log('WebSocket message received:', message.type);
            this.dispatchMessage(message);
          } catch (err) {
            console.error('Error parsing WebSocket message:', err);
          }
        };

        this.socket.onclose = (event) => {
          console.log(`WebSocket connection closed with code: ${event.code}, reason: ${event.reason}`);
          this.updateStatus('disconnected');
          this.stopHeartbeat();
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          } else {
            toast({
              title: "Connection Lost",
              description: "Unable to reconnect to the server after multiple attempts.",
              variant: "destructive",
            });
            reject(new Error('Max reconnect attempts reached'));
          }
        };

        this.socket.onerror = (error) => {
          console.error('WebSocket connection error:', error);
          this.updateStatus('disconnected');
        };
      } catch (error) {
        this.updateStatus('disconnected');
        console.error('Failed to connect to WebSocket:', error);
        toast({
          title: "Connection Error",
          description: `Could not connect to ${connectionUrl}. Check if the server is running.`,
          variant: "destructive",
        });
        reject(error);
      }
    });
  }

  // Mock message simulation
  private mockMessageInterval: number | null = null;
  
  private startMockMessageSimulation() {
    if (!MOCK_MODE) return;
    
    // Clear any existing interval
    if (this.mockMessageInterval) {
      window.clearInterval(this.mockMessageInterval);
    }
    
    // Every 30 seconds, simulate receiving a system message
    this.mockMessageInterval = window.setInterval(() => {
      const mockMessage: WebSocketMessage = {
        type: 'NOTIFICATION',
        payload: {
          notification: {
            id: `mock-${Date.now()}`,
            type: 'system',
            content: 'This is a mock notification from the simulated WebSocket service',
            timestamp: new Date().toISOString(),
            isRead: false,
            senderId: 'system'
          }
        },
        timestamp: new Date().toISOString()
      };
      
      this.dispatchMessage(mockMessage);
    }, 30000);
  }
  
  private stopMockMessageSimulation() {
    if (this.mockMessageInterval) {
      window.clearInterval(this.mockMessageInterval);
      this.mockMessageInterval = null;
    }
  }
  
  public disconnect() {
    if (MOCK_MODE) {
      console.log('🧪 WebSocketService running in MOCK MODE - simulating disconnect');
      this.updateStatus('disconnected');
      this.stopMockMessageSimulation();
      return;
    }
    
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.stopHeartbeat();
    this.updateStatus('disconnected');
  }

  public send(type: WebSocketMessageType, payload: any) {
    // In mock mode, handle message locally
    if (MOCK_MODE) {
      console.log('🧪 WebSocketService running in MOCK MODE - simulating message send:', type, payload);
      
      // Simulate successful send
      setTimeout(() => {
        // If this is a chat message, simulate receiving it back
        if (type === 'MESSAGE' && payload.channelId && payload.content) {
          const mockResponse: WebSocketMessage = {
            type: 'MESSAGE',
            payload: {
              message: {
                id: `mock-msg-${Date.now()}`,
                channelId: payload.channelId,
                content: payload.content,
                senderId: this.userId || 'unknown',
                timestamp: new Date().toISOString(),
                isRead: false,
                isEdited: false
              }
            },
            timestamp: new Date().toISOString(),
            senderId: this.userId
          };
          
          this.dispatchMessage(mockResponse);
        }
      }, 300);
      
      return true;
    }
    
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      toast({
        title: "Connection Error",
        description: "Cannot send message while disconnected.",
        variant: "destructive",
      });
      return false;
    }

    const message: WebSocketMessage = {
      type,
      payload,
      timestamp: new Date().toISOString(),
      senderId: this.userId || undefined
    };

    try {
      this.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      return false;
    }
  }

  public on(type: WebSocketMessageType, callback: WebSocketEventCallback) {
    if (!this.messageListeners.has(type)) {
      this.messageListeners.set(type, []);
    }
    this.messageListeners.get(type)!.push(callback);
  }

  public off(type: WebSocketMessageType, callback: WebSocketEventCallback) {
    if (!this.messageListeners.has(type)) return;
    
    const callbacks = this.messageListeners.get(type)!;
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  }

  public onStatusChange(callback: (status: ConnectionStatus) => void) {
    this.statusCallback = callback;
  }

  public getStatus(): ConnectionStatus {
    if (!this.socket) return 'disconnected';
    
    switch (this.socket.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      default:
        return 'disconnected';
    }
  }

  private updateStatus(status: ConnectionStatus) {
    if (this.statusCallback) {
      this.statusCallback(status);
    }
  }

  private dispatchMessage(message: WebSocketMessage) {
    // Handle system messages
    if (message.type === 'CONNECT' || message.type === 'DISCONNECT') {
      // System notifications about other users
      console.log(`User ${message.senderId} ${message.type === 'CONNECT' ? 'connected' : 'disconnected'}`);
    }
    
    // Deduplicate messages
    if (message.type === 'MESSAGE' && message.payload?.message?.id) {
      const messageId = message.payload.message.id;
      
      // If we've already processed this message, ignore it
      if (processedMessageIds.has(messageId)) {
        console.log(`Ignoring duplicate message: ${messageId}`);
        return;
      }
      
      // Add to processed cache
      processedMessageIds.add(messageId);
      
      // Limit cache size
      if (processedMessageIds.size > MESSAGE_CACHE_SIZE) {
        const oldestId = processedMessageIds.values().next().value;
        processedMessageIds.delete(oldestId);
      }
    }
    
    // Forward to all registered listeners for this message type
    const listeners = this.messageListeners.get(message.type) || [];
    listeners.forEach(callback => {
      try {
        callback(message);
      } catch (err) {
        console.error(`Error in websocket ${message.type} callback:`, err);
      }
    });
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
    }

    this.updateStatus('reconnecting');
    this.reconnectAttempts++;
    
    // Exponential backoff with jitter
    const delay = Math.min(
      30000, // Max 30 seconds
      this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts) * (0.9 + Math.random() * 0.2)
    );

    console.log(`Attempting to reconnect in ${Math.floor(delay / 1000)} seconds (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimer = window.setTimeout(() => {
      this.connect().catch(() => {
        // Connection attempt failed, will be handled by onclose
      });
    }, delay);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.lastMessageTime = Date.now();
    
    this.heartbeatInterval = window.setInterval(() => {
      const now = Date.now();
      
      // Check if we haven't received anything for too long
      if (now - this.lastMessageTime > this.heartbeatTimeout) {
        console.warn('No heartbeat received, reconnecting...');
        this.disconnect();
        this.connect().catch(console.error);
        return;
      }
      
      // Send heartbeat
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.send('CONNECT', { heartbeat: true });
      }
    }, 15000); // Send heartbeat every 15 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval !== null) {
      window.clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

// Export a singleton instance
export const websocketService = new WebSocketService('ws://localhost:8080');

// In a real application, you would replace this dummy implementation
// with an actual WebSocket server endpoint.
// For development purposes, we can use a WebSocket server like ws:
// https://github.com/websockets/ws 
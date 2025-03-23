const WebSocket = require('ws');
const http = require('http');
const url = require('url');

// In-memory storage for active connections and user data
const connections = new Map();
const users = new Map();
const channels = new Map();
const typing = new Map(); // Track typing users by channel

// Store recently sent messages to prevent duplicates
const recentlySentMessages = new Map();
const MESSAGE_RETENTION_TIME = 60000; // 1 minute in milliseconds

// Create a basic HTTP server
const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'WebSocket server is running' }));
});

// Create WebSocket server with CORS options
const wss = new WebSocket.Server({ 
  server,
  // Allow connections from any origin
  verifyClient: (info) => {
    // Log connection attempt details
    console.log('Connection attempt from:', info.origin);
    console.log('Request URL:', info.req.url);
    // Accept all connections - we'll authenticate with userId later
    return true;
  }
});

// Message types
const MESSAGE_TYPES = {
  CONNECT: 'CONNECT',
  DISCONNECT: 'DISCONNECT',
  MESSAGE: 'MESSAGE',
  NOTIFICATION: 'NOTIFICATION',
  USER_STATUS: 'USER_STATUS',
  TYPING: 'TYPING',
  READ_RECEIPT: 'READ_RECEIPT',
  TASK_UPDATE: 'TASK_UPDATE',
  DOCUMENT_UPDATE: 'DOCUMENT_UPDATE',
  MEETING_UPDATE: 'MEETING_UPDATE',
  HEARTBEAT: 'HEARTBEAT'
};

// Modified helper to broadcast to all connected clients with deduplication
function broadcast(data, excludeClient = null) {
  // For message type, check for duplicates
  if (data.type === 'MESSAGE' && data.payload?.message?.id) {
    const messageId = data.payload.message.id;
    const now = Date.now();
    
    // Check if we recently sent this message
    if (recentlySentMessages.has(messageId)) {
      console.log(`Preventing duplicate broadcast of message: ${messageId}`);
      return;
    }
    
    // Record this message as sent
    recentlySentMessages.set(messageId, now);
    
    // Clean up old message records periodically
    if (recentlySentMessages.size > 100) {
      for (const [id, timestamp] of recentlySentMessages.entries()) {
        if (now - timestamp > MESSAGE_RETENTION_TIME) {
          recentlySentMessages.delete(id);
        }
      }
    }
  }
  
  // Broadcast to all clients
  wss.clients.forEach(client => {
    if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// Modified helper to send to specific users with deduplication
function sendToUser(userId, data) {
  // For message type, check for duplicates
  if (data.type === 'MESSAGE' && data.payload?.message?.id) {
    const messageId = data.payload.message.id;
    const now = Date.now();
    
    // Create a composite key for user + message
    const compositeKey = `${userId}-${messageId}`;
    
    // Check if we recently sent this message to this user
    if (recentlySentMessages.has(compositeKey)) {
      console.log(`Preventing duplicate send of message ${messageId} to user ${userId}`);
      return false;
    }
    
    // Record this message as sent to this user
    recentlySentMessages.set(compositeKey, now);
  }
  
  const client = connections.get(userId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(data));
    return true;
  }
  return false;
}

// Modified helper to broadcast to channel members with deduplication
function broadcastToChannel(channelId, data, excludeUserId = null) {
  const channel = channels.get(channelId);
  if (!channel) return;
  
  // For message type, check for duplicates at the channel level
  if (data.type === 'MESSAGE' && data.payload?.message?.id) {
    const messageId = data.payload.message.id;
    const now = Date.now();
    
    // Create a composite key for channel + message
    const compositeKey = `channel-${channelId}-${messageId}`;
    
    // Check if we recently broadcast this message to this channel
    if (recentlySentMessages.has(compositeKey)) {
      console.log(`Preventing duplicate broadcast of message ${messageId} to channel ${channelId}`);
      return;
    }
    
    // Record this message as broadcast to this channel
    recentlySentMessages.set(compositeKey, now);
  }
  
  channel.members.forEach(userId => {
    if (userId !== excludeUserId) {
      sendToUser(userId, data);
    }
  });
}

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress;
  const fullUrl = req.url;
  console.log(`Client connected from ${ip} with URL: ${fullUrl}`);
  
  // Parse query parameters for authentication
  const parameters = url.parse(req.url, true).query;
  const userId = parameters.userId;
  const token = parameters.token;
  
  console.log(`Connection parameters - userId: ${userId}, token: ${token ? '[REDACTED]' : 'none'}`);
  
  // Authenticate the user (simple validation for demo)
  if (!userId) {
    console.log('Connection rejected: No user ID provided');
    ws.close(1008, 'Authentication failed: No user ID provided');
    return;
  }
  
  // Store connection
  connections.set(userId, ws);
  console.log(`User ${userId} authenticated and connected. Active connections: ${connections.size}`);
  
  // Create temporary user object if not exists
  if (!users.has(userId)) {
    users.set(userId, {
      id: userId,
      status: 'online',
      lastActive: Date.now()
    });
  } else {
    // Update existing user status
    const user = users.get(userId);
    user.status = 'online';
    user.lastActive = Date.now();
    users.set(userId, user);
  }
  
  // Send connection confirmation
  ws.send(JSON.stringify({
    type: MESSAGE_TYPES.CONNECT,
    payload: {
      message: 'Connected successfully',
      userId: userId
    },
    timestamp: new Date().toISOString()
  }));
  
  // Broadcast user status to others
  broadcast({
    type: MESSAGE_TYPES.USER_STATUS,
    payload: {
      userId: userId,
      status: 'online'
    },
    timestamp: new Date().toISOString()
  }, ws);
  
  // Message handler
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received:', data.type);
      
      // Update user's last active time
      if (users.has(userId)) {
        const user = users.get(userId);
        user.lastActive = Date.now();
        users.set(userId, user);
      }
      
      // Handle different message types
      switch (data.type) {
        case MESSAGE_TYPES.HEARTBEAT:
          // Respond to heartbeat
          ws.send(JSON.stringify({
            type: MESSAGE_TYPES.HEARTBEAT,
            timestamp: new Date().toISOString()
          }));
          break;
          
        case MESSAGE_TYPES.MESSAGE:
          // Handle a new message
          if (data.payload && data.payload.message) {
            const message = data.payload.message;
            const channelId = message.channelId;
            
            // Get channel or create if not exists
            if (!channels.has(channelId)) {
              channels.set(channelId, {
                id: channelId,
                members: [userId],
                messages: []
              });
            }
            
            const channel = channels.get(channelId);
            
            // Store message
            channel.messages.push(message);
            
            // Forward to channel members
            broadcastToChannel(channelId, data);
          }
          break;
          
        case MESSAGE_TYPES.TYPING:
          // Handle typing indicator
          if (data.payload) {
            const { channelId, isTyping } = data.payload;
            
            if (!typing.has(channelId)) {
              typing.set(channelId, new Set());
            }
            
            const typingUsers = typing.get(channelId);
            
            if (isTyping) {
              typingUsers.add(userId);
            } else {
              typingUsers.delete(userId);
            }
            
            // Broadcast typing status to channel
            broadcastToChannel(channelId, {
              type: MESSAGE_TYPES.TYPING,
              payload: {
                channelId,
                userId,
                isTyping
              },
              timestamp: new Date().toISOString()
            }, userId);
          }
          break;
          
        case MESSAGE_TYPES.USER_STATUS:
          // Handle user status change
          if (data.payload && data.payload.status) {
            const status = data.payload.status;
            
            if (users.has(userId)) {
              const user = users.get(userId);
              user.status = status;
              users.set(userId, user);
              
              // Broadcast status change
              broadcast({
                type: MESSAGE_TYPES.USER_STATUS,
                payload: {
                  userId,
                  status
                },
                timestamp: new Date().toISOString()
              });
            }
          }
          break;
          
        case MESSAGE_TYPES.NOTIFICATION:
          // Forward notification to recipient
          if (data.payload && data.payload.notification) {
            const notification = data.payload.notification;
            const recipientId = data.payload.recipientId;
            
            if (recipientId) {
              sendToUser(recipientId, data);
            } else {
              // Broadcast to all if no specific recipient
              broadcast(data);
            }
          }
          break;
          
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Failed to process message:', error);
    }
  });
  
  // Handle disconnection
  ws.on('close', () => {
    console.log('Client disconnected:', userId);
    
    // Update user status
    if (users.has(userId)) {
      const user = users.get(userId);
      user.status = 'offline';
      user.lastActive = Date.now();
      users.set(userId, user);
    }
    
    // Remove from active connections
    connections.delete(userId);
    
    // Remove from typing indicators
    typing.forEach((typingUsers, channelId) => {
      if (typingUsers.has(userId)) {
        typingUsers.delete(userId);
        
        // Broadcast typing status update
        broadcastToChannel(channelId, {
          type: MESSAGE_TYPES.TYPING,
          payload: {
            channelId,
            userId,
            isTyping: false
          },
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Broadcast user disconnection
    broadcast({
      type: MESSAGE_TYPES.USER_STATUS,
      payload: {
        userId,
        status: 'offline'
      },
      timestamp: new Date().toISOString()
    });
  });
});

// Start the server
const PORT = process.env.WEBSOCKET_PORT || 8080;
server.listen(PORT, () => {
  console.log(`WebSocket server is running on port ${PORT}`);
  console.log(`WebSocket server URL: ws://localhost:${PORT}`);
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. This might be because:`);
    console.error('1. Your main server is already using this port');
    console.error('2. Another application is using this port');
    console.error('Try changing the WEBSOCKET_PORT environment variable to a different port');
  } else {
    console.error('WebSocket server error:', error);
  }
}); 
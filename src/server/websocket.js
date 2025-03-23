// Handle client message
wss.on('connection', (ws) => {
  ws.on('message', (rawMessage) => {
    try {
      const message = JSON.parse(rawMessage);
      
      switch (message.type) {
        // ... existing cases ...
        
        case 'CLEAR_CHANNEL':
          // Handle channel clearing
          const clearChannelId = message.payload?.channelId;
          
          if (clearChannelId) {
            console.log(`Channel ${clearChannelId} was cleared by ${ws.userId}`);
            
            // Forward the clear command to all users in the channel
            const channel = channels.get(clearChannelId);
            if (channel) {
              broadcastToChannel(clearChannelId, {
                type: 'CLEAR_CHANNEL',
                senderId: ws.userId,
                timestamp: new Date().toISOString(),
                payload: {
                  channelId: clearChannelId,
                  clearedBy: ws.userId,
                  timestamp: new Date().toISOString()
                }
              });
            }
          }
          break;
          
        case 'READ_RECEIPT':
          // Handle read receipts
          const readReceiptChannelId = message.payload?.channelId;
          const userId = ws.userId;
          
          if (readReceiptChannelId && userId) {
            // Forward read receipt to all channel members
            broadcastToChannel(readReceiptChannelId, {
              type: 'READ_RECEIPT',
              senderId: userId,
              timestamp: new Date().toISOString(),
              payload: {
                channelId: readReceiptChannelId,
                userId,
                timestamp: new Date().toISOString()
              }
            });
          }
          break;
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });
}); 
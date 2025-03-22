const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    mimeType: String,
    size: Number
  }],
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  conversationId: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Index for faster conversation lookups
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ sender: 1, receiver: 1 });

// Create a unique conversation ID from sender and receiver IDs
messageSchema.statics.createConversationId = function(userId1, userId2) {
  return [userId1, userId2].sort().join('_');
};

// Find conversations for a user
messageSchema.statics.findConversations = async function(userId) {
  const conversations = await this.aggregate([
    {
      $match: {
        $or: [
          { sender: mongoose.Types.ObjectId(userId) },
          { receiver: mongoose.Types.ObjectId(userId) }
        ]
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: '$conversationId',
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              { $and: [
                { $eq: ['$read', false] },
                { $eq: ['$receiver', mongoose.Types.ObjectId(userId)] }
              ]},
              1,
              0
            ]
          }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        let: { 
          senderId: '$lastMessage.sender', 
          receiverId: '$lastMessage.receiver' 
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  { $eq: ['$_id', '$$senderId'] },
                  { $eq: ['$_id', '$$receiverId'] }
                ]
              }
            }
          },
          {
            $project: {
              _id: 1,
              name: 1,
              email: 1,
              avatar: 1
            }
          }
        ],
        as: 'participants'
      }
    },
    {
      $project: {
        _id: 0,
        conversationId: '$_id',
        lastMessage: 1,
        unreadCount: 1,
        participants: 1
      }
    }
  ]);
  
  return conversations;
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message; 
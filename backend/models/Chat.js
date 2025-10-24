const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    required: true,
    enum: ['admin', 'user']
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'sender === "admin" ? "Admin" : "User"'
  },
  text: {
    type: String,
    trim: true
  },
  image: {
    type: String, // URL or base64
    trim: true
  },
  audio: {
    type: String, // URL or base64
    trim: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'audio', 'system'],
    default: 'text'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

const chatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  messages: [messageSchema],
  lastMessage: {
    text: String,
    timestamp: Date,
    sender: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  unreadCount: {
    admin: {
      type: Number,
      default: 0
    },
    user: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

chatSchema.index({ userId: 1 });
chatSchema.index({ adminId: 1 });
chatSchema.index({ 'messages.createdAt': -1 });

module.exports = mongoose.model('Chat', chatSchema);
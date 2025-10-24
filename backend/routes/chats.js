const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const { body, validationResult } = require('express-validator');

// Get all chats for admin
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      isActive = true,
      hasUnread,
      sortBy = 'updatedAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (hasUnread === 'true') query['unreadCount.admin'] = { $gt: 0 };

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    const chats = await Chat.find(query)
      .sort(sortOptions)
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .populate('userId', 'firstName lastName email profilePhoto')
      .populate('adminId', 'username email')
      .select('-messages'); // Don't include all messages in list view

    const total = await Chat.countDocuments(query);

    res.json({
      success: true,
      chats,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalChats: total,
        chatsPerPage: limitNum
      }
    });
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get chat by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    let chat = await Chat.findOne({ userId })
      .populate('userId', 'firstName lastName email profilePhoto')
      .populate('adminId', 'username email');

    if (!chat) {
      // Create new chat if doesn't exist
      chat = new Chat({
        userId,
        adminId: req.user.userId,
        messages: [],
        isActive: true
      });
      await chat.save();
      
      // Populate after save
      chat = await Chat.findById(chat._id)
        .populate('userId', 'firstName lastName email profilePhoto')
        .populate('adminId', 'username email');
    }

    // Paginate messages
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Get messages with pagination (most recent first)
    const totalMessages = chat.messages.length;
    const messages = chat.messages
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(skip, skip + limitNum)
      .reverse(); // Reverse to show oldest first in the paginated result

    res.json({
      success: true,
      chat: {
        ...chat.toObject(),
        messages
      },
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalMessages / limitNum),
        totalMessages,
        messagesPerPage: limitNum
      }
    });
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Send message to user
router.post('/user/:userId/message', [
  body('text').optional().trim(),
  body('image').optional().trim(),
  body('audio').optional().trim(),
  body('messageType').isIn(['text', 'image', 'audio', 'system']).withMessage('Valid message type is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { userId } = req.params;
    const { text, image, audio, messageType = 'text' } = req.body;

    // Validate that at least one content field is provided
    if (!text && !image && !audio) {
      return res.status(400).json({
        success: false,
        error: 'Message must contain text, image, or audio'
      });
    }

    let chat = await Chat.findOne({ userId });

    if (!chat) {
      chat = new Chat({
        userId,
        adminId: req.user.userId,
        messages: [],
        isActive: true
      });
    }

    const newMessage = {
      sender: 'admin',
      senderId: req.user.userId,
      text,
      image,
      audio,
      messageType,
      isRead: false
    };

    chat.messages.push(newMessage);
    chat.lastMessage = {
      text: text || (image ? 'Image' : 'Audio'),
      timestamp: new Date(),
      sender: 'admin'
    };
    chat.unreadCount.user += 1;
    chat.updatedAt = new Date();

    await chat.save();

    // Get the newly added message
    const addedMessage = chat.messages[chat.messages.length - 1];

    res.json({
      success: true,
      message: 'Message sent successfully',
      messageData: addedMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Mark messages as read
router.patch('/user/:userId/read', async (req, res) => {
  try {
    const { userId } = req.params;

    const chat = await Chat.findOne({ userId });

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Chat not found'
      });
    }

    // Mark all unread messages from user as read
    let updatedCount = 0;
    chat.messages.forEach(message => {
      if (message.sender === 'user' && !message.isRead) {
        message.isRead = true;
        message.readAt = new Date();
        updatedCount++;
      }
    });

    chat.unreadCount.admin = 0;
    await chat.save();

    res.json({
      success: true,
      message: `${updatedCount} messages marked as read`
    });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete message
router.delete('/message/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;

    const chat = await Chat.findOne({ 'messages._id': messageId });

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    chat.messages.id(messageId).remove();
    await chat.save();

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get chat statistics
router.get('/stats', async (req, res) => {
  try {
    const totalChats = await Chat.countDocuments({ isActive: true });
    const chatsWithUnread = await Chat.countDocuments({ 
      isActive: true, 
      'unreadCount.admin': { $gt: 0 } 
    });
    
    const recentChats = await Chat.find({ isActive: true })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('userId', 'firstName lastName email')
      .select('userId lastMessage updatedAt unreadCount');

    res.json({
      success: true,
      stats: {
        totalChats,
        chatsWithUnread,
        recentChats
      }
    });
  } catch (error) {
    console.error('Get chat stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
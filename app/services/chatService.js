import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CHAT_URL, CHAT_WS_URL, ENABLE_LOGGING } from '../config/environment';
import { validateMessageContent, validateFileUri, validateUserId } from '../utils/validators';
import { handleApiError, secureLog } from '../utils/errorHandling';
import Logger from '../utils/logger';
import SecureCache, { CacheType } from '../utils/secureCache';


class ChatService {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = null;
    this.heartbeatInterval = null;
    // Use centralized environment configuration
    this.chatServerUrl = CHAT_URL;
    this.wsUrl = CHAT_WS_URL;
    this.cacheKey = 'admin_chat_messages_cache';
    
    Logger.info('Chat Service initialized');
  }

  // Helper function to construct full URLs for attachments
  constructFullUrl(url) {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${this.chatServerUrl}${url}`;
  }

  // Local message caching methods (using secure cache)
  async getCachedMessages(userId) {
    try {
      const cacheKey = `${this.cacheKey}_${userId}`;
      const cached = await SecureCache.get(cacheKey, CacheType.SENSITIVE);
      if (cached && cached.messages) {
        Logger.log(`Loaded ${cached.messages.length} cached messages`);
        return cached.messages;
      }
    } catch (error) {
      Logger.warn('Failed to load cached messages');
    }
    return [];
  }

  async cacheMessages(userId, messages) {
    try {
      const cacheKey = `${this.cacheKey}_${userId}`;
      const cacheData = {
        userId,
        messages,
        lastUpdated: new Date().toISOString()
      };
      // Cache messages securely with 24 hour TTL
      await SecureCache.set(cacheKey, cacheData, CacheType.SENSITIVE, 24 * 60 * 60 * 1000);
      Logger.log(`Cached ${messages.length} messages securely`);
    } catch (error) {
      Logger.warn('Failed to cache messages');
    }
  }

  async clearMessageCache(userId) {
    try {
      if (userId) {
        const cacheKey = `${this.cacheKey}_${userId}`;
        await SecureCache.remove(cacheKey, CacheType.SENSITIVE);
        Logger.log('Message cache cleared');
      } else {
        // Clear all message caches
        const count = await SecureCache.clearPattern(this.cacheKey);
        Logger.log(`Cleared ${count} message caches`);
      }
    } catch (error) {
      Logger.warn('Failed to clear message cache');
    }
  }

  async getCacheInfo() {
    try {
      return await SecureCache.getInfo();
    } catch (error) {
      Logger.warn('Failed to get cache info');
      return { totalCaches: 0, totalSize: '0 KB', caches: [] };
    }
  }

  async connect() {
    try {
      Logger.info('Connecting to chat server');
      
      // Get auth token from SecureStore (same as ApiService)
      const token = await SecureStore.getItemAsync('adminToken');
      if (!token) {
        throw new Error('No auth token found');
      }
      
      Logger.log('Token operation completed');

      // Test connection with a simple API call
      Logger.log('Testing chat server connection');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      let response;
      try {
        response = await fetch(`${this.chatServerUrl}/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Server not reachable: ${response.status}`);
        }
        
        const healthData = await response.json();
        Logger.success('Chat server connected');
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error(`Connection timeout - cannot reach ${this.chatServerUrl}`);
        }
        throw fetchError;
      }

      this.isConnected = true;
      this.reconnectAttempts = 0;

      // Start polling for new messages
      this.startMessagePolling();

      return { success: true, message: 'Connected to chat service' };
    } catch (error) {
      Logger.error('Chat service connection failed', error);
      this.isConnected = false;
      throw error;
    }
  }

  startMessagePolling() {
    // Poll for new messages every 5 seconds (reduced frequency to avoid overwhelming)
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    Logger.log('Message polling started');
    this.pollingInterval = setInterval(() => {
      if (this.currentChatUserId && this.isConnected) {
        this.checkForNewMessages(this.currentChatUserId);
      }
    }, 5000);
  }

  async checkForNewMessages(userId) {
    try {
      const response = await this.getChatHistory(userId, 1, 10);
      if (response.success && response.data.messages.length > 0) {
        const allMessages = response.data.messages;
        
        // If we don't have a timestamp, just set it and don't emit messages
        if (!this.lastMessageTimestamp) {
          this.lastMessageTimestamp = allMessages[0].createdAt;
          return;
        }

        const newMessages = allMessages.filter(msg => 
          new Date(msg.createdAt) > new Date(this.lastMessageTimestamp)
        );

        if (newMessages.length > 0) {
          Logger.log(`Received ${newMessages.length} new messages`);
          
          newMessages.forEach(msg => {
            const transformedMessage = {
              id: msg._id,
              text: msg.content,
              sender: msg.sender === 'admin' ? 'me' : 'other',
              image: this.constructFullUrl(msg.attachments?.find(att => att.type === 'image')?.url),
              audio: this.constructFullUrl(msg.attachments?.find(att => att.type === 'audio')?.url),
              timestamp: msg.createdAt,
              isRead: msg.isRead
            };
            
            this.emit('messageReceived', { message: transformedMessage });
          });

          // Update last message timestamp to the most recent
          this.lastMessageTimestamp = newMessages[0].createdAt;
        }
      }
    } catch (error) {
      Logger.error('Error checking for new messages');
      // Don't disconnect on polling errors, just log them
    }
  }

  // Send a text message via REST API
  async sendMessage(receiver, content, messageType = 'text') {
    if (!this.isConnected) {
      throw new Error('Chat service not connected');
    }
    
    // Validate inputs
    const validatedReceiver = validateUserId(receiver);
    const validatedContent = validateMessageContent(content);

    try {
      const token = await SecureStore.getItemAsync('adminToken');
      if (!token) {
        throw new Error('No auth token found');
      }

      const response = await fetch(`${this.chatServerUrl}/api/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receiver,
          messageType,
          content
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to send message');
      }

      Logger.success('Message sent');
      this.emit('messageSent', { success: true, messageId: data.data._id });
      
      return data;
    } catch (error) {
      Logger.error('Failed to send message');
      this.emit('messageError', { error: error.message });
      throw error;
    }
  }

  // Send an image message with proper file upload
  async sendImage(receiver, imageUri) {
    if (!this.isConnected) {
      throw new Error('Chat service not connected');
    }
    
    // Validate inputs
    const validatedReceiver = validateUserId(receiver);
    const validatedUri = validateFileUri(imageUri);

    try {
      const token = await SecureStore.getItemAsync('adminToken');
      if (!token) {
        throw new Error('No auth token found');
      }

      // Create FormData for file upload
      const form = new FormData();
      form.append('messageType', 'image');
      form.append('receiver', receiver);

      // Determine MIME type based on file extension
      const mime = imageUri.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';
      const name = mime === 'image/png' ? 'image.png' : 'image.jpg';

      // Append the image file
      form.append('file', {
        uri: imageUri,
        type: mime,
        name: name
      });

      Logger.log('Uploading image');

      const response = await fetch(`${this.chatServerUrl}/api/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type header - let FormData set it with boundary
        },
        body: form
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to send image');
      }

      Logger.success('Image sent');
      this.emit('messageSent', { success: true, messageId: data.data._id });
      
      return data;
    } catch (error) {
      Logger.error('Failed to send image');
      this.emit('messageError', { error: error.message });
      throw error;
    }
  }

  // Send an audio message with proper file upload
  async sendAudio(receiver, audioUri) {
    if (!this.isConnected) {
      throw new Error('Chat service not connected');
    }

    try {
      const token = await SecureStore.getItemAsync('adminToken');
      if (!token) {
        throw new Error('No auth token found');
      }

      // Create FormData for file upload
      const form = new FormData();
      form.append('messageType', 'audio');
      form.append('receiver', receiver);

      // Append the audio file
      form.append('file', {
        uri: audioUri,
        type: 'audio/mp4', // or determine based on file extension
        name: 'audio.m4a'
      });

      Logger.log('Uploading audio');

      const response = await fetch(`${this.chatServerUrl}/api/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: form
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to send audio');
      }

      Logger.success('Audio sent');
      this.emit('messageSent', { success: true, messageId: data.data._id });
      
      return data;
    } catch (error) {
      Logger.error('Failed to send audio');
      this.emit('messageError', { error: error.message });
      throw error;
    }
  }

  // Mark messages as read (simplified for REST API)
  async markMessagesAsRead(chatId, messageIds) {
    // This would require additional API endpoint on the server
    Logger.log('Mark as read not implemented for REST API mode');
  }

  // Typing indicators (simplified - just local state)
  startTyping(receiver) {
    Logger.log('Typing started');
    // In REST mode, typing indicators are not real-time
  }

  stopTyping(receiver) {
    Logger.log('Typing stopped');
    // In REST mode, typing indicators are not real-time
  }

  // Get chat history via REST API
  async getChatHistory(userId, page = 1, limit = 50, useCache = true) {
    // Validate user ID
    const validatedUserId = validateUserId(userId);
    
    // Try to load from cache first if requested
    if (useCache && page === 1) {
      const cachedMessages = await this.getCachedMessages(userId);
      if (cachedMessages.length > 0) {
        Logger.log('Using cached messages');
        // Return cached data immediately, then fetch fresh data in background
        setTimeout(() => this.getChatHistory(userId, page, limit, false), 100);
        return {
          success: true,
          data: { 
            chatId: null, 
            messages: cachedMessages, 
            unreadCount: { user: 0, admin: 0 }, 
            lastMessage: null 
          },
          pagination: { currentPage: 1, totalPages: 1, totalMessages: cachedMessages.length, messagesPerPage: limit },
          fromCache: true
        };
      }
    }

    try {
      const token = await SecureStore.getItemAsync('adminToken');
      if (!token) {
        throw new Error('No auth token found');
      }

      const response = await fetch(`${this.chatServerUrl}/api/messages/${userId}?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch chat history');
      }

      // Cache the messages if this is the first page
      if (page === 1 && data.data.messages) {
        await this.cacheMessages(userId, data.data.messages);
      }

      return data;
    } catch (error) {
      Logger.error('Failed to fetch chat history');
      throw error;
    }
  }

  // Delete a message
  async deleteMessage(messageId) {
    try {
      // Validate message ID
      const validatedId = validateUserId(messageId); // Reuse user ID validation for message IDs
      
      const token = await SecureStore.getItemAsync('adminToken');
      if (!token) {
        throw new Error('No auth token found');
      }

      const response = await fetch(`${this.chatServerUrl}/api/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete message');
      }

      return data;
    } catch (error) {
      Logger.error('Failed to delete message');
      throw error;
    }
  }

  // Event listener management
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          Logger.error('Error in event listener');
        }
      });
    }
  }

  // Set current chat user for polling
  setCurrentChatUser(userId) {
    this.currentChatUserId = userId;
    this.lastMessageTimestamp = null; // Reset timestamp when switching users
  }

  // Refresh chat history
  async refreshChatHistory(userId) {
    try {
      const response = await this.getChatHistory(userId, 1, 50);
      if (response.success) {
        return response;
      }
      throw new Error(response.error || 'Failed to refresh chat history');
    } catch (error) {
      Logger.error('Error refreshing chat history');
      throw error;
    }
  }

  // Disconnect
  disconnect() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isConnected = false;
    this.listeners.clear();
    this.currentChatUserId = null;
    this.lastMessageTimestamp = null;
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      pollingActive: !!this.pollingInterval
    };
  }

  // Transform message for UI with proper URL construction
  transformMessage(msg) {
    const imageAttachment = msg.attachments?.find(att => att.type === 'image');
    const audioAttachment = msg.attachments?.find(att => att.type === 'audio');
    
    const imageUrl = this.constructFullUrl(imageAttachment?.url);
    const audioUrl = this.constructFullUrl(audioAttachment?.url);
    
    return {
      id: msg._id,
      text: msg.content,
      sender: msg.sender === 'admin' ? 'me' : 'other',
      image: imageUrl,
      audio: audioUrl,
      timestamp: msg.createdAt,
      read: msg.isRead || false // Map isRead to read for UI
    };
  }
}

// Export singleton instance
export default new ChatService();
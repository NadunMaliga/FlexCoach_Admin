// Gracefully handle missing dependencies
let AsyncStorage, NetInfo;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
  NetInfo = require('@react-native-community/netinfo').default;
} catch (error) {
  console.warn('⚠️ Offline support dependencies not installed. Run: npx expo install @react-native-async-storage/async-storage @react-native-community/netinfo');
}

import Logger from '../utils/logger';

/**
 * Offline Manager
 * Handles offline data caching, mutation queuing, and sync
 */
class OfflineManager {
  constructor() {
    this.isOnline = true;
    this.syncInProgress = false;
    this.listeners = [];
    this.isAvailable = !!(AsyncStorage && NetInfo);
    
    // Initialize network listener
    if (this.isAvailable) {
      this.initNetworkListener();
    }
  }

  /**
   * Initialize network status listener
   */
  initNetworkListener() {
    if (!NetInfo) return;

    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected;
      
      Logger.log(`📡 Network status: ${this.isOnline ? 'Online' : 'Offline'}`);
      
      // Notify listeners
      this.notifyListeners(this.isOnline);
      
      // Auto-sync when coming back online
      if (wasOffline && this.isOnline) {
        Logger.log('🔄 Back online - starting auto-sync');
        this.syncPendingMutations();
      }
    });
  }

  /**
   * Add network status listener
   */
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all listeners of network status change
   */
  notifyListeners(isOnline) {
    this.listeners.forEach(callback => callback(isOnline));
  }

  /**
   * Cache API response
   */
  async cacheResponse(key, data, ttl = 3600000) { // Default 1 hour TTL
    if (!AsyncStorage) return;

    try {
      const cacheEntry = {
        data,
        timestamp: Date.now(),
        ttl
      };
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(cacheEntry));
      Logger.log(`✅ Cached: ${key}`);
    } catch (error) {
      Logger.error(`❌ Cache error for ${key}:`, error);
    }
  }

  /**
   * Get cached response
   */
  async getCachedResponse(key) {
    if (!AsyncStorage) return null;

    try {
      const cached = await AsyncStorage.getItem(`cache_${key}`);
      if (!cached) return null;

      const cacheEntry = JSON.parse(cached);
      const age = Date.now() - cacheEntry.timestamp;

      // Check if cache is still valid
      if (age > cacheEntry.ttl) {
        Logger.log(`⏰ Cache expired: ${key}`);
        await AsyncStorage.removeItem(`cache_${key}`);
        return null;
      }

      Logger.log(`✅ Cache hit: ${key} (age: ${Math.round(age / 1000)}s)`);
      return cacheEntry.data;
    } catch (error) {
      Logger.error(`❌ Cache read error for ${key}:`, error);
      return null;
    }
  }

  /**
   * Clear specific cache
   */
  async clearCache(key) {
    if (!AsyncStorage) return;

    try {
      await AsyncStorage.removeItem(`cache_${key}`);
      Logger.log(`🗑️ Cleared cache: ${key}`);
    } catch (error) {
      Logger.error(`❌ Cache clear error for ${key}:`, error);
    }
  }

  /**
   * Clear all caches
   */
  async clearAllCaches() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
      Logger.log(`🗑️ Cleared ${cacheKeys.length} caches`);
    } catch (error) {
      Logger.error('❌ Clear all caches error:', error);
    }
  }

  /**
   * Queue a mutation for later execution
   */
  async queueMutation(mutation) {
    if (!AsyncStorage) {
      Logger.log('⚠️ Cannot queue mutation - AsyncStorage not available');
      throw new Error('Offline support not available');
    }

    try {
      const queue = await this.getMutationQueue();
      const mutationWithId = {
        ...mutation,
        id: `${Date.now()}_${Math.random()}`,
        timestamp: Date.now()
      };
      queue.push(mutationWithId);
      await AsyncStorage.setItem('mutation_queue', JSON.stringify(queue));
      Logger.log(`📝 Queued mutation: ${mutation.type}`, mutationWithId.id);
      return mutationWithId;
    } catch (error) {
      Logger.error('❌ Queue mutation error:', error);
      throw error;
    }
  }

  /**
   * Get mutation queue
   */
  async getMutationQueue() {
    if (!AsyncStorage) return [];

    try {
      const queue = await AsyncStorage.getItem('mutation_queue');
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      Logger.error('❌ Get queue error:', error);
      return [];
    }
  }

  /**
   * Remove mutation from queue
   */
  async removeMutation(mutationId) {
    if (!AsyncStorage) return;

    try {
      const queue = await this.getMutationQueue();
      const filtered = queue.filter(m => m.id !== mutationId);
      await AsyncStorage.setItem('mutation_queue', JSON.stringify(filtered));
      Logger.log(`✅ Removed mutation: ${mutationId}`);
    } catch (error) {
      Logger.error('❌ Remove mutation error:', error);
    }
  }

  /**
   * Sync pending mutations
   */
  async syncPendingMutations() {
    if (this.syncInProgress) {
      Logger.log('⏳ Sync already in progress');
      return;
    }

    if (!this.isOnline) {
      Logger.log('📡 Offline - skipping sync');
      return;
    }

    try {
      this.syncInProgress = true;
      const queue = await this.getMutationQueue();
      
      if (queue.length === 0) {
        Logger.log('✅ No pending mutations');
        return;
      }

      Logger.log(`🔄 Syncing ${queue.length} pending mutations`);

      for (const mutation of queue) {
        try {
          await this.executeMutation(mutation);
          await this.removeMutation(mutation.id);
          Logger.log(`✅ Synced: ${mutation.type}`);
        } catch (error) {
          Logger.error(`❌ Sync failed for ${mutation.type}:`, error);
          // Keep in queue for retry
        }
      }

      Logger.log('✅ Sync complete');
    } catch (error) {
      Logger.error('❌ Sync error:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Execute a queued mutation
   */
  async executeMutation(mutation) {
    const { type, endpoint, method, data } = mutation;

    // Import ApiService dynamically to avoid circular dependency
    const ApiService = require('./api').default;

    switch (method) {
      case 'POST':
        return await ApiService.request(endpoint, {
          method: 'POST',
          body: JSON.stringify(data)
        });
      case 'PUT':
        return await ApiService.request(endpoint, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
      case 'DELETE':
        return await ApiService.request(endpoint, {
          method: 'DELETE'
        });
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  }

  /**
   * Get pending mutations count
   */
  async getPendingCount() {
    const queue = await this.getMutationQueue();
    return queue.length;
  }

  /**
   * Check if online
   */
  getOnlineStatus() {
    return this.isOnline;
  }
}

// Export singleton instance
export default new OfflineManager();

import ApiService from './api';
import OfflineManager from './OfflineManager';
import Logger from '../utils/logger';

/**
 * Offline-aware API Service
 * Wraps ApiService with offline caching and mutation queuing
 */
class OfflineApiService {
  /**
   * Make a GET request with caching
   */
  async get(endpoint, options = {}) {
    const { cache = true, ttl = 3600000 } = options;
    const cacheKey = `GET_${endpoint}`;

    // Try cache first if offline or cache enabled
    if (cache) {
      const cached = await OfflineManager.getCachedResponse(cacheKey);
      if (cached) {
        Logger.log(`📦 Using cached data for: ${endpoint}`);
        return cached;
      }
    }

    // If offline and no cache, throw error
    if (!OfflineManager.getOnlineStatus()) {
      throw new Error('No internet connection and no cached data available');
    }

    // Fetch from API
    try {
      const response = await ApiService.request(endpoint);
      
      // Cache successful response
      if (response.success && cache) {
        await OfflineManager.cacheResponse(cacheKey, response, ttl);
      }
      
      return response;
    } catch (error) {
      // Try cache as fallback
      if (cache) {
        const cached = await OfflineManager.getCachedResponse(cacheKey);
        if (cached) {
          Logger.log(`📦 Using stale cache due to error: ${endpoint}`);
          return { ...cached, _fromCache: true, _stale: true };
        }
      }
      throw error;
    }
  }

  /**
   * Make a POST request with offline queuing
   */
  async post(endpoint, data, options = {}) {
    const { optimistic = false, invalidateCache = [] } = options;

    // If offline, queue the mutation
    if (!OfflineManager.getOnlineStatus()) {
      Logger.log(`📡 Offline - queuing POST: ${endpoint}`);
      
      const mutation = {
        type: 'POST',
        endpoint,
        method: 'POST',
        data
      };
      
      await OfflineManager.queueMutation(mutation);
      
      // Invalidate related caches
      for (const cacheKey of invalidateCache) {
        await OfflineManager.clearCache(cacheKey);
      }
      
      // Return optimistic response
      if (optimistic) {
        return {
          success: true,
          _optimistic: true,
          _queued: true,
          data
        };
      }
      
      throw new Error('Offline - mutation queued for sync');
    }

    // Online - execute immediately
    try {
      const response = await ApiService.request(endpoint, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      // Invalidate related caches
      for (const cacheKey of invalidateCache) {
        await OfflineManager.clearCache(cacheKey);
      }
      
      return response;
    } catch (error) {
      // Queue for retry if network error
      if (error.message.includes('Network') || error.message.includes('timeout')) {
        Logger.log(`🔄 Network error - queuing POST: ${endpoint}`);
        await OfflineManager.queueMutation({
          type: 'POST',
          endpoint,
          method: 'POST',
          data
        });
      }
      throw error;
    }
  }

  /**
   * Make a PUT request with offline queuing
   */
  async put(endpoint, data, options = {}) {
    const { optimistic = false, invalidateCache = [] } = options;

    // If offline, queue the mutation
    if (!OfflineManager.getOnlineStatus()) {
      Logger.log(`📡 Offline - queuing PUT: ${endpoint}`);
      
      const mutation = {
        type: 'PUT',
        endpoint,
        method: 'PUT',
        data
      };
      
      await OfflineManager.queueMutation(mutation);
      
      // Invalidate related caches
      for (const cacheKey of invalidateCache) {
        await OfflineManager.clearCache(cacheKey);
      }
      
      // Return optimistic response
      if (optimistic) {
        return {
          success: true,
          _optimistic: true,
          _queued: true,
          data
        };
      }
      
      throw new Error('Offline - mutation queued for sync');
    }

    // Online - execute immediately
    try {
      const response = await ApiService.request(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      
      // Invalidate related caches
      for (const cacheKey of invalidateCache) {
        await OfflineManager.clearCache(cacheKey);
      }
      
      return response;
    } catch (error) {
      // Queue for retry if network error
      if (error.message.includes('Network') || error.message.includes('timeout')) {
        Logger.log(`🔄 Network error - queuing PUT: ${endpoint}`);
        await OfflineManager.queueMutation({
          type: 'PUT',
          endpoint,
          method: 'PUT',
          data
        });
      }
      throw error;
    }
  }

  /**
   * Make a DELETE request with offline queuing
   */
  async delete(endpoint, options = {}) {
    const { optimistic = false, invalidateCache = [] } = options;

    // If offline, queue the mutation
    if (!OfflineManager.getOnlineStatus()) {
      Logger.log(`📡 Offline - queuing DELETE: ${endpoint}`);
      
      const mutation = {
        type: 'DELETE',
        endpoint,
        method: 'DELETE'
      };
      
      await OfflineManager.queueMutation(mutation);
      
      // Invalidate related caches
      for (const cacheKey of invalidateCache) {
        await OfflineManager.clearCache(cacheKey);
      }
      
      // Return optimistic response
      if (optimistic) {
        return {
          success: true,
          _optimistic: true,
          _queued: true
        };
      }
      
      throw new Error('Offline - mutation queued for sync');
    }

    // Online - execute immediately
    try {
      const response = await ApiService.request(endpoint, {
        method: 'DELETE'
      });
      
      // Invalidate related caches
      for (const cacheKey of invalidateCache) {
        await OfflineManager.clearCache(cacheKey);
      }
      
      return response;
    } catch (error) {
      // Queue for retry if network error
      if (error.message.includes('Network') || error.message.includes('timeout')) {
        Logger.log(`🔄 Network error - queuing DELETE: ${endpoint}`);
        await OfflineManager.queueMutation({
          type: 'DELETE',
          endpoint,
          method: 'DELETE'
        });
      }
      throw error;
    }
  }

  /**
   * Clear cache for specific key
   */
  async clearCache(key) {
    return OfflineManager.clearCache(key);
  }

  /**
   * Get pending mutations count
   */
  async getPendingCount() {
    return OfflineManager.getPendingCount();
  }

  /**
   * Manually trigger sync
   */
  async sync() {
    return OfflineManager.syncPendingMutations();
  }

  /**
   * Add network status listener
   */
  addNetworkListener(callback) {
    return OfflineManager.addListener(callback);
  }

  /**
   * Get online status
   */
  isOnline() {
    return OfflineManager.getOnlineStatus();
  }
}

// Create instance
const offlineApiService = new OfflineApiService();

// Proxy all ApiService methods through OfflineApiService
// This allows calling methods like getUsers(), getExercises(), etc.
const handler = {
  get(target, prop) {
    // If OfflineApiService has the method, use it
    if (prop in target) {
      return target[prop];
    }
    
    // Otherwise, proxy to ApiService
    if (prop in ApiService && typeof ApiService[prop] === 'function') {
      return ApiService[prop].bind(ApiService);
    }
    
    return target[prop];
  }
};

export default new Proxy(offlineApiService, handler);

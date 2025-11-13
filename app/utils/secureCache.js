/**
 * Secure Cache Utility
 * 
 * Provides encrypted caching for sensitive data using expo-secure-store
 * Falls back to AsyncStorage for non-sensitive data
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import Logger from './logger';

// Maximum size for SecureStore (2KB limit on some platforms)
const SECURE_STORE_MAX_SIZE = 2048;

// Cache types
export const CacheType = {
  SENSITIVE: 'sensitive',   // Uses SecureStore (encrypted)
  NORMAL: 'normal',         // Uses AsyncStorage (not encrypted)
};

class SecureCache {
  /**
   * Store data in cache
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {string} type - CacheType.SENSITIVE or CacheType.NORMAL
   * @param {number} ttl - Time to live in milliseconds (optional)
   */
  async set(key, data, type = CacheType.NORMAL, ttl = null) {
    try {
      const cacheEntry = {
        data,
        timestamp: Date.now(),
        ttl,
        version: '1.0'
      };

      const serialized = JSON.stringify(cacheEntry);

      if (type === CacheType.SENSITIVE) {
        // Check size limit for SecureStore
        if (serialized.length > SECURE_STORE_MAX_SIZE) {
          Logger.warn('Data too large for SecureStore, using AsyncStorage');
          await AsyncStorage.setItem(`secure_${key}`, serialized);
        } else {
          await SecureStore.setItemAsync(key, serialized);
        }
        Logger.log(`🔒 Cached securely: ${key}`);
      } else {
        await AsyncStorage.setItem(key, serialized);
        Logger.log(`💾 Cached: ${key}`);
      }

      return true;
    } catch (error) {
      Logger.error(`Cache set error for ${key}`, error);
      return false;
    }
  }

  /**
   * Get data from cache
   * @param {string} key - Cache key
   * @param {string} type - CacheType.SENSITIVE or CacheType.NORMAL
   * @returns {any|null} - Cached data or null if not found/expired
   */
  async get(key, type = CacheType.NORMAL) {
    try {
      let cached;

      if (type === CacheType.SENSITIVE) {
        // Try SecureStore first
        cached = await SecureStore.getItemAsync(key);
        
        // Fallback to AsyncStorage if not found
        if (!cached) {
          cached = await AsyncStorage.getItem(`secure_${key}`);
        }
      } else {
        cached = await AsyncStorage.getItem(key);
      }

      if (!cached) return null;

      const cacheEntry = JSON.parse(cached);
      
      // Check if expired
      if (cacheEntry.ttl) {
        const age = Date.now() - cacheEntry.timestamp;
        if (age > cacheEntry.ttl) {
          Logger.log(`Cache expired: ${key}`);
          await this.remove(key, type);
          return null;
        }
      }

      Logger.log(`✅ Cache hit: ${key}`);
      return cacheEntry.data;
    } catch (error) {
      Logger.error(`Cache get error for ${key}`, error);
      return null;
    }
  }

  /**
   * Remove data from cache
   * @param {string} key - Cache key
   * @param {string} type - CacheType.SENSITIVE or CacheType.NORMAL
   */
  async remove(key, type = CacheType.NORMAL) {
    try {
      if (type === CacheType.SENSITIVE) {
        await SecureStore.deleteItemAsync(key);
        await AsyncStorage.removeItem(`secure_${key}`);
      } else {
        await AsyncStorage.removeItem(key);
      }
      Logger.log(`🗑️ Cache removed: ${key}`);
      return true;
    } catch (error) {
      Logger.error(`Cache remove error for ${key}`, error);
      return false;
    }
  }

  /**
   * Clear all cache entries matching a pattern
   * @param {string} pattern - Pattern to match (e.g., 'chat_messages_')
   */
  async clearPattern(pattern) {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const matchingKeys = keys.filter(key => key.includes(pattern));
      
      if (matchingKeys.length > 0) {
        await AsyncStorage.multiRemove(matchingKeys);
        Logger.log(`🗑️ Cleared ${matchingKeys.length} cache entries matching: ${pattern}`);
      }
      
      return matchingKeys.length;
    } catch (error) {
      Logger.error('Cache clear pattern error', error);
      return 0;
    }
  }

  /**
   * Clear all cache
   */
  async clearAll() {
    try {
      await AsyncStorage.clear();
      Logger.log('🗑️ All cache cleared');
      return true;
    } catch (error) {
      Logger.error('Cache clear all error', error);
      return false;
    }
  }

  /**
   * Get cache info
   */
  async getInfo() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let totalSize = 0;
      const caches = [];

      for (const key of keys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const sizeInBytes = new Blob([data]).size;
          totalSize += sizeInBytes;
          
          try {
            const parsed = JSON.parse(data);
            caches.push({
              key,
              sizeInKB: Math.round(sizeInBytes / 1024 * 100) / 100,
              age: parsed.timestamp ? Math.round((Date.now() - parsed.timestamp) / 1000) : null,
              hasExpiry: !!parsed.ttl
            });
          } catch {
            // Not a cache entry
          }
        }
      }

      return {
        totalCaches: caches.length,
        totalSize: `${Math.round(totalSize / 1024 * 100) / 100} KB`,
        caches
      };
    } catch (error) {
      Logger.error('Cache info error', error);
      return { totalCaches: 0, totalSize: '0 KB', caches: [] };
    }
  }

  /**
   * Hash a key for additional security
   * @param {string} key - Key to hash
   * @returns {Promise<string>} - Hashed key
   */
  async hashKey(key) {
    try {
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        key
      );
      return hash.substring(0, 32); // Limit length
    } catch (error) {
      Logger.error('Key hash error', error);
      return key; // Fallback to original key
    }
  }
}

// Export singleton instance
export default new SecureCache();

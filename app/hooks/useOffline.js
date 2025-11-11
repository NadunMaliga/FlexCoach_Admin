import { useState, useEffect } from 'react';
import OfflineApiService from '../services/OfflineApiService';
import Logger from '../utils/logger';

/**
 * Hook for offline support
 * Provides network status and pending mutations count
 */
export function useOffline() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Initial status
    setIsOnline(OfflineApiService.isOnline());
    updatePendingCount();

    // Listen for network changes
    const unsubscribe = OfflineApiService.addNetworkListener((online) => {
      setIsOnline(online);
      updatePendingCount();
    });

    // Update pending count periodically
    const interval = setInterval(updatePendingCount, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const updatePendingCount = async () => {
    try {
      const count = await OfflineApiService.getPendingCount();
      setPendingCount(count);
    } catch (error) {
      Logger.error('Error getting pending count:', error);
    }
  };

  const sync = async () => {
    try {
      await OfflineApiService.sync();
      await updatePendingCount();
    } catch (error) {
      Logger.error('Sync error:', error);
      throw error;
    }
  };

  return {
    isOnline,
    pendingCount,
    sync
  };
}

/**
 * Hook for cached data with automatic refresh
 */
export function useCachedData(fetchFunction, dependencies = [], options = {}) {
  const { ttl = 3600000, refreshOnFocus = true } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fromCache, setFromCache] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFunction();
      setData(result);
      setFromCache(result._fromCache || false);
    } catch (err) {
      setError(err.message);
      Logger.error('useCachedData error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, dependencies);

  const refresh = () => {
    loadData();
  };

  return {
    data,
    loading,
    error,
    fromCache,
    refresh
  };
}

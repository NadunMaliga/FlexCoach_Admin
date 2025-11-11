import { useState, useEffect } from 'react';
import { AppState } from 'react-native';
import BackgroundSyncManager from '../services/BackgroundSyncManager';
import Logger from '../utils/logger';

/**
 * Hook for background sync functionality
 */
export function useBackgroundSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [badgeCount, setBadgeCount] = useState(0);

  useEffect(() => {
    // Initialize background sync
    BackgroundSyncManager.initialize();

    // Update badge count
    updateBadgeCount();

    // Listen for app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  const handleAppStateChange = async (nextAppState) => {
    if (nextAppState === 'active') {
      // App came to foreground - sync
      Logger.log('📱 App active - triggering sync');
      await triggerSync();
    }
  };

  const updateBadgeCount = async () => {
    try {
      const count = await BackgroundSyncManager.getBadgeCount();
      setBadgeCount(count);
    } catch (error) {
      Logger.error('Error updating badge count:', error);
    }
  };

  const triggerSync = async () => {
    if (isSyncing) return;

    try {
      setIsSyncing(true);
      await BackgroundSyncManager.triggerSync();
      setLastSyncTime(new Date());
      await updateBadgeCount();
    } catch (error) {
      Logger.error('Sync error:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  const clearNotifications = async () => {
    try {
      await BackgroundSyncManager.clearNotifications();
      await updateBadgeCount();
    } catch (error) {
      Logger.error('Clear notifications error:', error);
    }
  };

  return {
    isSyncing,
    lastSyncTime,
    badgeCount,
    triggerSync,
    clearNotifications
  };
}

/**
 * Hook for notification handling
 */
export function useNotifications(onNotification) {
  useEffect(() => {
    const unsubscribe = BackgroundSyncManager.addNotificationListener(onNotification);
    return unsubscribe;
  }, [onNotification]);
}

// Gracefully handle missing dependencies
let BackgroundFetch, TaskManager, Notifications, AsyncStorage;
try {
  BackgroundFetch = require('expo-background-fetch');
  TaskManager = require('expo-task-manager');
  Notifications = require('expo-notifications');
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (error) {
  console.warn('⚠️ Background sync dependencies not installed. Run: npx expo install @react-native-async-storage/async-storage expo-background-fetch expo-task-manager expo-notifications');
}

import OfflineManager from './OfflineManager';
import Logger from '../utils/logger';

const BACKGROUND_SYNC_TASK = 'background-sync-task';
const SYNC_INTERVAL = 15 * 60; // 15 minutes (minimum allowed by iOS)

/**
 * Background Sync Manager
 * Handles periodic data refresh and push notifications
 */
class BackgroundSyncManager {
  constructor() {
    this.isRegistered = false;
    this.notificationListeners = [];
    this.isAvailable = !!(BackgroundFetch && TaskManager && Notifications && AsyncStorage);
  }

  /**
   * Initialize background sync and notifications
   */
  async initialize() {
    if (!this.isAvailable) {
      Logger.log('⚠️ Background sync not available - running in Expo Go or dependencies not installed');
      return;
    }

    // Check if running in Expo Go
    try {
      const Constants = require('expo-constants').default;
      if (Constants.appOwnership === 'expo') {
        Logger.log('⚠️ Background sync not available in Expo Go - build a development build to use this feature');
        return;
      }
    } catch (e) {
      // Constants not available, continue
    }

    try {
      await this.setupNotifications();
      await this.registerBackgroundTask();
      Logger.log('✅ Background sync initialized');
    } catch (error) {
      Logger.log('⚠️ Background sync registration skipped:', error.message);
      // Don't throw - allow app to continue without background sync
    }
  }

  /**
   * Setup push notifications
   */
  async setupNotifications() {
    if (!this.isAvailable || !Notifications) {
      return;
    }

    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Logger.log('⚠️ Notification permissions not granted');
        return;
      }

      // Configure notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      // Get push token (for remote notifications)
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      Logger.log('📱 Push token:', token);

      // Store token for backend
      await AsyncStorage.setItem('pushToken', token);

      // Add notification listeners
      this.addNotificationListeners();

      Logger.log('✅ Notifications configured');
    } catch (error) {
      Logger.error('❌ Notification setup error:', error);
    }
  }

  /**
   * Add notification event listeners
   */
  addNotificationListeners() {
    // Notification received while app is foregrounded
    Notifications.addNotificationReceivedListener(notification => {
      Logger.log('📬 Notification received:', notification);
      this.notificationListeners.forEach(listener => listener(notification));
    });

    // Notification tapped
    Notifications.addNotificationResponseReceivedListener(response => {
      Logger.log('👆 Notification tapped:', response);
      this.handleNotificationTap(response);
    });
  }

  /**
   * Handle notification tap
   */
  handleNotificationTap(response) {
    const data = response.notification.request.content.data;
    
    // Navigate based on notification type
    if (data.type === 'new_client') {
      // Navigate to clients screen
      Logger.log('Navigate to clients');
    } else if (data.type === 'sync_complete') {
      // Show sync complete message
      Logger.log('Sync complete');
    }
  }

  /**
   * Register background fetch task
   */
  async registerBackgroundTask() {
    if (!this.isAvailable || !BackgroundFetch || !TaskManager) {
      return;
    }

    try {
      // Define the background task
      TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
        try {
          Logger.log('🔄 Background sync started');
          
          // Sync pending mutations
          await OfflineManager.syncPendingMutations();
          
          // Refresh critical data
          await this.refreshCriticalData();
          
          // Check for updates and notify
          await this.checkForUpdates();
          
          Logger.log('✅ Background sync completed');
          
          return BackgroundFetch.BackgroundFetchResult.NewData;
        } catch (error) {
          Logger.error('❌ Background sync error:', error);
          return BackgroundFetch.BackgroundFetchResult.Failed;
        }
      });

      // Register the task
      await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
        minimumInterval: SYNC_INTERVAL,
        stopOnTerminate: false,
        startOnBoot: true,
      });

      this.isRegistered = true;
      Logger.log('✅ Background task registered');
    } catch (error) {
      Logger.error('❌ Background task registration error:', error);
    }
  }

  /**
   * Unregister background task
   */
  async unregisterBackgroundTask() {
    try {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
      this.isRegistered = false;
      Logger.log('✅ Background task unregistered');
    } catch (error) {
      Logger.error('❌ Background task unregistration error:', error);
    }
  }

  /**
   * Refresh critical data in background
   */
  async refreshCriticalData() {
    try {
      // Import ApiService dynamically to avoid circular dependency
      const ApiService = require('./api').default;

      // Refresh dashboard stats
      const statsResponse = await ApiService.getClientOverview('7');
      if (statsResponse.success) {
        await OfflineManager.cacheResponse('GET_/client-overview', statsResponse);
        Logger.log('✅ Dashboard stats refreshed');
      }

      // Refresh recent users
      const usersResponse = await ApiService.getUsers({ 
        limit: 5, 
        sortBy: 'createdAt', 
        sortOrder: 'desc' 
      });
      if (usersResponse.success) {
        await OfflineManager.cacheResponse('GET_/users_recent', usersResponse);
        Logger.log('✅ Recent users refreshed');
      }
    } catch (error) {
      Logger.error('❌ Critical data refresh error:', error);
    }
  }

  /**
   * Check for updates and send notifications
   */
  async checkForUpdates() {
    try {
      // Get last check timestamp
      const lastCheck = await AsyncStorage.getItem('lastUpdateCheck');
      const lastCheckTime = lastCheck ? parseInt(lastCheck) : 0;

      // Import ApiService
      const ApiService = require('./api').default;

      // Check for new clients
      const newClientsResponse = await ApiService.getUsers({
        createdAfter: new Date(lastCheckTime).toISOString(),
        limit: 10
      });

      if (newClientsResponse.success && newClientsResponse.users?.length > 0) {
        const count = newClientsResponse.users.length;
        await this.sendLocalNotification(
          'New Clients',
          `${count} new client${count > 1 ? 's' : ''} joined`,
          { type: 'new_client', count }
        );
      }

      // Check for pending approvals
      const pendingResponse = await ApiService.getUsers({
        status: 'pending',
        limit: 10
      });

      if (pendingResponse.success && pendingResponse.users?.length > 0) {
        const count = pendingResponse.users.length;
        await this.sendLocalNotification(
          'Pending Approvals',
          `${count} client${count > 1 ? 's' : ''} waiting for approval`,
          { type: 'pending_approval', count }
        );
      }

      // Update last check timestamp
      await AsyncStorage.setItem('lastUpdateCheck', Date.now().toString());
    } catch (error) {
      Logger.error('❌ Update check error:', error);
    }
  }

  /**
   * Send local notification
   */
  async sendLocalNotification(title, body, data = {}) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          badge: 1,
        },
        trigger: null, // Show immediately
      });
      Logger.log('📬 Notification sent:', title);
    } catch (error) {
      Logger.error('❌ Send notification error:', error);
    }
  }

  /**
   * Send notification after sync complete
   */
  async notifySyncComplete(count) {
    if (count > 0) {
      await this.sendLocalNotification(
        'Sync Complete',
        `${count} change${count > 1 ? 's' : ''} synced successfully`,
        { type: 'sync_complete', count }
      );
    }
  }

  /**
   * Clear all notifications
   */
  async clearNotifications() {
    try {
      await Notifications.dismissAllNotificationsAsync();
      await Notifications.setBadgeCountAsync(0);
      Logger.log('✅ Notifications cleared');
    } catch (error) {
      Logger.error('❌ Clear notifications error:', error);
    }
  }

  /**
   * Get notification badge count
   */
  async getBadgeCount() {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      Logger.error('❌ Get badge count error:', error);
      return 0;
    }
  }

  /**
   * Set notification badge count
   */
  async setBadgeCount(count) {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      Logger.error('❌ Set badge count error:', error);
    }
  }

  /**
   * Add notification listener
   */
  addNotificationListener(callback) {
    this.notificationListeners.push(callback);
    return () => {
      this.notificationListeners = this.notificationListeners.filter(
        cb => cb !== callback
      );
    };
  }

  /**
   * Check if background sync is enabled
   */
  async isBackgroundSyncEnabled() {
    try {
      const status = await BackgroundFetch.getStatusAsync();
      return status === BackgroundFetch.BackgroundFetchStatus.Available;
    } catch (error) {
      Logger.error('❌ Check background sync status error:', error);
      return false;
    }
  }

  /**
   * Manually trigger background sync
   */
  async triggerSync() {
    if (!this.isAvailable) {
      Logger.log('⚠️ Background sync not available');
      return;
    }

    try {
      Logger.log('🔄 Manual sync triggered');
      await OfflineManager.syncPendingMutations();
      await this.refreshCriticalData();
      Logger.log('✅ Manual sync completed');
    } catch (error) {
      Logger.error('❌ Manual sync error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new BackgroundSyncManager();

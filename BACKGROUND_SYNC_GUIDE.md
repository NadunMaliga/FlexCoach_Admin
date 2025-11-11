# Background Sync & Push Notifications Guide

## Overview
Complete background sync system with periodic data refresh and push notifications for real-time updates.

---

## 📦 Installation

### Required Dependencies
```bash
npx expo install expo-background-fetch expo-task-manager expo-notifications
```

### Configure app.json
```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#d5ff5f",
          "sounds": ["./assets/notification-sound.wav"]
        }
      ]
    ],
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": ["fetch", "remote-notification"]
      }
    },
    "android": {
      "permissions": [
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE",
        "WAKE_LOCK"
      ],
      "useNextNotificationsApi": true
    }
  }
}
```

---

## 🏗️ Architecture

### Components
1. **BackgroundSyncManager** - Core background sync functionality
2. **useBackgroundSync Hook** - React hook for sync features
3. **useNotifications Hook** - React hook for notifications
4. **Automatic Sync** - Syncs every 15 minutes in background
5. **Push Notifications** - Local and remote notifications

### Sync Flow
```
Background Task Triggered (every 15 min)
  ↓
Sync Pending Mutations
  ↓
Refresh Critical Data (dashboard, users)
  ↓
Check for Updates (new clients, approvals)
  ↓
Send Notifications if needed
  ↓
Update Cache
```

---

## 🚀 Usage Examples

### 1. Initialize in App Root

```javascript
import { useEffect } from 'react';
import BackgroundSyncManager from './services/BackgroundSyncManager';

export default function App() {
  useEffect(() => {
    // Initialize background sync and notifications
    BackgroundSyncManager.initialize();
  }, []);

  return <YourApp />;
}
```

### 2. Use Background Sync Hook

```javascript
import { useBackgroundSync } from '../hooks/useBackgroundSync';

function Dashboard() {
  const { 
    isSyncing, 
    lastSyncTime, 
    badgeCount, 
    triggerSync, 
    clearNotifications 
  } = useBackgroundSync();

  return (
    <View>
      {isSyncing && <Text>Syncing...</Text>}
      
      {lastSyncTime && (
        <Text>Last sync: {lastSyncTime.toLocaleTimeString()}</Text>
      )}
      
      {badgeCount > 0 && (
        <View style={styles.badge}>
          <Text>{badgeCount}</Text>
        </View>
      )}
      
      <TouchableOpacity onPress={triggerSync}>
        <Text>Sync Now</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={clearNotifications}>
        <Text>Clear Notifications</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### 3. Handle Notifications

```javascript
import { useNotifications } from '../hooks/useBackgroundSync';

function MyComponent() {
  useNotifications((notification) => {
    console.log('Notification received:', notification);
    
    const { type, count } = notification.request.content.data;
    
    if (type === 'new_client') {
      Alert.alert('New Client', `${count} new clients joined!`);
    } else if (type === 'pending_approval') {
      Alert.alert('Pending', `${count} clients need approval`);
    }
  });

  return <YourComponent />;
}
```

### 4. Send Custom Notifications

```javascript
import BackgroundSyncManager from '../services/BackgroundSyncManager';

// Send notification
await BackgroundSyncManager.sendLocalNotification(
  'Task Complete',
  'Your workout schedule has been created',
  { type: 'workout_created', workoutId: '123' }
);

// Update badge count
await BackgroundSyncManager.setBadgeCount(5);

// Clear all notifications
await BackgroundSyncManager.clearNotifications();
```

### 5. Manual Sync Trigger

```javascript
import BackgroundSyncManager from '../services/BackgroundSyncManager';

// Trigger sync manually
const handleRefresh = async () => {
  try {
    await BackgroundSyncManager.triggerSync();
    Alert.alert('Success', 'Data synced successfully');
  } catch (error) {
    Alert.alert('Error', 'Sync failed');
  }
};
```

---

## 🔔 Notification Types

### 1. New Clients
Sent when new clients register
```javascript
{
  title: 'New Clients',
  body: '3 new clients joined',
  data: { type: 'new_client', count: 3 }
}
```

### 2. Pending Approvals
Sent when clients need approval
```javascript
{
  title: 'Pending Approvals',
  body: '2 clients waiting for approval',
  data: { type: 'pending_approval', count: 2 }
}
```

### 3. Sync Complete
Sent after successful sync
```javascript
{
  title: 'Sync Complete',
  body: '5 changes synced successfully',
  data: { type: 'sync_complete', count: 5 }
}
```

### 4. Custom Notifications
Create your own notification types
```javascript
await BackgroundSyncManager.sendLocalNotification(
  'Custom Title',
  'Custom message',
  { type: 'custom', customData: 'value' }
);
```

---

## ⚙️ Configuration

### Sync Interval
Default: 15 minutes (iOS minimum)

```javascript
// In BackgroundSyncManager.js
const SYNC_INTERVAL = 15 * 60; // seconds

// Change to 30 minutes
const SYNC_INTERVAL = 30 * 60;
```

### Critical Data to Refresh
Customize what data gets refreshed in background

```javascript
async refreshCriticalData() {
  // Add your critical data endpoints
  const dashboardResponse = await ApiService.getDashboardStats();
  const usersResponse = await ApiService.getUsers();
  const workoutsResponse = await ApiService.getWorkoutSchedules();
  
  // Cache responses
  await OfflineManager.cacheResponse('dashboard', dashboardResponse);
  await OfflineManager.cacheResponse('users', usersResponse);
  await OfflineManager.cacheResponse('workouts', workoutsResponse);
}
```

### Update Checks
Customize what updates to check for

```javascript
async checkForUpdates() {
  // Check for new messages
  const messagesResponse = await ApiService.getUnreadMessages();
  if (messagesResponse.unreadCount > 0) {
    await this.sendLocalNotification(
      'New Messages',
      `You have ${messagesResponse.unreadCount} unread messages`,
      { type: 'new_messages', count: messagesResponse.unreadCount }
    );
  }
  
  // Check for schedule changes
  const scheduleResponse = await ApiService.getScheduleUpdates();
  if (scheduleResponse.hasUpdates) {
    await this.sendLocalNotification(
      'Schedule Updated',
      'Your workout schedule has been updated',
      { type: 'schedule_update' }
    );
  }
}
```

---

## 🎯 Best Practices

### 1. Sync Strategy
- Sync pending mutations first
- Refresh critical data second
- Check for updates last
- Keep sync tasks under 30 seconds

### 2. Notification Strategy
- Only notify for important updates
- Group similar notifications
- Use clear, actionable messages
- Respect user notification preferences

### 3. Battery Optimization
- Minimize network requests
- Cache aggressively
- Use efficient queries
- Batch operations

### 4. Error Handling
- Gracefully handle network errors
- Retry failed syncs
- Log errors for debugging
- Don't spam notifications on errors

---

## 📱 Platform Differences

### iOS
- Minimum sync interval: 15 minutes
- System decides exact timing
- May not run if battery is low
- Requires background modes in Info.plist

### Android
- More flexible timing
- Can run more frequently
- Better background execution
- Requires WAKE_LOCK permission

---

## 🧪 Testing

### Test Background Sync
```javascript
// Manually trigger background task
import * as BackgroundFetch from 'expo-background-fetch';
import { BACKGROUND_SYNC_TASK } from './services/BackgroundSyncManager';

// Trigger immediately
await BackgroundFetch.BackgroundFetchResult.NewData;
```

### Test Notifications
```javascript
import BackgroundSyncManager from './services/BackgroundSyncManager';

// Send test notification
await BackgroundSyncManager.sendLocalNotification(
  'Test Notification',
  'This is a test',
  { type: 'test' }
);
```

### Simulate Background
```javascript
// In development
import { AppState } from 'react-native';

// Simulate app going to background
AppState.currentState = 'background';

// Wait 15 minutes (or trigger manually)

// Simulate app coming to foreground
AppState.currentState = 'active';
```

---

## 🔧 Troubleshooting

### Background Sync Not Running
1. Check if background fetch is available
```javascript
const status = await BackgroundSyncManager.isBackgroundSyncEnabled();
console.log('Background sync enabled:', status);
```

2. Verify task is registered
```javascript
const tasks = await TaskManager.getRegisteredTasksAsync();
console.log('Registered tasks:', tasks);
```

3. Check iOS background modes
- Ensure `UIBackgroundModes` includes `fetch`

### Notifications Not Showing
1. Check permissions
```javascript
const { status } = await Notifications.getPermissionsAsync();
console.log('Notification permission:', status);
```

2. Request permissions if needed
```javascript
await Notifications.requestPermissionsAsync();
```

3. Verify notification handler is set
```javascript
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
```

### High Battery Usage
- Increase sync interval
- Reduce data refresh frequency
- Optimize API queries
- Cache more aggressively

---

## 📊 Monitoring

### Track Sync Performance
```javascript
const startTime = Date.now();
await BackgroundSyncManager.triggerSync();
const duration = Date.now() - startTime;
console.log(`Sync completed in ${duration}ms`);
```

### Monitor Notification Delivery
```javascript
BackgroundSyncManager.addNotificationListener((notification) => {
  console.log('Notification delivered:', {
    title: notification.request.content.title,
    timestamp: new Date(),
  });
});
```

### Check Background Task Status
```javascript
const status = await BackgroundFetch.getStatusAsync();
console.log('Background fetch status:', {
  available: status === BackgroundFetch.BackgroundFetchStatus.Available,
  restricted: status === BackgroundFetch.BackgroundFetchStatus.Restricted,
  denied: status === BackgroundFetch.BackgroundFetchStatus.Denied,
});
```

---

## 🎨 UI Integration

### Sync Indicator
```javascript
function SyncIndicator() {
  const { isSyncing, lastSyncTime } = useBackgroundSync();
  
  return (
    <View style={styles.syncIndicator}>
      {isSyncing ? (
        <ActivityIndicator size="small" color="#d5ff5f" />
      ) : (
        <Feather name="check-circle" size={16} color="#4CAF50" />
      )}
      <Text style={styles.syncText}>
        {isSyncing 
          ? 'Syncing...' 
          : `Last sync: ${lastSyncTime?.toLocaleTimeString() || 'Never'}`
        }
      </Text>
    </View>
  );
}
```

### Notification Badge
```javascript
function NotificationBadge() {
  const { badgeCount } = useBackgroundSync();
  
  if (badgeCount === 0) return null;
  
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{badgeCount}</Text>
    </View>
  );
}
```

---

## 🚀 Advanced Features

### 1. Smart Sync
Only sync when data has changed
```javascript
async smartSync() {
  const lastSync = await AsyncStorage.getItem('lastSyncHash');
  const currentHash = await this.getDataHash();
  
  if (lastSync === currentHash) {
    Logger.log('No changes detected - skipping sync');
    return;
  }
  
  await this.triggerSync();
  await AsyncStorage.setItem('lastSyncHash', currentHash);
}
```

### 2. Priority Sync
Sync important data first
```javascript
async prioritySync() {
  // High priority
  await this.syncPendingMutations();
  await this.refreshDashboard();
  
  // Medium priority
  await this.refreshUsers();
  
  // Low priority
  await this.refreshHistory();
}
```

### 3. Conditional Notifications
Only notify during business hours
```javascript
async sendSmartNotification(title, body, data) {
  const hour = new Date().getHours();
  
  // Only send between 9 AM and 9 PM
  if (hour >= 9 && hour <= 21) {
    await this.sendLocalNotification(title, body, data);
  } else {
    // Queue for morning
    await this.queueNotification(title, body, data);
  }
}
```

---

## ✅ Checklist

- [ ] Install dependencies
- [ ] Configure app.json
- [ ] Initialize BackgroundSyncManager
- [ ] Request notification permissions
- [ ] Test background sync
- [ ] Test notifications
- [ ] Configure sync interval
- [ ] Customize critical data refresh
- [ ] Add notification handlers
- [ ] Monitor performance
- [ ] Optimize battery usage

---

## 🎉 Benefits

1. ✅ **Always Up-to-Date** - Data refreshes automatically
2. ✅ **Real-Time Alerts** - Push notifications for important events
3. ✅ **Auto-Sync** - Pending changes sync automatically
4. ✅ **Battery Efficient** - Optimized for minimal battery impact
5. ✅ **Offline-First** - Works seamlessly with offline support
6. ✅ **Native Feel** - Behaves like a true native app

---

## 📚 Additional Resources

- [Expo Background Fetch](https://docs.expo.dev/versions/latest/sdk/background-fetch/)
- [Expo Task Manager](https://docs.expo.dev/versions/latest/sdk/task-manager/)
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [iOS Background Execution](https://developer.apple.com/documentation/uikit/app_and_environment/scenes/preparing_your_ui_to_run_in_the_background)
- [Android Background Work](https://developer.android.com/guide/background)

# FlexCoach Admin - Native Features Setup

## 🚀 Quick Setup Guide

All the code is ready! Just follow these steps to activate the native features.

---

## Step 1: Install Dependencies

Run this command in the FlexCoach_Admin directory:

```bash
npx expo install @react-native-async-storage/async-storage @react-native-community/netinfo expo-background-fetch expo-task-manager expo-notifications
```

---

## Step 2: Create Notification Icon (Optional)

Create a notification icon at `assets/images/notification-icon.png`:
- Size: 96x96 pixels
- Background: Transparent
- Color: White or #d5ff5f

Or use your existing app icon temporarily.

---

## Step 3: Test the App

```bash
npx expo start
```

Then press:
- `i` for iOS simulator
- `a` for Android emulator
- Scan QR code for physical device

---

## Step 4: Test Offline Features

### Test Offline Mode
1. Open the app
2. Navigate to any screen (Dashboard, Clients, etc.)
3. Turn off WiFi/Data on your device
4. Try creating/updating/deleting items
5. Notice the offline indicator at the top
6. Turn WiFi/Data back on
7. Watch items sync automatically

### Test Background Sync
1. Keep the app running in background
2. Wait 15+ minutes (iOS) or check immediately (Android)
3. You should receive a notification if there are updates
4. Open the app to see synced data

### Test Optimistic Updates
1. Delete a workout in ExercisePlan
2. Notice it disappears immediately
3. If offline, it will sync when online
4. If error occurs, it will reappear with error message

---

## Step 5: Request Notification Permissions

On first launch, the app will request notification permissions. Make sure to:
1. Allow notifications when prompted
2. Check device settings if you miss the prompt
3. iOS: Settings → FlexCoach → Notifications
4. Android: Settings → Apps → FlexCoach → Notifications

---

## 🎯 What's Already Configured

### ✅ Code Changes
- [x] OfflineManager service created
- [x] OfflineApiService wrapper implemented
- [x] BackgroundSyncManager with notifications
- [x] OfflineIndicator added to root layout
- [x] All API calls migrated to OfflineApiService
- [x] Optimistic updates in ExercisePlan
- [x] BackgroundSync initialized in _layout.tsx

### ✅ Configuration
- [x] app.json configured with:
  - iOS background modes
  - Android permissions
  - Notification plugin
- [x] TypeScript types configured
- [x] Error boundaries in place

---

## 🧪 Testing Checklist

### Basic Functionality
- [ ] App launches successfully
- [ ] Can navigate between screens
- [ ] Data loads from API
- [ ] Can create/update/delete items

### Offline Features
- [ ] Offline indicator appears when offline
- [ ] Can view cached data offline
- [ ] Can create items offline (queued)
- [ ] Can update items offline (queued)
- [ ] Can delete items offline (queued)
- [ ] Items sync when back online
- [ ] Pending count shows in indicator

### Background Sync
- [ ] Notification permission requested
- [ ] Background sync runs periodically
- [ ] Notifications appear for updates
- [ ] Badge count updates
- [ ] Manual sync works from indicator

### Performance
- [ ] Tab switching is instant
- [ ] Images load from cache
- [ ] No unnecessary API calls
- [ ] Smooth animations
- [ ] No lag or stuttering

---

## 🐛 Troubleshooting

### Notifications Not Working

**iOS:**
```bash
# Reset permissions
npx expo start --clear
# Then reinstall app
```

**Android:**
```bash
# Check notification settings
adb shell dumpsys notification
```

### Background Sync Not Running

**iOS:**
- Background fetch is limited by iOS
- Test in production build, not development
- May take 15-30 minutes between syncs

**Android:**
- Should work immediately
- Check battery optimization settings
- Disable "Battery Saver" mode

### Offline Mode Not Working

1. Check AsyncStorage permissions
2. Clear app data and reinstall
3. Check network detection:
```javascript
import NetInfo from '@react-native-community/netinfo';
NetInfo.fetch().then(state => console.log(state));
```

### Cache Issues

Clear cache manually:
```javascript
import OfflineManager from './services/OfflineManager';
await OfflineManager.clearCache();
```

---

## 📊 Monitoring

### Check Offline Status
```javascript
import { useOffline } from './hooks/useOffline';

const { isOffline, pendingCount } = useOffline();
console.log('Offline:', isOffline);
console.log('Pending:', pendingCount);
```

### Check Background Sync
```javascript
import { useBackgroundSync } from './hooks/useBackgroundSync';

const { isSyncing, lastSync } = useBackgroundSync();
console.log('Syncing:', isSyncing);
console.log('Last sync:', lastSync);
```

### View Logs
```javascript
import logger from './utils/logger';
logger.info('App started');
```

---

## 🎨 Customization

### Change Sync Interval

Edit `BackgroundSyncManager.js`:
```javascript
const BACKGROUND_FETCH_TASK = 'background-fetch';
const SYNC_INTERVAL = 15 * 60; // Change this (in seconds)
```

### Change Cache TTL

Edit API calls:
```javascript
OfflineApiService.get('/users', {
  cache: true,
  ttl: 7200000 // 2 hours in milliseconds
});
```

### Customize Notifications

Edit `BackgroundSyncManager.js`:
```javascript
await Notifications.scheduleNotificationAsync({
  content: {
    title: 'Your Custom Title',
    body: 'Your custom message',
    data: { custom: 'data' },
  },
  trigger: null,
});
```

---

## 📚 Additional Resources

- [Offline Support Guide](./OFFLINE_SUPPORT_GUIDE.md)
- [Background Sync Guide](./BACKGROUND_SYNC_GUIDE.md)
- [Optimistic Updates Examples](./OPTIMISTIC_UPDATES_EXAMPLES.md)
- [Complete Implementation Summary](./COMPLETE_NATIVE_IMPLEMENTATION.md)

---

## 🎉 You're All Set!

Once you install the dependencies, your app will have:
- ✅ Full offline support
- ✅ Background sync
- ✅ Push notifications
- ✅ Optimistic UI updates
- ✅ Native-like performance

Just run `npx expo install` and start testing! 🚀

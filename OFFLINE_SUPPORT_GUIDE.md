# Offline Support Implementation Guide

## Overview
Complete offline support system with AsyncStorage caching, mutation queuing, and optimistic UI updates.

---

## 📦 Installation

### Required Dependencies
```bash
npm install @react-native-async-storage/async-storage @react-native-community/netinfo
```

Or with Expo:
```bash
npx expo install @react-native-async-storage/async-storage @react-native-community/netinfo
```

---

## 🏗️ Architecture

### Components
1. **OfflineManager** - Core offline functionality
2. **OfflineApiService** - API wrapper with offline support
3. **useOffline Hook** - React hook for offline features
4. **OfflineIndicator** - UI component showing network status

### Data Flow
```
User Action
  ↓
OfflineApiService
  ↓
Is Online? ──No──> Queue Mutation + Optimistic UI
  ↓ Yes
Execute API Call
  ↓
Cache Response
  ↓
Update UI
```

---

## 🚀 Usage Examples

### 1. Basic GET Request with Caching

```javascript
import OfflineApiService from '../services/OfflineApiService';

// Fetch with automatic caching
const loadUsers = async () => {
  try {
    const response = await OfflineApiService.get('/users', {
      cache: true,
      ttl: 3600000 // 1 hour
    });
    
    if (response._fromCache) {
      console.log('📦 Data from cache');
    }
    
    setUsers(response.users);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### 2. POST Request with Offline Queuing

```javascript
// Create with offline support
const createWorkout = async (workoutData) => {
  try {
    const response = await OfflineApiService.post(
      '/workout-schedules',
      workoutData,
      {
        optimistic: true, // Return immediately even if offline
        invalidateCache: ['GET_/workout-schedules'] // Clear related cache
      }
    );
    
    if (response._queued) {
      Alert.alert('Offline', 'Changes will sync when online');
    }
    
    return response;
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### 3. PUT Request with Optimistic Updates

```javascript
// Update with optimistic UI
const updateDiet = async (dietId, dietData) => {
  // Update UI immediately
  setDiets(prev => prev.map(d => 
    d._id === dietId ? { ...d, ...dietData, _optimistic: true } : d
  ));
  
  try {
    const response = await OfflineApiService.put(
      `/diet-plans/${dietId}`,
      dietData,
      {
        optimistic: true,
        invalidateCache: [`GET_/diet-plans/${dietId}`, 'GET_/diet-plans']
      }
    );
    
    // Remove optimistic flag when synced
    if (!response._queued) {
      setDiets(prev => prev.map(d => 
        d._id === dietId ? { ...d, _optimistic: false } : d
      ));
    }
  } catch (error) {
    // Revert optimistic update on error
    setDiets(prev => prev.filter(d => d._id !== dietId));
    Alert.alert('Error', 'Failed to update');
  }
};
```

### 4. DELETE Request with Optimistic Removal

```javascript
// Delete with optimistic UI
const deleteSchedule = async (scheduleId) => {
  // Remove from UI immediately
  setSchedules(prev => prev.filter(s => s._id !== scheduleId));
  
  try {
    await OfflineApiService.delete(
      `/workout-schedules/${scheduleId}`,
      {
        optimistic: true,
        invalidateCache: ['GET_/workout-schedules']
      }
    );
  } catch (error) {
    // Revert on error
    loadSchedules(); // Reload from cache/server
    Alert.alert('Error', 'Failed to delete');
  }
};
```

---

## 🎣 Using the Hook

### Basic Usage

```javascript
import { useOffline } from '../hooks/useOffline';

function MyComponent() {
  const { isOnline, pendingCount, sync } = useOffline();
  
  return (
    <View>
      <Text>Status: {isOnline ? 'Online' : 'Offline'}</Text>
      {pendingCount > 0 && (
        <TouchableOpacity onPress={sync}>
          <Text>Sync {pendingCount} pending changes</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
```

### Cached Data Hook

```javascript
import { useCachedData } from '../hooks/useOffline';

function MyComponent() {
  const { data, loading, error, fromCache, refresh } = useCachedData(
    () => OfflineApiService.get('/users'),
    [], // dependencies
    { ttl: 3600000 } // options
  );
  
  return (
    <View>
      {loading && <LoadingGif />}
      {fromCache && <Text>📦 Cached data</Text>}
      {data && <UserList users={data.users} />}
      <TouchableOpacity onPress={refresh}>
        <Text>Refresh</Text>
      </TouchableOpacity>
    </View>
  );
}
```

---

## 🎨 Adding Offline Indicator

### In Root Layout

```javascript
import OfflineIndicator from './components/OfflineIndicator';

export default function RootLayout() {
  return (
    <>
      <Stack>
        {/* Your screens */}
      </Stack>
      <OfflineIndicator />
    </>
  );
}
```

---

## 🔄 Migration Guide

### Step 1: Replace Direct API Calls

**Before:**
```javascript
const response = await ApiService.getUserWorkoutSchedules(userId);
```

**After:**
```javascript
const response = await OfflineApiService.get(
  `/workout-schedules/user/${userId}`,
  { cache: true, ttl: 3600000 }
);
```

### Step 2: Add Optimistic Updates

**Before:**
```javascript
const response = await ApiService.createWorkoutSchedule(data);
if (response.success) {
  setSchedules([...schedules, response.workoutSchedule]);
}
```

**After:**
```javascript
// Add optimistically
const tempId = `temp_${Date.now()}`;
setSchedules([...schedules, { ...data, _id: tempId, _optimistic: true }]);

try {
  const response = await OfflineApiService.post(
    '/workout-schedules',
    data,
    { optimistic: true, invalidateCache: ['GET_/workout-schedules'] }
  );
  
  // Replace temp with real data
  if (!response._queued) {
    setSchedules(prev => prev.map(s => 
      s._id === tempId ? response.workoutSchedule : s
    ));
  }
} catch (error) {
  // Remove on error
  setSchedules(prev => prev.filter(s => s._id !== tempId));
}
```

---

## 🎯 Best Practices

### 1. Cache Strategy
- **Short TTL (5-15 min)**: Frequently changing data (dashboard stats)
- **Medium TTL (1 hour)**: Moderately changing data (user lists)
- **Long TTL (24 hours)**: Rarely changing data (exercises, foods)

### 2. Optimistic Updates
- Always show immediate feedback
- Revert on error
- Show visual indicator for pending changes

### 3. Cache Invalidation
- Invalidate related caches on mutations
- Clear cache on logout
- Provide manual refresh option

### 4. Error Handling
- Show clear offline messages
- Queue mutations automatically
- Provide retry mechanism

---

## 🧪 Testing Offline Mode

### Simulate Offline
```javascript
// In development
import NetInfo from '@react-native-community/netinfo';

// Force offline
NetInfo.configure({
  reachabilityUrl: 'https://invalid-url.com',
  reachabilityTest: async () => false,
});
```

### Test Scenarios
1. ✅ Load data while offline (should use cache)
2. ✅ Create item while offline (should queue)
3. ✅ Update item while offline (should queue)
4. ✅ Delete item while offline (should queue)
5. ✅ Come back online (should auto-sync)
6. ✅ Manual sync button (should sync pending)

---

## 📊 Monitoring

### Check Pending Mutations
```javascript
const count = await OfflineApiService.getPendingCount();
console.log(`${count} pending mutations`);
```

### Manual Sync
```javascript
await OfflineApiService.sync();
```

### Clear Cache
```javascript
// Clear specific cache
await OfflineApiService.clearCache('GET_/users');

// Clear all caches
await OfflineManager.clearAllCaches();
```

---

## 🐛 Troubleshooting

### Cache Not Working
- Check AsyncStorage permissions
- Verify cache key format
- Check TTL expiration

### Mutations Not Syncing
- Verify network status
- Check mutation queue
- Review error logs

### Optimistic Updates Not Reverting
- Ensure proper error handling
- Check state management
- Verify revert logic

---

## 🚀 Performance Tips

1. **Batch Operations**: Group related mutations
2. **Debounce Sync**: Avoid excessive sync attempts
3. **Lazy Loading**: Load cached data first, refresh in background
4. **Compression**: Compress large cached data
5. **Cleanup**: Periodically clear old caches

---

## 📝 Example: Complete Implementation

```javascript
import React, { useState, useEffect } from 'react';
import { View, FlatList, TouchableOpacity, Text, Alert } from 'react-native';
import OfflineApiService from '../services/OfflineApiService';
import { useOffline } from '../hooks/useOffline';

export default function WorkoutList({ userId }) {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isOnline, pendingCount } = useOffline();

  useEffect(() => {
    loadWorkouts();
  }, [userId]);

  const loadWorkouts = async () => {
    try {
      setLoading(true);
      const response = await OfflineApiService.get(
        `/workout-schedules/user/${userId}`,
        { cache: true, ttl: 3600000 }
      );
      setWorkouts(response.workoutSchedules || []);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkout = async (workoutId) => {
    // Optimistic removal
    setWorkouts(prev => prev.filter(w => w._id !== workoutId));

    try {
      await OfflineApiService.delete(
        `/workout-schedules/${workoutId}`,
        {
          optimistic: true,
          invalidateCache: [`GET_/workout-schedules/user/${userId}`]
        }
      );
    } catch (error) {
      // Revert on error
      loadWorkouts();
      Alert.alert('Error', 'Failed to delete');
    }
  };

  return (
    <View>
      {!isOnline && (
        <Text style={{ color: 'orange' }}>
          📡 Offline Mode - {pendingCount} pending changes
        </Text>
      )}
      
      <FlatList
        data={workouts}
        renderItem={({ item }) => (
          <View>
            <Text>{item.name}</Text>
            {item._optimistic && <Text>⏳ Syncing...</Text>}
            <TouchableOpacity onPress={() => deleteWorkout(item._id)}>
              <Text>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        refreshing={loading}
        onRefresh={loadWorkouts}
      />
    </View>
  );
}
```

---

## ✅ Checklist

- [ ] Install dependencies
- [ ] Add OfflineIndicator to root layout
- [ ] Replace API calls with OfflineApiService
- [ ] Implement optimistic updates
- [ ] Add cache invalidation
- [ ] Test offline scenarios
- [ ] Add error handling
- [ ] Monitor pending mutations
- [ ] Document cache strategy

---

## 🎉 Benefits

1. ✅ **Works Offline** - App functional without internet
2. ✅ **Instant Feedback** - Optimistic UI updates
3. ✅ **Auto Sync** - Automatic sync when online
4. ✅ **Reduced Load** - Cached data reduces server load
5. ✅ **Better UX** - No waiting for network requests
6. ✅ **Resilient** - Handles network failures gracefully

---

## 📚 Additional Resources

- [AsyncStorage Docs](https://react-native-async-storage.github.io/async-storage/)
- [NetInfo Docs](https://github.com/react-native-netinfo/react-native-netinfo)
- [Offline-First Architecture](https://offlinefirst.org/)

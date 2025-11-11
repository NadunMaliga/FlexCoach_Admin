# Optimistic Updates Examples

## Overview
Examples of implementing optimistic UI updates with OfflineApiService.

---

## 1. Delete with Optimistic Removal

```javascript
const deleteItem = async (itemId) => {
  // Store original state for rollback
  const originalItems = items;
  
  // Optimistic update - remove immediately
  setItems(prev => prev.filter(item => item._id !== itemId));
  
  try {
    await OfflineApiService.delete(`/items/${itemId}`, {
      optimistic: true,
      invalidateCache: ['GET_/items']
    });
    
    Alert.alert('Success', 'Item deleted');
  } catch (error) {
    // Rollback on error
    setItems(originalItems);
    Alert.alert('Error', 'Failed to delete item');
  }
};
```

## 2. Create with Optimistic Addition

```javascript
const createItem = async (itemData) => {
  // Generate temporary ID
  const tempId = `temp_${Date.now()}`;
  const optimisticItem = {
    ...itemData,
    _id: tempId,
    _optimistic: true
  };
  
  // Optimistic update - add immediately
  setItems(prev => [...prev, optimisticItem]);
  
  try {
    const response = await OfflineApiService.post('/items', itemData, {
      optimistic: true,
      invalidateCache: ['GET_/items']
    });
    
    if (!response._queued) {
      // Replace temp item with real item
      setItems(prev => prev.map(item => 
        item._id === tempId ? response.item : item
      ));
    }
    
    Alert.alert('Success', 'Item created');
  } catch (error) {
    // Remove temp item on error
    setItems(prev => prev.filter(item => item._id !== tempId));
    Alert.alert('Error', 'Failed to create item');
  }
};
```

## 3. Update with Optimistic Changes

```javascript
const updateItem = async (itemId, updates) => {
  // Store original for rollback
  const originalItems = items;
  
  // Optimistic update - apply changes immediately
  setItems(prev => prev.map(item => 
    item._id === itemId 
      ? { ...item, ...updates, _optimistic: true }
      : item
  ));
  
  try {
    const response = await OfflineApiService.put(`/items/${itemId}`, updates, {
      optimistic: true,
      invalidateCache: [`GET_/items/${itemId}`, 'GET_/items']
    });
    
    if (!response._queued) {
      // Remove optimistic flag
      setItems(prev => prev.map(item => 
        item._id === itemId 
          ? { ...item, _optimistic: false }
          : item
      ));
    }
    
    Alert.alert('Success', 'Item updated');
  } catch (error) {
    // Rollback on error
    setItems(originalItems);
    Alert.alert('Error', 'Failed to update item');
  }
};
```

## 4. Visual Indicators for Optimistic Updates

```javascript
function ItemCard({ item, onDelete, onUpdate }) {
  return (
    <View style={[
      styles.card,
      item._optimistic && styles.optimisticCard
    ]}>
      <Text style={styles.title}>{item.name}</Text>
      
      {item._optimistic && (
        <View style={styles.optimisticIndicator}>
          <ActivityIndicator size="small" color="#d5ff5f" />
          <Text style={styles.optimisticText}>Syncing...</Text>
        </View>
      )}
      
      <TouchableOpacity 
        onPress={() => onDelete(item._id)}
        disabled={item._optimistic}
        style={[
          styles.deleteButton,
          item._optimistic && styles.disabledButton
        ]}
      >
        <Text>Delete</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  optimisticCard: {
    opacity: 0.7,
    borderColor: '#d5ff5f',
    borderWidth: 1,
  },
  optimisticIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  optimisticText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#d5ff5f',
    fontStyle: 'italic',
  },
  disabledButton: {
    opacity: 0.5,
  },
});
```

## 5. Real Example from ExercisePlan.jsx

```javascript
const deleteWorkout = async (workoutId) => {
  // Store original state for rollback
  const originalWorkouts = workouts;
  
  // Optimistic update - remove immediately from UI
  setWorkouts(prev => prev.filter(w => w._id !== workoutId));
  
  try {
    await OfflineApiService.delete(`/workout-schedules/${workoutId}`, {
      optimistic: true,
      invalidateCache: ['GET_/workout-schedules']
    });
    
    Alert.alert('Success', 'Workout deleted successfully');
  } catch (error) {
    // Rollback on error
    setWorkouts(originalWorkouts);
    Alert.alert('Error', 'Failed to delete workout');
  }
};
```

---

## Best Practices

1. **Always store original state** for rollback
2. **Use visual indicators** for pending operations
3. **Disable actions** on optimistic items
4. **Provide clear feedback** to users
5. **Test offline scenarios** thoroughly

---

## Common Patterns

### Loading States
```javascript
const [isCreating, setIsCreating] = useState(false);

const createItem = async (data) => {
  setIsCreating(true);
  // ... optimistic update logic
  setIsCreating(false);
};
```

### Error Boundaries
```javascript
const handleOptimisticError = (error, rollback) => {
  rollback();
  if (error.message.includes('offline')) {
    Alert.alert('Offline', 'Changes will sync when online');
  } else {
    Alert.alert('Error', error.message);
  }
};
```

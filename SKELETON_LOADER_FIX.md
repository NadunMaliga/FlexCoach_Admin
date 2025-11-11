# Skeleton Loader Flash Fix

## Issue
When navigating to ExercisePlan or DietPlan with preloaded data, there was a brief flash of the skeleton loader before showing the actual data.

## Root Cause
The preloaded data was being parsed as a local variable on every render, causing:
1. Initial render with `loading = true` (because the variable wasn't set yet)
2. Skeleton loader displays
3. useEffect runs and sets `loading = false`
4. Data displays

This created a brief "blink" of the skeleton loader even though we had the data ready.

## Solution

### 1. Use `useMemo` for Preloaded Data
Memoize the parsed preloaded data so it's calculated once and stable across renders:

```javascript
const preloadedData = useMemo(() => {
    if (preloadedDataParam) {
        try {
            return JSON.parse(preloadedDataParam);
        } catch (e) {
            return null;
        }
    }
    return null;
}, [preloadedDataParam]);
```

### 2. Initialize Loading State Correctly
Set the initial loading state based on whether preloaded data exists:

```javascript
const [loading, setLoading] = useState(!preloadedData);
const [schedules, setSchedules] = useState(preloadedData || []);
```

### 3. Skip API Call When Preloaded
In useEffect, return early if preloaded data exists:

```javascript
useEffect(() => {
    if (preloadedData && preloadedData.length > 0) {
        Logger.log('✅ Preloaded data ready - skipping API call');
        return; // Skip loading
    }
    
    // Only load if no preloaded data
    if (userId) {
        loadData();
    }
}, [userId, preloadedData]);
```

## Result

- **Before**: Brief flash of skeleton loader → data appears
- **After**: Data appears instantly, no skeleton loader flash

The page now renders with the correct state from the very first render when preloaded data is available.

## Files Changed

1. `FlexCoach_Admin/app/(protected)/ExercisePlan.jsx`
   - Added `useMemo` import
   - Memoized preloaded data parsing
   - Updated useEffect to skip loading when preloaded data exists

2. `FlexCoach_Admin/app/(protected)/DietPlan.jsx`
   - Added `useMemo` import
   - Memoized preloaded data parsing
   - Updated useFocusEffect to skip loading when preloaded data exists

## Testing

To verify the fix:
1. Open a client profile
2. Wait 1-2 seconds for preloading to complete
3. Click "Exercise" tab
4. Should see data instantly with NO skeleton loader flash
5. Go back, click "Diet Plan" tab
6. Should see data instantly with NO skeleton loader flash

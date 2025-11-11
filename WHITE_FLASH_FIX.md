# White Flash Fix - Android Navigation

## Problem
White flash appearing when navigating back from ClientProfile to Clients tab on Android.

## Root Cause
Android's default window background is white. During screen transitions, the default background briefly shows before the component renders.

## Solution Applied

### 1. Stack Navigation Background
Added `contentStyle: { backgroundColor: '#000' }` to both layout files:
- `app/_layout.tsx` - Main app layout
- `app/(protected)/_layout.tsx` - Protected routes layout

### 2. Navigation Animation
Changed animation type to `'fade'` in protected layout for smoother transitions without the white flash.

### 3. Android App Configuration
Added `backgroundColor: "#000000"` to `app.json` Android configuration to set the native window background.

## Changes Made

**app/(protected)/_layout.tsx:**
```typescript
screenOptions={{ 
  headerShown: true,
  headerStyle: { backgroundColor: '#000' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '600', fontSize: 18 },
  headerRight: () => <SettingsButton />,
  contentStyle: { backgroundColor: '#000' },  // ✅ Added
  animation: 'fade',                          // ✅ Added
}}
```

**app/_layout.tsx:**
```typescript
screenOptions={{ 
  headerShown: true,
  headerStyle: { backgroundColor: '#000' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '600', fontSize: 18 },
  contentStyle: { backgroundColor: '#000' },  // ✅ Added
}}
```

**app.json:**
```json
"android": {
  "backgroundColor": "#000000",  // ✅ Added
  // ... other config
}
```

## Result
- No more white flash during navigation transitions
- Smooth fade animation between screens
- Consistent black background throughout the app
- Better user experience on Android devices

## Testing
Test by navigating:
1. Dashboard → Clients tab
2. Clients → ClientProfile
3. ClientProfile → Back to Clients
4. Verify no white flash appears during transitions

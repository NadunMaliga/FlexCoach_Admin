# Logging Guide - FlexCoach Admin

**How to View and Use Logs in Development**

---

## Overview

The FlexCoach Admin app uses a custom Logger utility that:
- ✅ Shows logs **ONLY in development mode** (`__DEV__ === true`)
- ✅ Hides all logs **in production** (secure)
- ✅ Provides emoji prefixes for easy identification
- ✅ Supports different log levels (info, warn, error, success)

---

## How to See Logs

### Method 1: Expo Development Console (Recommended)

```bash
cd FlexCoach_Admin
expo start
```

**You'll see logs in:**
1. **Terminal** - Where you ran `expo start`
2. **Expo DevTools** - Opens in browser automatically
3. **React Native Debugger** - If installed

**Example Output:**
```
ℹ️ Chat Service initialized
✅ Token operation completed
📦 Using cached photos
✅ Cached 45 messages securely
```

### Method 2: React Native Debugger (Advanced)

1. **Install React Native Debugger:**
   ```bash
   # macOS
   brew install --cask react-native-debugger
   
   # Or download from:
   # https://github.com/jhen0409/react-native-debugger/releases
   ```

2. **Start the app:**
   ```bash
   cd FlexCoach_Admin
   expo start
   ```

3. **Open debugger:**
   - Press `j` in terminal to open debugger
   - Or manually open React Native Debugger app
   - Set port to `19000` (or your Expo port)

4. **View logs:**
   - Console tab shows all Logger output
   - Network tab shows API requests
   - Redux tab (if using Redux)

### Method 3: Physical Device Logs

#### Android (via ADB)
```bash
# Connect device via USB
# Enable USB debugging in Developer Options

# View all logs
adb logcat

# Filter for React Native logs
adb logcat | grep ReactNativeJS

# Filter for specific tags
adb logcat | grep "Chat\|Token\|Cache"

# Clear logs first
adb logcat -c && adb logcat | grep ReactNativeJS
```

#### iOS (via Console.app)
```bash
# On Mac, open Console.app
# Connect iPhone via USB
# Select your device in sidebar
# Filter by "FlexCoach" or "React"

# Or use command line:
idevicesyslog | grep "FlexCoach"
```

### Method 4: Expo Go App Logs

If using Expo Go app on phone:

1. **Shake device** to open developer menu
2. **Tap "Show Performance Monitor"** - Shows FPS and memory
3. **Tap "Debug Remote JS"** - Opens Chrome debugger
4. **Open Chrome DevTools** - Press F12
5. **View Console tab** - All logs appear here

---

## Logger API Reference

### Import Logger
```javascript
import Logger from '../utils/logger';
```

### Basic Logging

#### Logger.log()
General information logging
```javascript
Logger.log('User logged in');
Logger.log('API response:', responseData);
```

#### Logger.info()
Information with ℹ️ emoji
```javascript
Logger.info('Connecting to chat server');
Logger.info('Cache hit:', cacheKey);
```

#### Logger.success()
Success messages with ✅ emoji
```javascript
Logger.success('Login successful');
Logger.success('Photos loaded:', photoCount);
```

#### Logger.warn()
Warnings with ⚠️ emoji
```javascript
Logger.warn('Cache expired');
Logger.warn('Failed to load cached messages');
```

#### Logger.error()
Errors with ❌ emoji
```javascript
Logger.error('API request failed', error);
Logger.error('Authentication error');
```

#### Logger.debug()
Debug information (verbose)
```javascript
Logger.debug('Request config:', config);
Logger.debug('State update:', newState);
```

---

## Log Examples in the App

### Chat Service Logs
```javascript
// When chat service initializes
ℹ️ Chat Service initialized

// When connecting
✅ Chat server connected

// When caching messages
✅ Cached 45 messages securely

// When loading cache
📦 Loaded 45 cached messages

// When polling for messages
✅ Received 3 new messages
```

### API Service Logs
```javascript
// API requests
ℹ️ API Request: GET /api/admin/users
✅ API Success: /api/admin/users

// Errors
❌ API Failed: /api/admin/users
```

### Cache Logs
```javascript
// Cache operations
💾 Photos cached successfully
📦 Using cached photos
🗑️ Cache removed: messages_123
```

### Authentication Logs
```javascript
// Login flow
✅ Login successful
✅ Token is valid, user authenticated
❌ Token invalid, removing stored token
```

---

## Viewing Logs by Feature

### 1. Chat Logs
```bash
# In terminal, filter for chat-related logs
expo start | grep -i "chat\|message"
```

**What you'll see:**
- Chat service initialization
- Message sending/receiving
- Cache operations
- Connection status

### 2. Authentication Logs
```bash
expo start | grep -i "auth\|token\|login"
```

**What you'll see:**
- Login attempts
- Token validation
- Session management
- Logout operations

### 3. API Logs
```bash
expo start | grep -i "api\|request"
```

**What you'll see:**
- API requests
- Response status
- Error messages
- Request timing

### 4. Cache Logs
```bash
expo start | grep -i "cache\|cached"
```

**What you'll see:**
- Cache hits/misses
- Cache storage
- Cache expiration
- Cache clearing

---

## Production vs Development

### Development Mode (`__DEV__ === true`)
```javascript
Logger.log('Debug info');
// Output: "Debug info"

Logger.success('Operation complete');
// Output: "✅ Operation complete"

Logger.error('Error occurred', error);
// Output: "❌ Error occurred" + error details
```

### Production Mode (`__DEV__ === false`)
```javascript
Logger.log('Debug info');
// Output: NOTHING (silent)

Logger.success('Operation complete');
// Output: NOTHING (silent)

Logger.error('Error occurred', error);
// Output: NOTHING in console
// TODO: Sent to error tracking service (Sentry)
```

---

## Debugging Tips

### 1. Enable Verbose Logging
Add more Logger calls temporarily:
```javascript
Logger.debug('Function called with:', params);
Logger.debug('State before:', state);
// ... your code ...
Logger.debug('State after:', newState);
```

### 2. Use Emoji for Quick Scanning
```javascript
Logger.log('🔍 Searching for user:', userId);
Logger.log('📡 Fetching data from API');
Logger.log('💾 Saving to cache');
Logger.log('🎉 Operation complete!');
```

### 3. Log Object Structure
```javascript
Logger.log('User object:', JSON.stringify(user, null, 2));
```

### 4. Conditional Logging
```javascript
if (someCondition) {
  Logger.warn('Condition met:', someValue);
}
```

### 5. Performance Logging
```javascript
const start = Date.now();
// ... operation ...
Logger.log(`Operation took ${Date.now() - start}ms`);
```

---

## Common Log Patterns

### API Request Pattern
```javascript
Logger.info(`API Request: ${method} ${url}`);
try {
  const response = await fetch(url, options);
  Logger.success(`API Success: ${url}`);
  return response;
} catch (error) {
  Logger.error(`API Failed: ${url}`, error);
  throw error;
}
```

### Cache Pattern
```javascript
Logger.log('Checking cache:', key);
const cached = await getCache(key);
if (cached) {
  Logger.success('Cache hit:', key);
  return cached;
} else {
  Logger.warn('Cache miss:', key);
  return await fetchFresh();
}
```

### Authentication Pattern
```javascript
Logger.info('Attempting login');
try {
  const result = await login(credentials);
  Logger.success('Login successful');
  return result;
} catch (error) {
  Logger.error('Login failed', error);
  throw error;
}
```

---

## Troubleshooting

### "I don't see any logs"

**Check:**
1. Are you in development mode?
   ```bash
   expo start
   # NOT: expo start --no-dev
   ```

2. Is `__DEV__` true?
   ```javascript
   Logger.log('DEV mode:', __DEV__);
   // Should show: "DEV mode: true"
   ```

3. Are you looking in the right place?
   - Terminal where you ran `expo start`
   - Expo DevTools in browser
   - React Native Debugger (if open)

### "Logs are too verbose"

**Filter logs:**
```bash
# Terminal
expo start | grep "ERROR\|WARN"

# Or use Logger levels appropriately
Logger.debug('Verbose info');  // Use sparingly
Logger.log('Normal info');     // Use for important info
Logger.error('Critical error'); // Always important
```

### "Need to see production logs"

**Production logging is disabled for security.**

For production debugging:
1. Use error tracking service (Sentry, Bugsnag)
2. Implement remote logging
3. Use analytics events
4. Check backend logs

---

## Best Practices

### ✅ DO:
- Use Logger instead of console.log
- Use appropriate log levels
- Add context to log messages
- Remove verbose debug logs before commit
- Use emoji for visual scanning

### ❌ DON'T:
- Log sensitive data (tokens, passwords)
- Log user personal information
- Use console.log directly
- Leave debug logs in production code
- Log inside loops (performance)

---

## Quick Reference

```javascript
import Logger from '../utils/logger';

// Basic
Logger.log('message');
Logger.log('message', data);

// With emoji
Logger.info('ℹ️ message');
Logger.success('✅ message');
Logger.warn('⚠️ message');
Logger.error('❌ message');
Logger.failure('❌ message', error);

// Debug
Logger.debug('verbose message');
```

---

## Example: Viewing Chat Logs

1. **Start the app:**
   ```bash
   cd FlexCoach_Admin
   expo start
   ```

2. **Open the app** on device/simulator

3. **Navigate to Chat** screen

4. **Watch terminal** for logs:
   ```
   ℹ️ Chat Service initialized
   ℹ️ Connecting to chat server
   ✅ Chat server connected
   ✅ Message polling started
   📦 Loaded 45 cached messages
   ✅ Received 3 new messages
   ✅ Message sent
   ```

5. **Filter for specific logs:**
   ```bash
   # In another terminal
   tail -f <expo-log-file> | grep "Chat\|Message"
   ```

---

## Summary

**To see logs:**
1. Run `expo start` (development mode)
2. Look at terminal output
3. Or open React Native Debugger
4. Or use device logs (adb/idevicesyslog)

**Logs show:**
- ✅ Only in development mode
- ❌ Hidden in production (secure)
- 🎯 With emoji for easy scanning
- 📊 Different levels (info, warn, error)

**Remember:**
- Production = No logs (secure)
- Development = All logs visible
- Use Logger, not console.log
- Don't log sensitive data

---

**Need help?** Check the logs! They'll tell you what's happening. 🔍

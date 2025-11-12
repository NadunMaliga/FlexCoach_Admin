// @ts-nocheck
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineIndicator from './components/OfflineIndicator';
import AlertProvider from './components/AlertProvider';
import BackgroundSyncManager from './services/BackgroundSyncManager';

export default function RootLayout() {
  useEffect(() => {
    // Initialize background sync and notifications
    BackgroundSyncManager.initialize();

    // Set status bar style for Android
    StatusBar.setBarStyle('light-content');
    StatusBar.setBackgroundColor('#000000');
  }, []);

  return (
    <ErrorBoundary>
      <AlertProvider>
        <AuthProvider>
          <Stack screenOptions={{
            headerShown: true,
            headerStyle: { backgroundColor: '#000' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: '600', fontSize: 18 },
            headerStatusBarHeight: 0,
            contentStyle: { backgroundColor: '#000' },
          }}>
            <Stack.Screen
              name="index"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="signin"
              options={{
                title: 'Sign In',
                headerShown: false
              }}
            />
            <Stack.Screen
              name="verify"
              options={{
                title: 'Verify Account',
                headerShown: false
              }}
            />
            <Stack.Screen
              name="Alert"
              options={{
                title: 'Alerts'
              }}
            />
            <Stack.Screen
              name="SplashScreen"
              options={{
                headerShown: false
              }}
            />

            <Stack.Screen
              name="(protected)"
              options={{ headerShown: false }}
            />
          </Stack>
          <OfflineIndicator />
        </AuthProvider>
      </AlertProvider>
    </ErrorBoundary>
  );
}
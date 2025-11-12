import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity, StatusBar } from 'react-native';
import React, { useEffect } from 'react';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { showConfirm } from '../utils/customAlert';

export default function ProtectedLayout() {
  const router = useRouter();
  const { logout } = useAuth();

  useEffect(() => {
    // Set status bar to match header
    StatusBar.setBarStyle('light-content');
    StatusBar.setBackgroundColor('#000000');
  }, []);

  const handleLogout = () => {
    showConfirm(
      'Logout',
      'Are you sure you want to logout?',
      'Logout',
      'Cancel',
      async () => {
        await logout();
        router.replace('/signin');
      },
      () => {
      }
    );
  };

  const SettingsButton = () => (
    <TouchableOpacity
      onPress={handleLogout}
      style={{ marginRight: 15 }}
      accessibilityRole="button"
      accessibilityLabel="Settings and logout"
      accessibilityHint="Opens settings menu with logout option"
    >
      <Feather name="log-out" size={22} color="#9c9c9cff" />
    </TouchableOpacity>
  );

  return (
    <Stack screenOptions={{
      headerShown: true,
      headerStyle: {
        backgroundColor: '#000',
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
      },
      headerShadowVisible: false,
      headerTintColor: '#fff',
      headerTitleAlign: 'center',
      headerTitleStyle: { fontWeight: '600', fontSize: 18, fontFamily: 'Poppins_300Light' },
      headerRight: () => <SettingsButton />,
      contentStyle: { backgroundColor: '#000', paddingTop: 0 },
      animation: 'fade',
      headerStatusBarHeight: 0,
    }}>
      <Stack.Screen
        name="Home"
        options={{
          title: 'Dashboard',
          headerShown: true
        }}
      />
      <Stack.Screen
        name="Dashboard"
        options={{
          title: 'Dashboard',
          headerShown: false // Dashboard is part of Home tabs
        }}
      />
      <Stack.Screen
        name="Clients"
        options={{
          title: 'Clients',
          headerShown: false // Clients is part of Home tabs
        }}
      />
      <Stack.Screen
        name="Exercise"
        options={{
          title: 'Exercises',
          headerShown: false // Exercise is part of Home tabs
        }}
      />
      <Stack.Screen
        name="ScheduleDetails"
        options={{
          title: 'ScheduleDetails',
          headerShown: false // Exercise is part of Home tabs
        }}
      />
      <Stack.Screen
        name="Foods"
        options={{
          title: 'Foods',
          headerShown: false // Foods is part of Home tabs
        }}
      />
      <Stack.Screen
        name="ClientProfile"
        options={{
          title: 'Client Profile'
        }}
      />
      <Stack.Screen
        name="DietPlan"
        options={{
          title: 'Diet Plan'
        }}
      />
      <Stack.Screen
        name="DietHistory"
        options={{
          title: 'Diet History'
        }}
      />
      <Stack.Screen
        name="ExercisePlan"
        options={{
          title: 'Exercise Plan'
        }}
      />
      <Stack.Screen
        name="AddSchedule"
        options={{
          title: 'Add Schedule',
          headerShown: false
        }}
      />
      <Stack.Screen
        name="ProfileSchedules"
        options={{
          title: 'Schedule Details'
        }}
      />
      <Stack.Screen
        name="AddDiet"
        options={{
          title: 'Add Diet'
        }}
      />

      <Stack.Screen
        name="MeasurementHistory"
        options={{
          title: 'Measurement History'
        }}
      />
      <Stack.Screen
        name="Chat"
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen
        name="ClientBodyImage"
        options={{
          title: 'Body Images'
        }}
      />
    </Stack>
  );
}
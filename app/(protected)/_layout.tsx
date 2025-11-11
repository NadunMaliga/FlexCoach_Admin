import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity, Platform, StatusBar } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { showConfirm } from '../utils/customAlert';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProtectedLayout() {
  const router = useRouter();
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();

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
        // Cancel - do nothing
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
      <Feather name="log-out" size={22} color="#d5ff5f" />
    </TouchableOpacity>
  );

  return (
    <Stack screenOptions={{
      headerShown: true,
      headerStyle: { 
        backgroundColor: '#000',
      },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: '600', fontSize: 18 },
      headerRight: () => <SettingsButton />,
      contentStyle: { backgroundColor: '#000', paddingTop: 0 },
      animation: 'fade',
      headerStatusBarHeight: Platform.OS === 'android' ? StatusBar.currentHeight : insets.top,
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
          headerShown: false // Hide default header, using custom header in component
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
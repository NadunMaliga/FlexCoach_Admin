import { Stack } from 'expo-router';

export default function ProtectedLayout() {
  return (
    <Stack screenOptions={{ 
      headerShown: true,
      headerStyle: { backgroundColor: '#000' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: '600', fontSize: 18 },
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
          title: 'Add Schedule'
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
    </Stack>
  );
}
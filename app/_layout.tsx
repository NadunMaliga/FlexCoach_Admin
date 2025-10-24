import { Stack } from 'expo-router';
import { AuthProvider } from './contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ 
        headerShown: true,
        headerStyle: { backgroundColor: '#000' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600', fontSize: 18 },
      }}>
        <Stack.Screen 
          name="index" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="signin" 
          options={{ 
            title: 'Sign In',
            headerShown: true 
          }} 
        />
        <Stack.Screen 
          name="verify" 
          options={{ 
            title: 'Verify Account',
            headerShown: true 
          }} 
        />
        <Stack.Screen 
          name="Chat" 
          options={{ 
            title: 'Chat'
          }} 
        />

        <Stack.Screen 
          name="ClientBodyImage" 
          options={{ 
            title: 'Body Images'
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
    </AuthProvider>
  );
}
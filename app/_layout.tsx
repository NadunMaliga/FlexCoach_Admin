import { Stack, SplashScreen } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import CustomSplashScreen from "./SplashScreen";

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [showCustomSplash, setShowCustomSplash] = useState(true);

  useEffect(() => {
    async function prepare() {
      try {
        // Hide expo's default splash screen immediately
        await SplashScreen.hideAsync();
        
        // Set ready state
        setIsReady(true);
        
        // Hide custom splash after 2.5 seconds
        setTimeout(() => {
          setShowCustomSplash(false);
        }, 2500);
      } catch (e) {
        console.warn(e);
      }
    }

    prepare();
  }, []);

  if (!isReady || showCustomSplash) {
    return <CustomSplashScreen />;
  }

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ headerShown: false }}
      />
      
      <Stack.Screen
        name="signup"
        options={{
          headerTitle: "",
          headerStyle: { backgroundColor: "black" },
          headerTintColor: "white",
        }}
      />
      
      <Stack.Screen
        name="signin"
        options={{
          headerTitle: "",
          headerStyle: { backgroundColor: "black" },
          headerTintColor: "white",
        }}
      />

       <Stack.Screen
        name="verify"
        options={{
          headerTitle: "",
          headerStyle: { backgroundColor: "black" },
          headerTintColor: "white",
        }}
      />
      
      <Stack.Screen
        name="bodyMeasurement"
        options={{
          headerTitle: "",
          headerStyle: { backgroundColor: "black" },
          headerTintColor: "white",
        }}
      />
    </Stack>
  );
}

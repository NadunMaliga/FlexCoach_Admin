import { Stack, SplashScreen } from "expo-router";
import { useEffect, useState } from "react";
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
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "black" },
        headerTintColor: "white",
        headerTitleStyle: { color: "white" },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Chat"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddSchedule"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddDiet"
        options={{ headerShown: false }}
      />

      <Stack.Screen name="signin" options={{ headerTitle: "" }} />
      <Stack.Screen name="verify" options={{ headerTitle: "" }} />
      <Stack.Screen name="ClientProfile" />
      <Stack.Screen name="DietPlan" />
      <Stack.Screen name="ExercisePlan" />
    </Stack>
  );
}

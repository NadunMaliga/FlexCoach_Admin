// @ts-nocheck
import { Poppins_300Light, useFonts } from '@expo-google-fonts/poppins';
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from './contexts/AuthContext';
import CustomSplashScreen from './SplashScreen';


export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  let [fontsLoaded] = useFonts({
    Poppins_300Light,
  });

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // User is already authenticated, redirect to dashboard
      router.replace('/(protected)/Dashboard');
    }
  }, [isAuthenticated, isLoading]);

  if (!fontsLoaded || isLoading) {
    return <CustomSplashScreen />;
  }

  // Don't show the welcome screen if user is authenticated
  if (isAuthenticated) {
    return null;
  }

  return (
    <ImageBackground
      source={require('../assets/images/homeimage.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <View style={styles.headingContainer}>
          <Text style={styles.heading}>
            YOUR FITNESS{"\n"}STARTS{"\n"}HERE{"\n"}

          </Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/signin")}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%' },
  container: { padding: 20, flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0, 0, 0, 0.1)" },
  button: { backgroundColor: "#d5ff5f", paddingVertical: 17, borderRadius: 30, marginBottom: 12, marginTop: 100, alignItems: "center", justifyContent: "center" },
  buttonText: { fontSize: 18, color: "#000000ff", fontFamily: "Poppins_300Light", textAlign: "center" },
  headingContainer: { flex: 1, justifyContent: 'center' },
  heading: { fontSize: 90, fontWeight: "bold", color: "white", lineHeight: 80 },
});

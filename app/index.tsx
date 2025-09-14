import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from "react-native";
import { useFonts, Poppins_300Light } from '@expo-google-fonts/poppins';
import { useRouter } from "expo-router";

export default function Index() {
  const router = useRouter();

  let [fontsLoaded] = useFonts({
    Poppins_300Light,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ImageBackground
      source={{ uri: 'https://i.postimg.cc/hP4YVBWX/White-and-Black-Minimalist-Phone-Mockup-Instagram-Story.png' }}
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
          onPress={() => router.push("/verify")}
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
  heading: { fontSize: 90, fontWeight: "bold", color: "white", lineHeight: 80 },

});

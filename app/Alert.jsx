// Alert.jsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import {
  useFonts,
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_600SemiBold,
} from "@expo-google-fonts/poppins";

export default function Alert({
  visible,
  title,
  message,
  buttonText,
  onClose,
}) {
  const [fontsLoaded] = useFonts({
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  if (!fontsLoaded) return null;

  return (
    <Modal transparent={true} visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>{buttonText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "#1C1C1E",
    borderRadius: 30,
    padding: 25,
    width: "85%",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    color: "#fff",
    marginBottom: 10,
    textAlign: "center",
    fontFamily: "Poppins_400Regular", // 🔹 bold header
  },
  message: {
    fontSize: 14,
    color: "#8e8d8dff",
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "Poppins_400Regular", // 🔹 normal message
  },
  button: {
    borderColor:"#545454ff",
    borderWidth:1,
    paddingVertical: 14,
    borderRadius: 50, // 🔹 pill shape
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#b3b3b3ff",
    fontSize: 16,
    fontFamily: "Poppins_400Regular", // 🔹 clean button text
  },
});

// @ts-nocheck
import {
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_600SemiBold,
  useFonts,
} from "@expo-google-fonts/poppins";
import Logger from './utils/logger';
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useAuth } from "./contexts/AuthContext";
import HapticFeedback from './utils/haptics';

export default function SignIn() {
  const router = useRouter();
  const { login } = useAuth();

  const [fontsLoaded] = useFonts({
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [secure, setSecure] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  if (!fontsLoaded) return null;

  const validate = (pwd: string) => {
    if (!pwd.trim()) {
      return "Password is required";
    } else if (pwd.length < 6) {
      return "Minimum 6 characters";
    }
    return null;
  };

  const onSignIn = async () => {
    // Check if password is empty and show error
    if (!password.trim()) {
      setError("Password is required");
      HapticFeedback.error();
      return;
    }

    const err = validate(password);
    setError(err);
    if (err) {
      HapticFeedback.error(); // Error haptic for validation failure
      return;
    }

    try {
      HapticFeedback.light(); // Light tap on button press
      setSubmitting(true);

      const success = await login(password);

      if (success) {
        HapticFeedback.success(); // Success haptic on login
        // Navigation will be handled automatically by AuthContext
        Logger.log('Login successful, will auto-redirect to Dashboard');
      } else {
        HapticFeedback.error(); // Error haptic for invalid password
        setError("Invalid password");
      }
    } catch (err) {
      HapticFeedback.error(); // Error haptic for login failure
      Logger.error("Login error:", err);
      setError("Invalid password");
    } finally {
      setSubmitting(false);
    }
  };

  const isDisabled = submitting;

  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={0}
    >
      <View style={styles.container}>
        <View style={{ height: statusBarHeight }} />
        <Text style={styles.header}>Verify You</Text>
        <Text style={styles.secondheader}>
          Enter the password given to you{"\n"} by the admin.
        </Text>
        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Password */}
          <View style={styles.inputWrapper}>
            <Icon name="lock" size={20} color="#dededeff" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#dededeff"
              secureTextEntry={secure}
              autoCapitalize="none"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                // Only validate if user has started typing
                if (t.trim()) {
                  setError(validate(t));
                } else {
                  setError(null);
                }
              }}
            />
            <TouchableOpacity onPress={() => setSecure((s) => !s)}>
              <Icon
                name={secure ? "eye-off" : "eye"}
                size={20}
                color="#dededeff"
              />
            </TouchableOpacity>
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </ScrollView>

        {/* Footer — Sign In */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.nextButton,]}
            onPress={onSignIn}
            disabled={isDisabled}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="black" />
            ) : (
              <Text style={styles.nextButtonText}>Next</Text>
            )}
          </TouchableOpacity>

          {/* Go to Sign Up (optional) */}
          <TouchableOpacity
            style={{ marginTop: 14, alignItems: "center" }}
            onPress={() => router.push("/signin")}
          >
            <Text style={{ color: "#757575ff", fontFamily: "Poppins_400Regular" }}>
              Already have an account? <Text style={{ color: "#d5ff5f" }}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  header: {
    fontSize: 31,
    fontFamily: "Poppins_600SemiBold",
    color: "white",
    textAlign: "center",
    marginTop: 50,
    marginBottom: 5,
  },
  secondheader: {
    textAlign: "center",
    marginBottom: 20,
    fontSize: 17,
    color: "#8f8f8fff",
    paddingHorizontal: 15,
    fontFamily: "Poppins_400Regular",
  },
  form: { paddingHorizontal: 20, paddingBottom: 100 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#292929ff",
    borderRadius: 13,
    paddingHorizontal: 15,
    marginBottom: 13,
  },
  icon: { marginRight: 10 },
  input: {
    flex: 1,
    color: "white",
    fontFamily: "Poppins_400Regular",
    fontSize: 17,
    paddingVertical: 15,
  },
  footer: {
    backgroundColor: "black",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#171717ff",
  },
  nextButton: {
    backgroundColor: "#d5ff5f",
    paddingVertical: 22,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  nextButtonText: {
    fontSize: 18,
    color: "black",
    fontFamily: "Poppins_300Light",
    textAlign: "center",
  },
  errorText: {
    color: "#ff8181ff",
    marginBottom: 10,
    marginLeft: 10,
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
  },
});

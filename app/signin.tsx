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
import apiService from "./services/api";
import { validateUserId, validateName, validateEmail, sanitizeString } from './utils/validators';
import HapticFeedback from './utils/haptics';

export default function SignIn() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const [secure, setSecure] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  if (!fontsLoaded) return null;

  const validate = (data = form) => {
    const e: typeof errors = {};
    if (!data.email.trim()) {
      e.email = "Email is required";
    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(data.email.trim())
    ) {
      e.email = "Email format is invalid";
    }

    if (!data.password.trim()) {
      e.password = "Password is required";
    } else if (data.password.length < 6) {
      e.password = "Minimum 6 characters";
    }
    return e;
  };

  const handleChange = (field: "email" | "password", value: string) => {
    const next = { ...form, [field]: value };
    setForm(next);
    setErrors(validate(next));
  };

  const onSignIn = async () => {
    // Validate and sanitize inputs
    try {
      const validatedEmail = validateEmail(form.email);
      const sanitizedPassword = sanitizeString(form.password);
    } catch (validationError) {
      setErrors((prev) => ({
        ...prev,
        email: validationError.message,
      }));
      return;
    }
    const e = validate(form);
    setErrors(e);
    if (Object.keys(e).length) {
      HapticFeedback.error(); // Error haptic for validation failure
      return;
    }

    try {
      HapticFeedback.light(); // Light tap on button press
      setSubmitting(true);

      // Call the backend API to authenticate
      const response = await apiService.login(form.password, form.email);

      if (response.success) {
        HapticFeedback.success(); // Success haptic on login
        // Login successful, navigate to verify/dashboard
        router.replace("/verify");
      } else {
        HapticFeedback.error(); // Error haptic for login failure
        // Login failed
        setErrors((prev) => ({
          ...prev,
          password: response.error || "Invalid email or password",
        }));
      }
    } catch (err) {
      HapticFeedback.error(); // Error haptic for error
      Logger.error('Login error:', err);
      setErrors((prev) => ({
        ...prev,
        password: "Invalid email or password",
      }));
    } finally {
      setSubmitting(false);
    }
  };

  const isDisabled =
    submitting || !!Object.keys(errors).length || !form.email || !form.password;

  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;

  return (
    <View style={styles.container}>
      <View style={{ height: statusBarHeight }} />
      <Text style={styles.header}>Admin Sign In</Text>
      <Text style={styles.secondheader}>Welcome back</Text>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Email */}
          <View style={styles.inputWrapper}>
            <Icon name="mail" size={20} color="#dededeff" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              accessibilityLabel="Email address"
              accessibilityHint="Enter your admin email address"
              placeholderTextColor="#dededeff"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              value={form.email}
              onChangeText={(t) => handleChange("email", t)}
            />
          </View>
          {errors.email ? (
            <Text style={styles.errorText}>{errors.email}</Text>
          ) : null}

          {/* Password */}
          <View style={styles.inputWrapper}>
            <Icon name="lock" size={20} color="#dededeff" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              accessibilityLabel="Password"
              accessibilityHint="Enter your admin password"
              placeholderTextColor="#dededeff"
              secureTextEntry={secure}
              autoCapitalize="none"
              value={form.password}
              onChangeText={(t) => handleChange("password", t)}
            />
            <TouchableOpacity onPress={() => setSecure((s) => !s)}>
              <Icon
                name={secure ? "eye-off" : "eye"}
                size={20}
                color="#dededeff"
              />
            </TouchableOpacity>
          </View>

          {/* error or helper text */}
          {errors.password ? (
            <Text style={styles.errorText}>{errors.password}</Text>
          ) : (
            <Text style={styles.helperText}>
              Enter the password and log in to the admin panel.
            </Text>
          )}

          {/* Forgot password (optional) */}
          <TouchableOpacity
            onPress={() => router.push("/forgotPassword")}
            style={{ alignSelf: "flex-end", marginBottom: 10 }}
          >
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer — Sign In */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextButton,]}
          onPress={onSignIn}
          disabled={isDisabled}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#d5ff5f" />
          ) : (
            <Text style={styles.nextButtonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        {/* Go to Sign Up (optional) */}
        <TouchableOpacity
          style={{ marginTop: 14, alignItems: "center" }}
          onPress={() => router.push("/signup")}
        >
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  header: {
    fontSize: 39,
    fontFamily: "Poppins_600SemiBold",
    color: "white",
    textAlign: "center",
    marginVertical: 20,
  },
  secondheader: {
    textAlign: "center",
    marginVertical: 20,
    marginTop: -20,
    fontSize: 19,
    color: "#8f8f8fff",
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
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#d5ff5f",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#171717ff",
  },
  nextButton: {
    backgroundColor: "black",
    paddingVertical: 22,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  nextButtonText: {
    fontSize: 18,
    color: "#ffffffff",
    fontFamily: "Poppins_300Light",
    textAlign: "center",
  },
  helperText: {
    color: "#8f8f8f",
    marginBottom: 10,
    marginLeft: 10,
    fontSize: 13,
    textAlign: "center",
    fontFamily: "Poppins_400Regular",
  },

  errorText: {
    color: "#ff8181ff",
    marginBottom: 10,
    marginLeft: 10,
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
  },
});

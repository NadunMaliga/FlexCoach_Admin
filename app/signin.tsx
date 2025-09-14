
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import Icon from "react-native-vector-icons/Feather";
import {
  useFonts,
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_600SemiBold,
} from "@expo-google-fonts/poppins";

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
    const e = validate(form);
    setErrors(e);
    if (Object.keys(e).length) return;

    try {
      setSubmitting(true);

      router.replace("/home");
    } catch (err) {

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

  return (
    <View style={styles.container}>
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
          <Text style={styles.nextButtonText}>
            {submitting ? "Signing in..." : "Sign In"}
          </Text>
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
    padding: 25,
    paddingVertical:20,
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

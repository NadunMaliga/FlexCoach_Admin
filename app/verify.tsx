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
    const err = validate(password);
    setError(err);
    if (err) return;

    try {
      setSubmitting(true);


      router.replace("/home");
    } catch (err) {
      setError("Invalid password");
    } finally {
      setSubmitting(false);
    }
  };

  const isDisabled = submitting || !password || !!error;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Verify You</Text>
      <Text style={styles.secondheader}>
       Enter the password given to you{"\n"} by the admin.
      </Text>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
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
                setError(validate(t));
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
      </KeyboardAvoidingView>

       {/* Footer — Sign In */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.nextButton, ]}
                onPress={onSignIn}
                disabled={isDisabled}
              >
                <Text style={styles.nextButtonText}>
                  {submitting ? "Next..." : "Next"}
                </Text>
              </TouchableOpacity>
      
              {/* Go to Sign Up (optional) */}
              <TouchableOpacity
                style={{ marginTop: 14, alignItems: "center" }}
                onPress={() => router.push("/signin")}
              >
                <Text style={{ color: "#757575ff", fontFamily: "Poppins_400Regular" }}>
                  Already have an account? <Text style={{ color: "#000000ff" }}>Sign in</Text>
                </Text>
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
  errorText: {
    color: "#ff8181ff",
    marginBottom: 10,
    marginLeft: 10,
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
  },
});

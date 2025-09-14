import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import GenderPicker from "./GenderPicker";
import DateTimePickerModal from "react-native-modal-datetime-picker";


import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
} from "@expo-google-fonts/poppins";
import Icon from "react-native-vector-icons/Feather";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";

export default function SignUp() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  const [form, setForm] = useState({
    name: "",
    birthday: null,
    age: "",
    mobile: "",
    email: "",
    illnesses: "",
    gender: "",
  });

  const [errors, setErrors] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);

  if (!fontsLoaded) return null;

  const validate = (formData = form) => {
    const newErrors: any = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.birthday) newErrors.birthday = "Birthday is required";

    if (!formData.age.trim()) {
      newErrors.age = "Age is required";
    } else if (!/^\d+$/.test(formData.age.trim())) {
      newErrors.age = "Age must be a number";
    } else if (parseInt(formData.age, 10) <= 0 || parseInt(formData.age, 10) > 120) {
      newErrors.age = "Age must be between 1 and 120";
    }

    if (!formData.mobile.trim()) {
      newErrors.mobile = "Mobile number is required";
    } else if (!/^\d{9}$/.test(formData.mobile.trim())) {
      newErrors.mobile = "Mobile number must be 9 digits";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email.trim())
    ) {
      newErrors.email = "Email format is invalid";
    }

    if (!formData.gender) newErrors.gender = "Gender is required";

    return newErrors;
  };

  const handleChange = (field: string, value: any) => {
    const updatedForm = { ...form, [field]: value };
    setForm(updatedForm);
    const newErrors = validate(updatedForm);
    setErrors(newErrors);
  };

  const onNext = () => {
    const newErrors = validate(form);
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      router.push("/bodyMeasurement");
    }
  };

  const onChangeDate = (event: any, selectedDate: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) handleChange("birthday", selectedDate);
  };

  const formatDate = (date: Date) => {
    if (!date) return "";
    const yyyy = date.getFullYear();
    const mm = (date.getMonth() + 1).toString().padStart(2, "0");
    const dd = date.getDate().toString().padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Sign Up</Text>
      <Text style={styles.secondheader}>Personal Info</Text>

      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
        {/* Name Input */}
        <View style={styles.inputWrapper}>
          <Icon name="user" size={20} color="#dededeff" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor="#dededeff"
            value={form.name}
            onChangeText={(text) => handleChange("name", text)}
          />
        </View>
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

        {/* Birthday Picker */}
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          style={[styles.inputWrapper, { justifyContent: "flex-start" }]}
        >
          <Icon
            name="calendar"
            size={20}
            color={form.birthday ? "white" : "#dededeff"}
            style={styles.icon}
          />
          <Text style={[styles.input, { color: form.birthday ? "white" : "#dededeff" }]}>
            {form.birthday ? formatDate(form.birthday) : "Birthday (YYYY-MM-DD)"}
          </Text>
        </TouchableOpacity>
        {errors.birthday && <Text style={styles.errorText}>{errors.birthday}</Text>}

        <DateTimePickerModal
          isVisible={showDatePicker}
          mode="date"
          maximumDate={new Date()}
          date={form.birthday || new Date(2000, 0, 1)}
          onConfirm={(date) => {
            handleChange("birthday", date);
            setShowDatePicker(false);
          }}
          onCancel={() => setShowDatePicker(false)}
          headerTextIOS="Pick your Birthday"
        />
        {/* Age Input */}
        <View style={styles.inputWrapper}>
          <Icon name="hash" size={20} color="#dededeff" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Age"
            keyboardType="numeric"
            placeholderTextColor="#dededeff"
            value={form.age}
            onChangeText={(text) => handleChange("age", text)}
          />
        </View>
        {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}

        {/* Gender Picker */}

        <GenderPicker
          value={form.gender}
          onChange={(value) => handleChange("gender", value)}
        />
        {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}


        {/* Mobile Input */}
        <View style={styles.phoneWrapper}>
          <View style={styles.prefixContainer}>
            <Text style={styles.prefixText}>🇱🇰 +94</Text>
          </View>
          <TextInput
            style={[styles.input, styles.phoneInput]}
            placeholder="Mobile Number"
            keyboardType="phone-pad"
            placeholderTextColor="#dededeff"
            value={form.mobile}
            onChangeText={(text) => {
              if (/^\d*$/.test(text)) handleChange("mobile", text);
            }}
            maxLength={9}
          />
        </View>
        {errors.mobile && <Text style={styles.errorText}>{errors.mobile}</Text>}

        {/* Email Input */}
        <View style={styles.inputWrapper}>
          <Icon name="mail" size={20} color="#dededeff" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            keyboardType="email-address"
            placeholderTextColor="#dededeff"
            value={form.email}
            onChangeText={(text) => handleChange("email", text)}
          />
        </View>
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

        {/* Illnesses or Injuries */}
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Illnesses or Injuries"
            placeholderTextColor="#dededeff"
            multiline
            value={form.illnesses}
            onChangeText={(text) => handleChange("illnesses", text)}
          />
        </View>
      </ScrollView>

      {/* Footer Next Button */}
      <View style={styles.footer}>
        {/* Next Button */}
        <TouchableOpacity
          style={[
            styles.nextButton,
            { opacity: Object.keys(errors).length === 0 ? 1 : 0.5 },
          ]}
          onPress={onNext}
          disabled={Object.keys(errors).length > 0}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>

        {/* ---- Extra link below ---- */}
        <TouchableOpacity
          style={{ marginTop: 14, alignItems: "center" }}
          onPress={() => router.push("/signin")} // signIn page ekata redirect wenawa
        >
          <Text style={{ color: "#a9a9a9ff", fontFamily: "Poppins_400Regular" }}>
            Already have an account?{" "}
            <Text style={{ color: "white" }}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  header: { fontSize: 39, fontFamily: "Poppins_600SemiBold", color: "white", textAlign: "center", marginVertical: 20 },
  secondheader: { textAlign: "center", marginVertical: 20, marginTop: -20, fontSize: 19, color: "#8f8f8fff" },
  form: { paddingHorizontal: 20, paddingBottom: 100 },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#292929ff", borderRadius: 13, paddingHorizontal: 15, marginBottom: 13 },
  icon: { marginRight: 10 },
  input: { flex: 1, color: "white", fontFamily: "Poppins_400Regular", fontSize: 17, paddingVertical: 15 },
  textArea: { height: 300, textAlignVertical: "top" },
  phoneWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#292929ff", borderRadius: 13, paddingHorizontal: 15, marginBottom: 13 },
  prefixContainer: { paddingHorizontal: 12, paddingVertical: 14, borderTopLeftRadius: 20, borderBottomLeftRadius: 20, justifyContent: "center", alignItems: "center", borderRightWidth: 1, borderRightColor: "#4e4e4eff" },
  prefixText: { color: "#a9a9a9ff", fontFamily: "Poppins_600SemiBold", fontSize: 16 },
  phoneInput: { flex: 1, paddingVertical: 15, borderTopRightRadius: 20, borderBottomRightRadius: 20, color: "white", fontFamily: "Poppins_400Regular", fontSize: 17, marginLeft: 10 },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "black", padding: 25, borderTopWidth: 1, borderTopColor: "#171717ff" },
  nextButton: { backgroundColor: "#ffffffff", paddingVertical: 17, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  nextButtonText: { fontSize: 18, color: "#000000ff", fontFamily: "Poppins_300Light", textAlign: "center" },
  errorText: { color: "#ff8181ff", marginBottom: 10, marginLeft: 10, fontSize: 13, fontFamily: "Poppins_400Regular" },
  birthdayWrapper: { justifyContent: "space-between", paddingVertical: 15 },
  birthdayText: { paddingVertical: 0 },
  pickerWrapper: {
    flex: 1,
    backgroundColor: "#292929ff",
    borderRadius: 13,
    justifyContent: "center",
    height: 55,
  },

  picker: {
    color: "white",
    width: "100%",
    height: "100%",
  },

});

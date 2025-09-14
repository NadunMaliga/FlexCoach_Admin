import {
  Poppins_400Regular,
  Poppins_600SemiBold,
  useFonts,
} from "@expo-google-fonts/poppins";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function BodyMeasurement() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  const [form, setForm] = useState({
    weight: "",
    height: "",
  });

  const [errors, setErrors] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  if (!fontsLoaded)
    return (
      <Text style={{ color: "white", textAlign: "center", marginTop: 50 }}>
        Loading...
      </Text>
    );

  // Validation
  const validate = (formData = form) => {
    const newErrors = {};

    if (!formData.weight.trim()) {
      newErrors.weight = "Weight is required";
    } else if (!/^\d+(\.\d+)?$/.test(formData.weight.trim())) {
      newErrors.weight = "Weight must be a number";
    } else if (
      parseFloat(formData.weight) <= 0 ||
      parseFloat(formData.weight) > 500
    ) {
      newErrors.weight = "Weight must be between 1 and 500 kg";
    }

    if (!formData.height.trim()) {
      newErrors.height = "Height is required";
    } else if (!/^\d+(\.\d+)?$/.test(formData.height.trim())) {
      newErrors.height = "Height must be a number";
    } else if (
      parseFloat(formData.height) <= 30 ||
      parseFloat(formData.height) > 300
    ) {
      newErrors.height = "Height must be between 30 and 300 cm";
    }

    return newErrors;
  };

  // Handle change + realtime validation
  const handleChange = (field, value) => {
    const updatedForm = { ...form, [field]: value };
    setForm(updatedForm);
    const newErrors = validate(updatedForm);
    setErrors(newErrors);
  };

  const onNext = () => {
    const newErrors = validate(form);
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      setShowConfirm(true);
    }
  };

  const handleSelectOption = (option) => {
    setSelectedOption(option);
    setShowConfirm(false);
    // option eka save karanna puluwan
    router.push("/home");
  };

  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Body Measurement</Text>
      <Text style={styles.modalTitletwo}>This unit is where your body measurements are taken, so it is mandatory to provide them.</Text>
      <ScrollView
        contentContainerStyle={styles.form}
        showsVerticalScrollIndicator={false}
      >
        {Object.keys(form).map((field) => (
          <View key={field} style={{ marginBottom: 15 }}>
            <TextInput
              style={styles.input}
              placeholder={
                field === "weight"
                  ? `${capitalize(field)} (kg)`
                  : `${capitalize(field)} (cm)`
              }
              placeholderTextColor="#dededeff"
              keyboardType="numeric"
              value={form[field]}
              onChangeText={(text) => handleChange(field, text)}
            />
            {errors[field] && (
              <Text style={styles.errorText}>{errors[field]}</Text>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
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
      </View>

      {/* Confirmation Modal */}
      <Modal
        transparent
        animationType="slide"
        visible={showConfirm}
        onRequestClose={() => setShowConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Training Mode 💪</Text>
            <Text style={styles.modalTitletwo}>I hereby inform you of how you would like{"\n"} to connect with us and proceed.</Text>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => handleSelectOption("online")}
            >
              <Text style={styles.optionText}>Online Join</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => handleSelectOption("practical")}
            >
              <Text style={styles.optionText}>Practical</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  header: {
    fontSize: 24,
    fontFamily: "Poppins_600SemiBold",
    color: "white",
    textAlign: "center",
    marginVertical: 20,
  },
  form: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  input: {
    backgroundColor: "#292929ff",
    borderRadius: 13,
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 17,
    fontFamily: "Poppins_400Regular",
    color: "white",
  },
  errorText: {
    color: "#ff8181ff",
    marginTop: 5,
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "black",
    padding: 25,
    borderTopWidth: 1,
    borderTopColor: "#171717ff",
  },
  nextButton: {
    backgroundColor: "#ffffffff",
    paddingVertical: 17,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  nextButtonText: {
    fontSize: 18,
    color: "#000000ff",
    fontFamily: "Poppins_300Light",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(60, 60, 60, 0.6)",
    justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: "#111111ff",
    padding: 25,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  modalTitle: {
    color: "#f1f1f1ff",
    textAlign: "center",
    fontSize: 23,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 20,
    marginTop:30,
  },
  modalTitletwo: {
    color: "#c2c0c0ff",
    textAlign: "center",
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    marginBottom: 30,
  },
  optionButton: {
    padding: 15,
    borderRadius: 30,
    backgroundColor: "#ffffffff",
    marginBottom: 10,
  },
  optionText: {
    fontSize: 17,
    color: "#000000ff",
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
  },
});

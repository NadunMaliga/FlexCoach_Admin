import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  ScrollView,
  Modal,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";

export default function Stats() {
  const [form, setForm] = useState({
    weight: "",
    height: "",
    chest: "",
    waist: "",
    hip: "",
    calf: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: boolean }>({});
  const [history, setHistory] = useState<any[]>([
    { weight: "70", height: "175", chest: "95", waist: "80", hip: "90", calf: "38", date: "18/08/2025" },
    { weight: "72", height: "176", chest: "96", waist: "81", hip: "91", calf: "39", date: "17/08/2025" },
    { weight: "69", height: "174", chest: "94", waist: "79", hip: "89", calf: "37", date: "16/08/2025" },
  ]);

  const [selected, setSelected] = useState<any | null>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const handleChange = (field: string, value: string) => {
    setForm({ ...form, [field]: value });
    setErrors({ ...errors, [field]: false });
  };

  const triggerShake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start();
  };

  const validate = () => {
    const newErrors: any = {};
    Object.keys(form).forEach((key) => {
      if (!form[key as keyof typeof form]?.trim()) newErrors[key] = true;
    });
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      triggerShake();
      return false;
    }

    const today = new Date();
    const entry = { ...form, date: today.toLocaleDateString("en-GB") };
    setHistory([entry, ...history]);
    setForm({ weight: "", height: "", chest: "", waist: "", hip: "", calf: "" });
    return true;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Today's Measurements</Text>
      <ScrollView contentContainerStyle={styles.form}>
        {[
          { key: "weight", label: "Weight (kg)" },
          { key: "height", label: "Height (cm)" },
          { key: "chest", label: "Chest (cm)" },
          { key: "waist", label: "Waist (cm)" },
          { key: "hip", label: "Hip (cm)" },
          { key: "calf", label: "Calf (cm)" },
        ].map((field) => (
          <View key={field.key} style={{ marginBottom: 10 }}>
            <Animated.View
              style={[
                styles.inputWrapper,
                { borderColor: errors[field.key] ? "#ff0000" : "#292929ff" },
                { transform: [{ translateX: shakeAnim }] },
              ]}
            >
              <TextInput
                style={styles.input}
                placeholder={field.label}
                placeholderTextColor="#dededeff"
                keyboardType="numeric"
                value={form[field.key as keyof typeof form]}
                onChangeText={(text) => handleChange(field.key, text)}
              />
            </Animated.View>
            {errors[field.key] && (
              <Text style={styles.errorText}>{field.label} is required</Text>
            )}
          </View>
        ))}

        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveButton} onPress={validate}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subHeader}>Measurement History</Text>
        {history.map((item, idx) => (
          <TouchableOpacity key={idx} style={styles.historyItem} onPress={() => setSelected(item)}>
            <View style={styles.dateBox}>
              <Icon name="calendar" size={24} color="white" />
            </View>
            <View style={styles.historyDetails}>
              <Text style={styles.historydateText}>{item.date}</Text>
              <Text style={styles.historyText}>
                Weight: {item.weight} kg | Height: {item.height} cm
              </Text>
            </View>
            <View style={styles.rightIconBox}>
              <Icon name="chevron-right" size={24} color="white" />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal visible={!!selected} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            {/* Close icon now positioned outside the padded box */}
            <TouchableOpacity 
              style={styles.modalCloseIconFixed}
              onPress={() => setSelected(null)}
            >
              <Icon name="x" size={28} color="white" />
            </TouchableOpacity>

            {selected && (
              <View style={{ marginTop: 20 }}>
                <Text style={styles.modalDate}>{selected.date}</Text>
                {Object.keys(selected)
                  .filter((k) => k !== "date")
                  .map((key) => (
                    <View key={key} style={styles.modalRow}>
                      <Text style={styles.modalRowKey}>
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </Text>
                      <Text style={styles.modalRowValue}>{selected[key]}</Text>
                    </View>
                  ))}
              </View>
            )}
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  header: { fontSize: 30, color: "white", paddingLeft: 23, marginVertical: 20, fontWeight: "600" },
  subHeader: { fontSize: 25, color: "white", marginTop: 20, marginBottom: 10, fontWeight: "500" },
  form: { paddingHorizontal: 20, paddingBottom: 120 },
  inputWrapper: { backgroundColor: "#292929ff", borderRadius: 13, paddingHorizontal: 15, borderWidth: 1.5 },
  input: { color: "white", fontSize: 16, paddingVertical: 15 },
  errorText: { color: "#ff9191ff", fontSize: 12, marginTop: 2, marginLeft: 5 },
  footer: { marginVertical: 15 },
  saveButton: { backgroundColor: "white", paddingVertical: 13, borderRadius: 20, alignItems: "center" },
  saveButtonText: { fontSize: 16, fontWeight: "400", color: "black" },
  historyItem: { marginBottom: 12, marginTop: 15, flexDirection: "row", alignItems: "center" },
  dateBox: { width: 60, height: 60, borderRadius: 20, backgroundColor: "#333", justifyContent: "center", alignItems: "center", marginRight: 15 },
  historyDetails: { flex: 1 },
  historydateText: { color: "#ffffffff", fontSize: 17 },
  historyText: { color: "#6f6f6fff", fontSize: 14 },
  rightIconBox: { marginLeft: 10 },
  modalCloseIconFixed: {justifyContent:"flex-end",alignItems:"flex-end",},
  modalContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalBox: { backgroundColor: "#1c1c1c", padding: 20, borderTopLeftRadius: 40, borderTopRightRadius: 40 },
  modalCloseIcon: { position: "absolute", top: 10, right: 10 },
  modalDate: { color: "#ffffffff", fontSize: 19 , marginBottom: 10 },
  modalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: "#444" },
  modalRowKey: { color: "#aaa", fontSize: 16 },
  modalRowValue: { color: "white", fontSize: 16 },
  
});

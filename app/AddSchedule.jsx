import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
} from "@expo-google-fonts/poppins";

export default function AddSchedule() {
  const router = useRouter();

  const totalSteps = 3;
  const [currentStep, setCurrentStep] = useState(1);

  const [day, setDay] = useState("");
  const [exercises, setExercises] = useState([]);
  const [tempExercise, setTempExercise] = useState({
    name: "",
    sets: "",
    reps: "",
    weight: "",
    rest: "",
  });
  const [duration, setDuration] = useState("");
  const [exerciseModalVisible, setExerciseModalVisible] = useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });

  if (!fontsLoaded) return null;

  // Exercise options
  const exerciseOptions = [
    "Push Ups",
    "Squats",
    "Bench Press",
    "Deadlift",
    "Bicep Curls",
    "Plank",
  ];

  const addExercise = () => {
    if (!tempExercise.name) {
      return;
    }
    setExercises([...exercises, tempExercise]);
    setTempExercise({ name: "", sets: "", reps: "", weight: "", rest: "" });
  };

  const onNext = () => {
    if (currentStep === 1 && !day.trim()) return;
    if (currentStep === 2 && exercises.length === 0) return;
    if (currentStep === 3 && !duration.trim()) return;

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      router.back();
    }
  };

  const onBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  // Step 1
  const renderStep1 = () => (
    <>
      <Text style={styles.stepTitle}>Step 1: Select Day</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Day (1, 2, 3 ...)"
        placeholderTextColor="#999"
        value={day}
        onChangeText={setDay}
        keyboardType="numeric"
      />
      <Text style={styles.text}>You can continue the exercise schedule you have applied to your client from here. It can be done in three steps:
              </Text>
    </>
  );

  // Step 2
  const renderStep2 = () => (
    <>
      <Text style={styles.stepTitle}>Step 2: Add Exercises</Text>

      {/* Custom Exercise Selector */}
      <TouchableOpacity
        style={styles.selectBox}
        onPress={() => setExerciseModalVisible(true)}
      >
        <Text style={styles.selectText}>
          {tempExercise.name ? tempExercise.name : "Choose Exercise"}
        </Text>
        <Feather name="chevron-up" size={20} color="#fff" />
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        visible={exerciseModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setExerciseModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
               <TouchableOpacity onPress={() => setExerciseModalVisible(false)}>
                <Feather name="x" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ marginTop: 15 }}>
              {exerciseOptions.map((ex, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.optionItem}
                  onPress={() => {
                    setTempExercise({ ...tempExercise, name: ex });
                    setExerciseModalVisible(false);
                  }}
                >
                  <Text style={styles.optionText}>{ex}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Inputs */}
      <TextInput
        style={styles.input}
        placeholder="Sets"
        placeholderTextColor="#999"
        keyboardType="numeric"
        value={tempExercise.sets}
        onChangeText={(t) => setTempExercise({ ...tempExercise, sets: t })}
      />
      <TextInput
        style={styles.input}
        placeholder="Reps"
        placeholderTextColor="#999"
        keyboardType="numeric"
        value={tempExercise.reps}
        onChangeText={(t) => setTempExercise({ ...tempExercise, reps: t })}
      /> 
      <TextInput
        style={styles.input}
        placeholder="Rest (sec)"
        placeholderTextColor="#999"
        keyboardType="numeric"
        value={tempExercise.rest}
        onChangeText={(t) => setTempExercise({ ...tempExercise, rest: t })}
      />

      <TouchableOpacity style={styles.addBtn} onPress={addExercise}>
        <Text style={styles.addBtnText}>Add Exercise</Text>
      </TouchableOpacity>

      <ScrollView style={{ maxHeight: 200, marginTop: 20 }}>
        {exercises.map((ex, idx) => (
          <View key={idx} style={styles.exerciseItem}>
            <Text style={{ color: "#fff", fontFamily: "Poppins_400Regular" }}>
              {ex.name} - {ex.sets} x {ex.reps} ({ex.weight}kg, Rest {ex.rest}s)
            </Text>
          </View>
        ))}
      </ScrollView>
    </>
  );

  // Step 3
  const renderStep3 = () => (
    <>
      <Text style={styles.stepTitle}>Step 3: Finalize</Text>
      <Text style={styles.subTitle}>
        Day {day} - {exercises.length} exercises added
      </Text>

      <ScrollView style={{ maxHeight: 200, marginBottom: 20 }}>
        {exercises.map((ex, idx) => (
          <Text
            key={idx}
            style={{
              color: "#fff",
              marginBottom: 5,
              fontFamily: "Poppins_400Regular",
            }}
          >
            • {ex.name} - {ex.sets} x {ex.reps} ({ex.weight}kg, Rest {ex.rest}s)
          </Text>
        ))}
      </ScrollView>

      <TextInput
        style={styles.input}
        placeholder="Duration (minutes)"
        placeholderTextColor="#999"
        keyboardType="numeric"
        value={duration}
        onChangeText={setDuration}
      />
    </>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return renderStep1();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={{ padding: 5 }}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Schedule</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 5 }}>
          <Feather name="x" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Step Indicator */}
      <View style={styles.stepIndicator}>
        <View style={styles.stepTrack}>
          <View
            style={[
              styles.stepProgress,
              { width: `${(currentStep / totalSteps) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.stepText}>
          Step {currentStep} of {totalSteps}
        </Text>
      </View>

      {/* Form */}
      <ScrollView
        contentContainerStyle={{ padding: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        {renderStep()}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextBtn} onPress={onNext}>
          <Text style={styles.nextBtnText}>
            {currentStep === totalSteps ? "Finish" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  header: {
    paddingTop: Platform.OS === "ios" ? 50 : StatusBar.currentHeight + 10,
    paddingBottom: 25,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "black",
  },
  headerTitle: {
    color: "white",
    fontSize: 23,
  },
  
  text: {
    color: "#777",
    textAlign: "center",
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
  },
  stepIndicator: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  stepTrack: {
    height: 6,
    backgroundColor: "#333",
    borderRadius: 3,
    overflow: "hidden",
  },
  stepProgress: {
    height: 6,
    backgroundColor: "#d5ff5f",
    borderRadius: 3,
  },
  stepText: {
    color: "#aaa",
    marginTop: 10,
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
  },
  stepTitle: {
    fontSize: 22,
    color: "#fff",
    marginBottom: 15,
  },
  subTitle: {
    color: "#aaa",
    marginBottom: 15,
    fontFamily: "Poppins_400Regular",
  },
  input: {
    backgroundColor: "#1d1d1dff",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 15,
    color: "white",
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    marginBottom: 15,
  },
  selectBox: {
    backgroundColor: "#1c1c1c",
    borderRadius: 15,
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  selectText: { color: "#fff", fontSize: 16 },
  addBtn: {
    backgroundColor: "black",
    borderColor: "#525252ff",
    borderWidth: 1,
    width: 200,
    padding: 15,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 5,
  },
  addBtnText: {
    color: "white",
    fontWeight: "600",
    fontFamily: "Poppins_500Medium",
  },
  exerciseItem: {
    backgroundColor: "#333",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#d5ff5f",
    padding: 25,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#171717ff",
  },
  nextBtn: {
    backgroundColor: "black",
    paddingVertical: 22,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  nextBtnText: {
    fontSize: 18,
    color: "#ffffffff",
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#111",
    padding: 30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
   optionItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#1e1d1dff",
  },
  optionText: { color: "#949191ff", fontSize: 16 },
});

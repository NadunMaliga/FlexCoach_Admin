import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  useFonts,
} from "@expo-google-fonts/poppins";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Logger from '../utils/logger';
import OfflineApiService from "../services/OfflineApiService";
import LoadingGif from '../components/LoadingGif';
import { showAlert, showSuccess, showError } from '../utils/customAlert';


export default function AddSchedule() {
  const router = useRouter();
  const { userId, scheduleId, mode } = useLocalSearchParams();
  const isEditMode = mode === 'edit' && !!scheduleId;

  const totalSteps = 3;
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(isEditMode);

  const [workoutName, setWorkoutName] = useState("");
  const [day, setDay] = useState("");
  const [workoutType, setWorkoutType] = useState("");
  const [exercises, setExercises] = useState([]);
  const [tempExercise, setTempExercise] = useState({
    name: "",
    exerciseId: "",
    sets: "",
    reps: "",
    weight: "",
    rest: "",
  });
  const [duration, setDuration] = useState("");
  const [exerciseModalVisible, setExerciseModalVisible] = useState(false);
  const [workoutTypeModalVisible, setWorkoutTypeModalVisible] = useState(false);

  // Saving state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Exercise data from API
  const [exerciseOptions, setExerciseOptions] = useState([]);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [exerciseError, setExerciseError] = useState(null);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });

  // Load exercises from API
  useEffect(() => {
    loadExercises();

    // Load existing schedule data if in edit mode
    if (isEditMode) {
      loadScheduleForEdit();
    }
  }, []);

  // Load existing schedule data for editing
  const loadScheduleForEdit = async () => {
    if (!scheduleId) return;

    try {
      setLoading(true);
      Logger.log('Loading schedule for edit, scheduleId:', scheduleId);

      const response = await OfflineApiService.getUserWorkoutSchedules(userId);

      Logger.log('API Response:', response);

      if (response.success) {
        // Check both possible response structures
        const schedulesList = response.schedules || response.workoutSchedules || [];
        Logger.log('Schedules list:', schedulesList);
        
        const scheduleToEdit = schedulesList.find(s => s._id === scheduleId);

        if (scheduleToEdit) {
          Logger.log('Found schedule to edit:', scheduleToEdit);

          // Extract day number from day string (e.g., "Day 1" -> "1")
          let dayNumber = '';
          if (scheduleToEdit.day) {
            const dayMatch = scheduleToEdit.day.match(/\d+/);
            dayNumber = dayMatch ? dayMatch[0] : scheduleToEdit.dayNumber?.toString() || '';
          } else if (scheduleToEdit.dayNumber) {
            dayNumber = scheduleToEdit.dayNumber.toString();
          }

          // Set basic info
          setWorkoutName(scheduleToEdit.name || '');
          setDay(dayNumber);
          setWorkoutType(scheduleToEdit.workoutType || '');
          setDuration(scheduleToEdit.totalDuration?.toString() || scheduleToEdit.estimatedDuration?.toString() || scheduleToEdit.duration?.toString() || '');

          // Set exercises
          if (scheduleToEdit.exercises && scheduleToEdit.exercises.length > 0) {
            const formattedExercises = scheduleToEdit.exercises.map(ex => {
              // Handle different exercise data structures
              const exerciseData = ex.exercise || ex;
              return {
                name: exerciseData.name || ex.exerciseName || '',
                exerciseId: exerciseData._id || ex.exerciseId || ex._id || '',
                sets: ex.sets?.toString() || '',
                reps: ex.reps?.toString() || '',
                weight: ex.weight?.toString() || '',
                rest: (ex.restTime || ex.rest)?.toString() || ''
              };
            });
            setExercises(formattedExercises);
            Logger.log('Loaded exercises for editing:', formattedExercises);
          }
        } else {
          Logger.error('Schedule not found with ID:', scheduleId);
          Logger.error('Available schedule IDs:', schedulesList.map(s => s._id));
          showAlert('Error', 'Schedule not found');
          router.back();
        }
      } else {
        Logger.error('API response not successful:', response);
        showAlert('Error', 'Failed to load schedule');
        router.back();
      }
    } catch (error) {
      Logger.error('Error loading schedule for edit:', error);
      showAlert('Error', 'Failed to load schedule');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const loadExercises = async () => {
    try {
      setLoadingExercises(true);
      setExerciseError(null);
      const response = await OfflineApiService.getExercises({ limit: 100 });
      if (response.success) {
        setExerciseOptions(response.exercises || []);
      } else {
        setExerciseError('Failed to load exercises');
        // Fallback to mock data if API fails
        setExerciseOptions([
          { name: "Push Ups", _id: "mock_1" },
          { name: "Squats", _id: "mock_2" },
          { name: "Bench Press", _id: "mock_3" },
          { name: "Deadlift", _id: "mock_4" },
          { name: "Bicep Curls", _id: "mock_5" },
          { name: "Plank", _id: "mock_6" }
        ]);
      }
    } catch (err) {
      Logger.error('Load exercises error:', err);
      setExerciseError('Failed to load exercises');
      // Fallback to mock data if API fails
      setExerciseOptions([
        { name: "Push Ups", _id: "mock_1" },
        { name: "Squats", _id: "mock_2" },
        { name: "Bench Press", _id: "mock_3" },
        { name: "Deadlift", _id: "mock_4" },
        { name: "Bicep Curls", _id: "mock_5" },
        { name: "Plank", _id: "mock_6" }
      ]);
    } finally {
      setLoadingExercises(false);
    }
  };

  if (!fontsLoaded) return null;

  // Show loading screen while fetching schedule data in edit mode
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <LoadingGif size={100} />
        <Text style={{ color: '#999', marginTop: 20, fontFamily: 'Poppins_400Regular' }}>
          Loading schedule...
        </Text>
      </View>
    );
  }

  const addExercise = () => {
    if (!tempExercise.name || !tempExercise.exerciseId || !tempExercise.sets || !tempExercise.reps) {
      return;
    }
    setExercises([...exercises, tempExercise]);
    setTempExercise({ name: "", exerciseId: "", sets: "", reps: "", weight: "", rest: "" });
  };

  // Save workout schedule to backend
  const saveWorkoutSchedule = async () => {
    if (!userId) {
      setSaveError('User ID is required');
      return false;
    }

    try {
      setSaving(true);
      setSaveError(null);

      // Prepare the workout data according to the Workout model
      const workoutData = {
        name: workoutName || `Day ${day} Workout`,
        description: `Workout for Day ${day} with ${exercises.length} exercises`,
        userId: userId,
        day: getDayName(day),
        dayNumber: parseInt(day) || 1, // Use the actual day number entered by user
        exercises: exercises.map(ex => ({
          exercise: ex.exerciseId, // Exercise ID - backend will fetch the name automatically
          sets: parseInt(ex.sets) || 0,
          reps: parseInt(ex.reps) || 0,
          weight: ex.weight ? parseFloat(ex.weight) : 0,
          restTime: ex.rest ? (parseInt(ex.rest) || 60) : 60
        })),
        totalDuration: parseInt(duration) || 0,
        workoutType: workoutType || 'Mixed',
        scheduledDate: new Date(), // For now, schedule for today
        difficulty: 'Beginner' // Default difficulty
      };

      Logger.log('Saving workout schedule:', workoutData);

      let response;
      if (isEditMode && scheduleId) {
        // Update existing schedule
        Logger.log('Updating schedule with ID:', scheduleId);
        response = await OfflineApiService.updateWorkoutSchedule(scheduleId, workoutData);
      } else {
        // Create new schedule
        response = await OfflineApiService.createWorkoutSchedule(workoutData);
      }

      if (response.success) {
        Logger.log('Workout schedule saved successfully');
        return true;
      } else {
        setSaveError('Failed to save workout schedule');
        return false;
      }
    } catch (error) {
      Logger.error('Save workout schedule error:', error);
      setSaveError('Failed to save workout schedule');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Helper function to convert day number to day name
  const getDayName = (dayNumber) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayIndex = ((parseInt(dayNumber) || 1) - 1) % 7;
    return days[dayIndex] || 'Monday';
  };

  const onNext = async () => {
    if (currentStep === 1 && (!workoutName.trim() || !day.trim() || !workoutType.trim())) return;
    if (currentStep === 2 && exercises.length === 0) return;
    if (currentStep === 3 && !duration.trim()) return;

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step - save the workout schedule
      const saved = await saveWorkoutSchedule();
      if (saved) {
        router.back();
      }
    }
  };

  const onBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  // Workout type options
  const workoutTypeOptions = ['Strength', 'Cardio', 'HIIT', 'Flexibility', 'Mixed'];

  // Step 1
  const renderStep1 = () => (
    <>
      <Text style={styles.stepTitle}>Step 1: Workout Details</Text>

      <TextInput
        style={styles.input}
        placeholder="Workout Name (e.g., Upper Body Strength)"
        placeholderTextColor="#999"
        value={workoutName}
        onChangeText={setWorkoutName}
      />

      <TextInput
        style={styles.input}
        placeholder="Enter Day Number (1, 2, 3, 4, 5, 6, 7, 8, 9, 10...)"
        placeholderTextColor="#999"
        value={day}
        onChangeText={setDay}
        keyboardType="numeric"
      />

      {/* Workout Type Selector */}
      <TouchableOpacity
        style={styles.selectBox}
        onPress={() => setWorkoutTypeModalVisible(true)}
      >
        <Text style={styles.selectText}>
          {workoutType ? workoutType : "Choose Workout Type"}
        </Text>
        <Feather name="chevron-down" size={20} color="#fff" />
      </TouchableOpacity>

      {/* Workout Type Modal */}
      <Modal
        visible={workoutTypeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setWorkoutTypeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Workout Type</Text>
              <TouchableOpacity onPress={() => setWorkoutTypeModalVisible(false)}>
                <Feather name="x" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ marginTop: 15 }}>
              {workoutTypeOptions.map((type, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.optionItem}
                  onPress={() => {
                    setWorkoutType(type);
                    setWorkoutTypeModalVisible(false);
                  }}
                >
                  <Text style={styles.optionText}>{type}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Text style={styles.text}>
        Create a workout schedule for your client. Fill in the workout details to get started.
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
              <Text style={styles.modalTitle}>Choose Exercise</Text>
              <TouchableOpacity onPress={() => setExerciseModalVisible(false)}>
                <Feather name="x" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            {loadingExercises ? (
              <View style={styles.loadingContainer}>
                <LoadingGif size={100} />
              </View>
            ) : exerciseError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{exerciseError}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadExercises}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView style={{ marginTop: 15 }}>
                {exerciseOptions.map((ex, idx) => (
                  <TouchableOpacity
                    key={ex._id || idx}
                    style={styles.optionItem}
                    onPress={() => {
                      setTempExercise({
                        ...tempExercise,
                        name: ex.name,
                        exerciseId: ex._id
                      });
                      setExerciseModalVisible(false);
                    }}
                  >
                    <View>
                      <Text style={styles.optionText}>{ex.name}</Text>
                      {ex.description && (
                        <Text style={styles.optionDescription}>
                          {ex.description.length > 50
                            ? ex.description.substring(0, 50) + "..."
                            : ex.description}
                        </Text>
                      )}
                      {ex.category && ex.difficulty && (
                        <Text style={styles.optionMeta}>
                          {ex.category} • {ex.difficulty}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
                {exerciseOptions.length === 0 && (
                  <Text style={styles.noExercisesText}>No exercises available</Text>
                )}
              </ScrollView>
            )}
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
        placeholder="Weight (kg) - Optional"
        placeholderTextColor="#999"
        keyboardType="numeric"
        value={tempExercise.weight}
        onChangeText={(t) => setTempExercise({ ...tempExercise, weight: t })}
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
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#fff", fontFamily: "Poppins_400Regular" }}>
                {ex.name} - {ex.sets} x {ex.reps} ({ex.weight}kg, Rest {ex.rest}s)
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => {
                  // Load exercise data into form for editing
                  setTempExercise(ex);
                  // Remove from list so it can be re-added after editing
                  setExercises(exercises.filter((_, i) => i !== idx));
                }}
                style={{ padding: 5 }}
              >
                <Feather name="edit-2" size={18} color="#d5ff5f" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    'Delete Exercise',
                    `Remove ${ex.name} from the workout?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => setExercises(exercises.filter((_, i) => i !== idx))
                      }
                    ]
                  );
                }}
                style={{ padding: 5 }}
              >
                <Feather name="trash-2" size={18} color="#ff6b6b" />
              </TouchableOpacity>
            </View>
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <StatusBar barStyle="light-content" backgroundColor="black" />

      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={{ padding: 5 }}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? 'Edit Schedule' : 'Add Schedule'}
        </Text>
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
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
      >
        {renderStep()}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextBtn} onPress={onNext}>
          <Text style={styles.nextBtnText}>
            {currentStep === totalSteps ? (isEditMode ? "Update" : "Finish") : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  header: {
    paddingTop: Platform.OS === "ios" ? 50 : StatusBar.currentHeight + 10,
    paddingBottom: 15,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "black",
  },
  headerTitle: {
    color: "white",
    fontSize: 20,
    fontFamily: "Poppins_500Medium",
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
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Poppins_500Medium",
  },
  optionItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#1e1d1dff",
  },
  optionText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
  },
  optionDescription: {
    color: "#999",
    fontSize: 12,
    marginTop: 2,
    fontFamily: "Poppins_400Regular",
  },
  optionMeta: {
    color: "#d5ff5f",
    fontSize: 11,
    marginTop: 4,
    fontFamily: "Poppins_400Regular",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    color: "#999",
    marginTop: 10,
    fontFamily: "Poppins_400Regular",
  },
  errorContainer: {
    padding: 20,
    alignItems: "center",
  },
  errorText: {
    color: "#ff6b6b",
    textAlign: "center",
    marginBottom: 15,
    fontFamily: "Poppins_400Regular",
  },
  retryButton: {
    backgroundColor: "#d5ff5f",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: "#000",
    fontFamily: "Poppins_500Medium",
  },
  noExercisesText: {
    color: "#999",
    textAlign: "center",
    padding: 20,
    fontFamily: "Poppins_400Regular",
  },
});
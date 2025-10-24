import {
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    useFonts,
} from "@expo-google-fonts/poppins";
import { useRoute } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import ApiService from "../services/api";

export default function ProfileSchedules() {
  const route = useRoute();
  const params = useLocalSearchParams();
  const [selectedExercise, setSelectedExercise] = useState(null);
  
  // Real data state
  const [workoutData, setWorkoutData] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });

  useEffect(() => {
    loadWorkoutDetails();
  }, []);

  const loadWorkoutDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get workoutId from route params or use a default for testing
      const workoutId = params?.workoutId || route.params?.workoutId || '68e8c961e2d97b8b23095123';
      
      console.log('Loading workout details for ID:', workoutId);
      
      const response = await ApiService.getWorkoutScheduleDetails(workoutId);
      
      if (response.success) {
        setWorkoutData(response.workoutSchedule);
        setExercises(response.exercises);
        console.log('Loaded workout:', response.workoutSchedule.name);
        console.log('Loaded exercises:', response.exercises.length);
      } else {
        setError('Failed to load workout details');
        // Fallback to mock data
        setExercises([
          {
            name: "Push Ups",
            detail: "10 steps - 20Kg Weight",
            videoUrl: "https://youtu.be/WDIpL0pjun0?si=qJt2bxbBy-6g4c1b",
            sets: 3,
            reps: 12,
            weight: 20,
            rest: 60,
            date: new Date().toISOString()
          }
        ]);
      }
    } catch (err) {
      console.error('Load workout details error:', err);
      setError('Failed to load workout details');
      // Fallback to mock data
      setExercises([
        {
          name: "Push Ups",
          detail: "10 steps - 20Kg Weight", 
          videoUrl: "https://youtu.be/WDIpL0pjun0?si=qJt2bxbBy-6g4c1b",
          sets: 3,
          reps: 12,
          weight: 20,
          rest: 60,
          date: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded) return null;

  const goToDetails = (exercise) => {
    setSelectedExercise(exercise);
  };

  return (
    <View style={styles.container}>
      {/* Modal */}
      <Modal visible={!!selectedExercise} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <TouchableOpacity
              style={styles.modalCloseIcon}
              onPress={() => setSelectedExercise(null)}
            >
              <Text style={{ color: "white", fontSize: 20 }}>✕</Text>
            </TouchableOpacity>

            {selectedExercise && (
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.modalTitle}>{selectedExercise.name}</Text>
                <Text style={styles.modalSub}>{selectedExercise.detail}</Text>

                {/* Real exercise data fields */}
                <View style={styles.modalRow}>
                  <Text style={styles.modalRowKey}>Date</Text>
                  <Text style={styles.modalRowValue}>
                    {selectedExercise.date ? new Date(selectedExercise.date).toLocaleDateString() : 'N/A'}
                  </Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalRowKey}>Sets</Text>
                  <Text style={styles.modalRowValue}>{selectedExercise.sets || 'N/A'}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalRowKey}>Reps</Text>
                  <Text style={styles.modalRowValue}>{selectedExercise.reps || 'N/A'}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalRowKey}>Weight</Text>
                  <Text style={styles.modalRowValue}>{selectedExercise.weight || 0} Kg</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalRowKey}>Rest</Text>
                  <Text style={styles.modalRowValue}>{selectedExercise.rest || 60} sec</Text>
                </View>
                
                {/* Additional exercise information if available */}
                {selectedExercise.description && (
                  <View style={styles.modalRow}>
                    <Text style={styles.modalRowKey}>Description</Text>
                    <Text style={styles.modalRowValue}>{selectedExercise.description}</Text>
                  </View>
                )}
                
                {selectedExercise.category && (
                  <View style={styles.modalRow}>
                    <Text style={styles.modalRowKey}>Category</Text>
                    <Text style={styles.modalRowValue}>{selectedExercise.category}</Text>
                  </View>
                )}
                
                {selectedExercise.difficulty && (
                  <View style={styles.modalRow}>
                    <Text style={styles.modalRowKey}>Difficulty</Text>
                    <Text style={styles.modalRowValue}>{selectedExercise.difficulty}</Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Loading State */}
      {loading ? (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#d5ff5f" />
          <Text style={{ color: '#fff', marginTop: 10, fontFamily: "Poppins_400Regular" }}>
            Loading workout details...
          </Text>
        </View>
      ) : (
        /* Exercises List */
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        >
          <Text style={styles.dayTitle}>
            {workoutData?.dayNumber ? `Day ${workoutData.dayNumber}` : 'Day 1'}
          </Text>
          <Text style={styles.text}>
            {workoutData ? 
              `${workoutData.name} - ${workoutData.workoutType} workout with ${exercises.length} exercises. Click on an exercise to see full details.` :
              'This Client workout will be updated here according to your schedule. Click on a workout to see full details.'
            }
          </Text>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadWorkoutDetails}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {exercises.length > 0 ? (
            exercises.map((ex, index) => (
              <TouchableOpacity key={index} onPress={() => goToDetails(ex)}>
                <View style={styles.card}>
                  <View style={styles.iconWrapper}>
                    <Svg
                      width={28}
                      height={28}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#fff"
                      strokeWidth={1.2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <Path d="M7.4 7H4.6C4.26863 7 4 7.26863 4 7.6V16.4C4 16.7314 4.26863 17 4.6 17H7.4C7.73137 17 8 16.7314 8 16.4V7.6C8 7.26863 7.73137 7 7.4 7Z" />
                      <Path d="M19.4 7H16.6C16.2686 7 16 7.26863 16 7.6V16.4C16 16.7314 16.2686 17 16.6 17H19.4C19.7314 17 20 16.7314 20 16.4V7.6C20 7.26863 19.7314 7 19.4 7Z" />
                      <Path d="M1 14.4V9.6C1 9.26863 1.26863 9 1.6 9H3.4C3.73137 9 4 9.26863 4 9.6V14.4C4 14.7314 3.73137 15 3.4 15H1.6C1.26863 15 1 14.7314 1 14.4Z" />
                      <Path d="M23 14.4V9.6C23 9.26863 22.7314 9 22.4 9H20.6C20.2686 9 20 9.26863 20 9.6V14.4C20 14.7314 20.2686 15 20.6 15H22.4C22.7314 15 23 14.7314 23 14.4Z" />
                      <Path d="M8 12H16" />
                    </Svg>
                  </View>

                  <View style={styles.infoContainer}>
                    <Text style={styles.title}>{ex.name}</Text>
                    <Text style={styles.dateRange}>{ex.detail}</Text>
                  </View>

                  <Svg
                    width={18}
                    height={18}
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="#999"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <Path d="M9 18l6-6-6-6" />
                  </Svg>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            !loading && (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>
                  No exercises found for this workout.
                </Text>
              </View>
            )
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  dayTitle: {
    fontSize: 40,
    color: "#fff",
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    marginBottom: 20,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1c1c1c",
    borderRadius: 50,
    padding: 17,
    marginBottom: 15,
    justifyContent: "space-between",
  },
  iconWrapper: {
    backgroundColor: "#3a3a3aff",
    padding: 19,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  infoContainer: { flex: 1, marginLeft: 15 },
  title: {
    fontSize: 19,
    fontWeight: "300",
    color: "#fff",
    fontFamily: "Poppins_400Regular",
  },
  dateRange: {
    fontSize: 14,
    color: "#999",
    fontFamily: "Poppins_400Regular",
  },
  text: {
    color: "#777",
    textAlign: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: "#1c1c1c",
    paddingHorizontal: 25,
    paddingTop: 20,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    maxHeight: "80%",
    flex: 1,
  },
  modalCloseIcon: {
    alignSelf: "flex-end",
    padding: 10,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  modalSub: {
    color: "#aaa",
    fontSize: 15,
    marginBottom: 20,
    textAlign: "center",
  },
  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#333",
  },
  modalRowKey: {
    color: "#aaa",
    fontSize: 16,
  },
  modalRowValue: {
    color: "#fff",
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: "#1c1c1c",
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
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
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: "#000",
    fontFamily: "Poppins_500Medium",
  },
  noDataContainer: {
    backgroundColor: "#1c1c1c",
    padding: 30,
    borderRadius: 15,
    marginTop: 20,
    alignItems: "center",
  },
  noDataText: {
    color: "#999",
    textAlign: "center",
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
  },
});
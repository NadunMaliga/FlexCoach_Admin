import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useRoute, useNavigation } from "@react-navigation/native";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
} from "@expo-google-fonts/poppins";

export default function ProfileSchedules() {
  const route = useRoute();
  const navigation = useNavigation();
  const [selectedExercise, setSelectedExercise] = useState(null);

  const { day } = route.params;

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });

  if (!fontsLoaded) return null;

  const exercises = [
    {
      name: "Push Ups",
      detail: "10 steps - 20Kg Weight",
      videoUrl: "https://youtu.be/WDIpL0pjun0?si=qJt2bxbBy-6g4c1b",
    },
    {
      name: "Squats",
      detail: "12 steps - 20Kg Weight",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    },
    {
      name: "Lunges",
      detail: "8 steps - 20Kg Weight",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    },
    {
      name: "Plank",
      detail: "1 min hold - 20Kg Weight",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    },
  ];

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

                {/* Example fields */}
                <View style={styles.modalRow}>
                  <Text style={styles.modalRowKey}>Date</Text>
                  <Text style={styles.modalRowValue}>18/08/2025</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalRowKey}>Sets</Text>
                  <Text style={styles.modalRowValue}>3</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalRowKey}>Reps</Text>
                  <Text style={styles.modalRowValue}>12</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalRowKey}>Weight</Text>
                  <Text style={styles.modalRowValue}>20 Kg</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalRowKey}>Rest</Text>
                  <Text style={styles.modalRowValue}>60 sec</Text>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Exercises List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
      >
        <Text style={styles.dayTitle}>{day}</Text>
        <Text style={styles.text}>
          This Client workout will be updated here according to your schedule.
          Click on a workout to see full details.
        </Text>

        {exercises.map((ex, index) => (
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
        ))}
      </ScrollView>
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
});

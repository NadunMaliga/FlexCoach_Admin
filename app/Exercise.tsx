import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function Exercise() {
  const todaysWorkouts = [
    { name: "Push Ups", sets: 3, reps: 12, completed: false },
    { name: "Squats", sets: 4, reps: 10, completed: false },
    { name: "Plank", sets: 2, reps: 60 },
  ];

  const previousWorkouts = [
    { name: "Push Ups", sets: 3, reps: 12, dateFrom: "2025-08-17", completedOn: "2025-08-17" },
    { name: "Squats", sets: 4, reps: 10, dateFrom: "2025-08-16", completedOn: "2025-08-16" },
  ];

  const [todayList, setTodayList] = useState(todaysWorkouts);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);

  const toggleComplete = (index: number) => {
    setSelectedIndex(index);
    setShowModal(true);
  };

  const confirmComplete = () => {
    if (selectedIndex !== null) {
      const newList = [...todayList];
      newList[selectedIndex].completed = !newList[selectedIndex].completed;
      setTodayList(newList);
    }
    setShowModal(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      {/* Today's Workout */}
      <Text style={styles.sectionHeader}>Today's Workout</Text>
      {todayList.map((workout, index) => (
        <View style={styles.card} key={index}>
          <View style={styles.iconContainer}>
            <Ionicons name="barbell" size={25} color="white" />
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.workoutName}>{workout.name}</Text>
            <Text style={styles.details}>{workout.sets} sets x {workout.reps} reps</Text>
          </View>
          <TouchableOpacity onPress={() => toggleComplete(index)}>
            {workout.completed ? (
              <Ionicons name="checkmark-circle" size={28} color="#17ff7f" />
            ) : (
              <Ionicons name="ellipse-outline" size={28} color="white" />
            )}
          </TouchableOpacity>
        </View>
      ))}

      {/* Previous Workouts */}
      <Text style={[styles.sectionHeader, { marginTop: 30 }]}>Previous Workouts</Text>
      {previousWorkouts.map((workout, index) => (
        <View style={styles.card} key={index}>
          <View style={styles.iconContainer}>
            <Ionicons name="checkmark-done-circle" size={30} color="#17ff7f" />
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.workoutName}>{workout.name}</Text>
            <Text style={styles.details}>
              {workout.sets} sets x {workout.reps} reps
            </Text>
            <Text style={styles.previous}>
              Workout from {workout.dateFrom} | Completed on {workout.completedOn}
            </Text>
          </View>
        </View>
      ))}

      {/* Confirmation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Workout</Text>
            <Text style={styles.modalText}>Are you sure you want to mark this workout as done? 💪</Text>
            
            <View style={styles.modalButtons}>
              <Pressable style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={{ color: "white", fontWeight: "bold" }}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.confirmBtn} onPress={confirmComplete}>
                <Text style={{ color: "black", fontWeight: "bold" }}>Yes 💪</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  sectionHeader: { color: "white", fontSize: 30, fontWeight: "bold", marginBottom: 15 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 15,
  },
  iconContainer: {
    backgroundColor: "#333",
    padding: 15,
    borderRadius: 15,
    marginRight: 15,
  },
  infoContainer: { flex: 1 },
  workoutName: { color: "white", fontSize: 17, fontWeight: "bold" },
  details: { color: "gray", fontSize: 16, marginTop: 4 },
  previous: { color: "gray", fontSize: 14, marginTop: 5 },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#222",
    padding: 35,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  modalTitle: { color: "white", fontSize: 28, fontWeight: "bold", marginBottom: 10 },
  modalText: { color: "gray", fontSize: 16, marginBottom: 20 },
  modalButtons: { flexDirection: "row", justifyContent: "flex-start" },
  cancelBtn: {
    backgroundColor: "gray",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginRight: 10,
  },
  confirmBtn: {
    backgroundColor: "#ffffffff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
});

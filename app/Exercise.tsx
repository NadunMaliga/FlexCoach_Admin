import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Modal,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useRoute } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";

export default function ProfileSchedules() {
  const route = useRoute();

  const [searchText, setSearchText] = useState("");
  const [exercises, setExercises] = useState([
    {
      name: "Push Ups",
      detail: "Chest workout with body weight",
      videoUrl: "https://youtu.be/WDIpL0pjun0?si=qJt2bxbBy-6g4c1b",
    },
    {
      name: "Squats",
      detail: "Leg workout for quads and glutes",
      videoUrl: "https://www.youtube.com/watch?v=aclHkVaku9U",
    },
  ]);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ name: "", detail: "", videoUrl: "" });

  // Action Modal state
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Filter exercises
  const filteredExercises = exercises.filter((ex) =>
    ex.name.toLowerCase().includes(searchText.toLowerCase())
  );

  // Save new or edited exercise
  const addExercise = () => {
    if (!form.name.trim() || !form.detail.trim() || !form.videoUrl.trim()) return;

    if (isEditing && selectedExercise) {
      setExercises(
        exercises.map((ex) => (ex === selectedExercise ? { ...form } : ex))
      );
      setIsEditing(false);
      setSelectedExercise(null);
    } else {
      setExercises([{ ...form }, ...exercises]);
    }

    setForm({ name: "", detail: "", videoUrl: "" });
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        stickyHeaderIndices={[0]}
      >
        {/* Sticky Top */}
        <View style={{ backgroundColor: "#000", paddingTop: 20 }}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color="#999"
              style={{ marginRight: 8 }}
            />
            <TextInput
              placeholder="Search exercises..."
              placeholderTextColor="#999"
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          {/* Description */}
          <Text style={styles.text}>
            This Client workout will be updated here according to your schedule.
          </Text>
        </View>

        {/* Exercises List */}
        {filteredExercises.map((ex, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => {
              setSelectedExercise(ex);
              setActionModalVisible(true);
            }}
          >
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
                <Text style={styles.dateRange}>
                  {ex.detail.length > 25
                    ? ex.detail.substring(0, 25) + "..."
                    : ex.detail}
                </Text>
              </View>

              <View style={styles.rightContainer}>
                <TouchableOpacity
                  onPress={() => Linking.openURL(ex.videoUrl)}
                  style={{ marginRight: 10 }}
                >
                  <Ionicons name="logo-youtube" size={24} color="#d5ff5f" />
                </TouchableOpacity>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {filteredExercises.length === 0 && (
          <Text style={styles.noDataText}>No exercises found.</Text>
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.addbutton}
        onPress={() => {
          setModalVisible(true);
          setIsEditing(false);
          setForm({ name: "", detail: "", videoUrl: "" });
        }}
      >
        <Ionicons name="add-circle-outline" size={40} color="#626161ff" />
      </TouchableOpacity>

      {/* Add/Edit Exercise Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeader}>
                {isEditing ? "Edit Exercise" : "Add Exercise"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="white" />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Exercise Name"
              placeholderTextColor="#999"
              style={styles.modalInput}
              value={form.name}
              onChangeText={(t) => setForm({ ...form, name: t })}
            />
            <TextInput
              placeholder="YouTube Link"
              placeholderTextColor="#999"
              style={styles.modalInput}
              value={form.videoUrl}
              onChangeText={(t) => setForm({ ...form, videoUrl: t })}
            />
            <TextInput
              placeholder="Description"
              placeholderTextColor="#999"
              style={[styles.modalInput, styles.textArea]}
              value={form.detail}
              onChangeText={(t) => setForm({ ...form, detail: t })}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity style={styles.saveButton} onPress={addExercise}>
              <Text style={styles.saveButtonText}>
                {isEditing ? "Update Exercise" : "Save Exercise"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Action Modal (Edit/Delete) */}
      <Modal visible={actionModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer2}>
          <View style={styles.actionBox}>
 
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => {
                setIsEditing(true);
                setForm(selectedExercise);
                setActionModalVisible(false);
                setModalVisible(true);
              }}
            >
              <Text style={styles.optionText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => {
                setExercises(exercises.filter((e) => e !== selectedExercise));
                setSelectedExercise(null);
                setActionModalVisible(false);
              }}
            >
              <Text style={[styles.optionText, { color: "#a2a1a1ff" }]}>Delete</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => setActionModalVisible(false)}
            >
              <Text style={styles.optionText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// -------------------- Styles --------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  text: {
    color: "#777",
    textAlign: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1c1c1c",
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 30,
    marginBottom: 15,
  },
  searchInput: { flex: 1, color: "#fff", fontSize: 17 },
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
    backgroundColor: "#3a3a3a",
    padding: 19,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  infoContainer: { flex: 1, marginLeft: 15 },
  title: { fontSize: 19, color: "#fff" },
  dateRange: { fontSize: 14, color: "#999" },
  rightContainer: { flexDirection: "row", alignItems: "center" },
  noDataText: { color: "#999", textAlign: "center", marginTop: 50 },
  addbutton: {
    position: "absolute",
    bottom: 150,
    right: 20,
    backgroundColor: "#dcff7c",
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
    modalContainer2: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
  },
  modalBox: {
    backgroundColor: "#1c1c1c",
    paddingVertical: 50,
    paddingHorizontal: 30,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 35,
  },
  modalHeader: { fontSize: 25, color: "#fff", fontWeight: "500" },
  modalInput: {
    backgroundColor: "#292929",
    fontSize: 15,
    color: "#fff",
    borderRadius: 30,
    padding: 16,
    marginBottom: 12,
  },
  textArea: {
    height: 120,
    borderRadius: 20,
    paddingTop: 15,
    paddingHorizontal: 18,
  },
  saveButton: {
    backgroundColor: "#d5ff5f",
    padding: 20,
    borderRadius: 50,
    alignItems: "center",
    marginTop: 20,
  },
  saveButtonText: { fontSize: 18, fontWeight: "400", color: "#000" },

   actionBox: {
    backgroundColor: "#1c1c1c",
    padding: 20,
    margin: 40,
    borderRadius: 30,
    alignItems: "center",
  }, 
  optionButton: {
    paddingVertical: 10,
    width: "100%",
    alignItems: "center",
    },
  optionText: {
    fontSize: 18,
    color: "#a2a1a1ff",
  },
});

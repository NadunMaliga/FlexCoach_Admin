import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

export default function Foods() {
  const [searchText, setSearchText] = useState("");
  const [foods, setFoods] = useState([
    { name: "Rice" },
    { name: "Chicken Curry" },
    { name: "Salad" },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ name: "" });

  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Filter foods
  const filteredFoods = foods.filter((f) =>
    f.name.toLowerCase().includes(searchText.toLowerCase())
  );

  // Add or update food
  const addFood = () => {
    if (!form.name.trim()) return;

    if (isEditing && selectedFood) {
      setFoods(foods.map((f) => (f === selectedFood ? { ...form } : f)));
      setIsEditing(false);
      setSelectedFood(null);
    } else {
      setFoods([{ ...form }, ...foods]);
    }

    setForm({ name: "" });
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
              placeholder="Search foods..."
              placeholderTextColor="#999"
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          {/* Description */}
          <Text style={styles.text}>
                    This client’s diet plan / foods will be updated here according to your schedule.

          </Text>
        </View>

        {/* Foods List */}
        {filteredFoods.map((f, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => {
              setSelectedFood(f);
              setActionModalVisible(true);
            }}
          >
            <View style={styles.card}>
              

              <View style={styles.infoContainer}>
                <Text style={styles.title}>{f.name}</Text>
              </View>

              <View style={styles.rightContainer}>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {filteredFoods.length === 0 && (
          <Text style={styles.noDataText}>No foods found.</Text>
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.addbutton}
        onPress={() => {
          setModalVisible(true);
          setIsEditing(false);
          setForm({ name: "" });
        }}
      >
        <Ionicons name="add-circle-outline" size={40} color="#626161ff" />
      </TouchableOpacity>

      {/* Add/Edit Food Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeader}>
                {isEditing ? "Edit Food" : "Add Food"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="white" />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Food Name"
              placeholderTextColor="#999"
              style={styles.modalInput}
              value={form.name}
              onChangeText={(t) => setForm({ ...form, name: t })}
            />

            <TouchableOpacity style={styles.saveButton} onPress={addFood}>
              <Text style={styles.saveButtonText}>
                {isEditing ? "Update Food" : "Save Food"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Action Modal */}
      <Modal visible={actionModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer2}>
          <View style={styles.actionBox}>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => {
                setIsEditing(true);
                setForm(selectedFood);
                setActionModalVisible(false);
                setModalVisible(true);
              }}
            >
              <Text style={styles.optionText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => {
                setFoods(foods.filter((f) => f !== selectedFood));
                setSelectedFood(null);
                setActionModalVisible(false);
              }}
            >
              <Text style={[styles.optionText, { color: "#a2a1a1ff" }]}>
                Delete
              </Text>
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

// Styles
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
     padding: 1,
    marginBottom: 15,
    justifyContent: "space-between",
  },
  iconWrapper: {
     padding: 19,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  infoContainer: { flex: 1, marginLeft: 15 },
  title: { fontSize: 19, color: "#a6a5a5ff" },
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

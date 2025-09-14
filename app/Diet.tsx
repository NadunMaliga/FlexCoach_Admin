import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function Diet() {
  const meals = [
    {
      title: "Breakfast",
      maintitle: "Oatmeal with Berries",
      description:
        "Oatmeal with fruits and nuts, high protein, very nutritious, perfect start for the day, keeps you full for longer, provides fiber, vitamins, and antioxidants. Enjoy with milk or yogurt for extra taste.",
      image:
        "https://i.pinimg.com/736x/fd/e1/07/fde107b0cca4b1799eaa4a5339f8b63d.jpg",
    },
    {
      title: "Lunch",
      maintitle: "Grilled chicken with veggies",
      description:
        "Grilled chicken with quinoa and vegetables, rich in protein and fiber, helps muscle recovery, provides essential vitamins and minerals. Great for a balanced diet and energy boost during the day.",
      image:
        "https://i.pinimg.com/1200x/15/de/2c/15de2cac5615a54813f8e0a8530c6876.jpg",
    },
    {
      title: "Dinner",
      maintitle: "Salmon with potatoes and greens",
      description:
        "Salmon with roasted potatoes and greens, high in omega-3 fatty acids, supports heart health, anti-inflammatory, provides protein and essential nutrients for recovery and good sleep.",
      image:
        "https://i.pinimg.com/1200x/e2/70/43/e270434ce58bc42971727f023cdbbc49.jpg",
    },
  ];

  const truncate = (text: string, max: number) => {
    return text.length > max ? text.substring(0, max) + "..." : text;
  };

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<any>(null);

  const openModal = (meal: any) => {
    setSelectedMeal(meal);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedMeal(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.header}>Today's Plan</Text>
        {meals.map((meal, index) => (
          <View style={styles.mealCard} key={index}>
            <View style={styles.mealText}>
              <Text style={styles.mealTitle}>{meal.title}</Text>
              <Text style={styles.mainTitle}>{truncate(meal.maintitle, 18)}</Text>
              <Text style={styles.mealDesc}>{truncate(meal.description, 40)}</Text>
              <TouchableOpacity style={styles.viewBtn} onPress={() => openModal(meal)}>
                <Text style={styles.viewBtnText}>View</Text>
              </TouchableOpacity>
            </View>
            <Image source={{ uri: meal.image }} style={styles.mealImage} />
          </View>
        ))}
      </ScrollView>

      {selectedMeal && (
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={closeModal}
        >
          <View style={styles.modalBackground}>
            <View style={styles.modalContent}>
              {/* Close Icon */}
              <TouchableOpacity style={styles.closeIcon} onPress={closeModal}>
                <Ionicons name="close-circle" size={35} color="white" />
              </TouchableOpacity>

              {/* Entire modal scrollable */}
              <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
                <Image source={{ uri: selectedMeal.image }} style={styles.modalImage} />
                <Text style={styles.modalTitle}>{selectedMeal.title}</Text>
                <Text style={styles.modalMain}>{selectedMeal.maintitle}</Text>
                <Text style={styles.modalDesc}>{selectedMeal.description}</Text>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { color: "white", fontSize: 30, fontWeight: "bold", marginBottom: 20 },

  mealCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 15,
    marginTop: 20,
    marginBottom: 15,
  },
  mealText: { flex: 1, marginRight: 10 },
  mealTitle: { color: "#a3a3a3ff", fontSize: 16, marginBottom: 5 },
  mainTitle: { color: "white", fontSize: 22, fontWeight: "bold", marginBottom: 5 },
  mealDesc: { color: "gray", fontSize: 14, marginBottom: 10 },
  viewBtn: { backgroundColor: "white", borderRadius: 20, paddingVertical: 9, paddingHorizontal: 35, alignSelf: "flex-start" },
  viewBtnText: { color: "black", fontSize: 14 },

  mealImage: { width: 120, height: 120, borderRadius: 15 },

  modalBackground: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "#82828299",
  },
  modalContent: {
    backgroundColor: "#111",
    padding: 20,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    maxHeight: "90%",
  },
  closeIcon: {
    position: "absolute",
    right: 15,
    top: 15,
    zIndex: 1,
  },
  modalImage: { width: 150, height: 150, borderRadius: 15, marginBottom: 20,marginTop:30,},
  modalTitle: { fontSize: 35, fontWeight: "bold", color: "white", marginBottom: 5 },
  modalMain: { fontSize: 18, color: "white", marginBottom: 10 },
  modalDesc: { fontSize: 16, color: "gray", marginBottom: 15, textAlign: "left" },
});

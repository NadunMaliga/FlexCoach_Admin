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

export default function AddDiet() {
  const router = useRouter();
  const totalSteps = 3;
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1
  const mealPlanOptions = ["Meal 1", "Meal 2", "Meal 3"];
  const [selectedMealPlan, setSelectedMealPlan] = useState("");
  const [mealSelectModalVisible, setMealSelectModalVisible] = useState(false);

  // Step 2
  const mealTypes = [
    "Morning",
    "Breakfast",
    "Snacks",
    "Lunch",
    "Post-Workout",
    "Dinner",
  ];
  const foodOptions = [
    "Chicken Breast",
    "Eggs",
    "Oats",
    "Banana",
    "Fish",
    "Rice",
    "Vegetables",
    "Protein Scoop",
    "Almonds",
    "Sweet Potato",
  ];

  const [addedFoods, setAddedFoods] = useState({});
  const [selectedMealType, setSelectedMealType] = useState("Breakfast");
  const [tempFood, setTempFood] = useState({ name: "", quantity: "" });
  const [foodModalVisible, setFoodModalVisible] = useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });
  if (!fontsLoaded) return null;

  const onNext = () => {
    if (currentStep === 1 && !selectedMealPlan.trim()) return;
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
    else router.back();
  };

  const onBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
    else router.back();
  };

  const addFoodToList = () => {
    if (!tempFood.name || !tempFood.quantity) return;

    setAddedFoods((prev) => {
      const updated = { ...prev };

      // Handle Snacks & Post-Workout multi-round lists
      if (selectedMealType === "Snacks" || selectedMealType === "Post-Workout") {
        const existing = updated[selectedMealType] || [];

        // If empty or last round filled, add to last group
        if (existing.length > 0) {
          existing[existing.length - 1].push({ ...tempFood });
        } else {
          // first group
          existing.push([{ ...tempFood }]);
        }
        updated[selectedMealType] = existing;
      } else {
        // Normal meal
        const list = updated[selectedMealType] || [];
        list.push({ ...tempFood });
        updated[selectedMealType] = list;
      }
      return updated;
    });

    setTempFood({ name: "", quantity: "" });
  };

  const addNewSnackOrPostWorkoutRound = () => {
    if (selectedMealType !== "Snacks" && selectedMealType !== "Post-Workout")
      return;

    setAddedFoods((prev) => {
      const updated = { ...prev };
      const existing = updated[selectedMealType] || [];
      updated[selectedMealType] = [...existing, []];
      return updated;
    });
  };

  // --- Step 1 ---
  const renderStep1 = () => (
    <>
      <Text style={styles.stepTitle}>Step 1: Select Meal Plan</Text>
      <TouchableOpacity
        style={styles.selectBox}
        onPress={() => setMealSelectModalVisible(true)}
      >
        <Text style={styles.selectText}>
          {selectedMealPlan || "Choose Meal Plan"}
        </Text>
        <Feather name="chevron-up" size={20} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={mealSelectModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMealSelectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setMealSelectModalVisible(false)}
              >
                <Feather name="x" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ marginTop: 15 }}>
              {mealPlanOptions.map((meal, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.optionItem}
                  onPress={() => {
                    setSelectedMealPlan(meal);
                    setMealSelectModalVisible(false);
                  }}
                >
                  <Text style={styles.optionText}>{meal}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );

  // --- Step 2 ---
  const renderStep2 = () => (
    <>
      <Text style={styles.stepTitle}>Step 2: Add Foods</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 15 }}
      >
        {mealTypes.map((meal) => (
          <TouchableOpacity
            key={meal}
            style={[
              styles.mealTypeBtn,
              selectedMealType === meal && { backgroundColor: "#d5ff5f" },
            ]}
            onPress={() => setSelectedMealType(meal)}
          >
            <Text
              style={{ color: selectedMealType === meal ? "black" : "#fff" }}
            >
              {meal}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.selectBox}
        onPress={() => setFoodModalVisible(true)}
      >
        <Text style={styles.selectText}>{tempFood.name || "Choose Food"}</Text>
        <Feather name="chevron-up" size={20} color="#fff" />
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Quantity (g/scoops)"
        placeholderTextColor="#999"
        value={tempFood.quantity}
        onChangeText={(t) => setTempFood({ ...tempFood, quantity: t })}
      />

      <TouchableOpacity style={styles.addBtn} onPress={addFoodToList}>
        <Text style={styles.addBtnText}>Add Food</Text>
      </TouchableOpacity>

      {(selectedMealType === "Snacks" ||
        selectedMealType === "Post-Workout") && (
        <TouchableOpacity
          style={[styles.addBtn, { marginTop: 15, borderColor: "#d5ff5f" }]}
          onPress={addNewSnackOrPostWorkoutRound}
        >
          <Text style={[styles.addBtnText, { color: "#d5ff5f" }]}>
            + Add Another {selectedMealType}
          </Text>
        </TouchableOpacity>
      )}

      <ScrollView style={{ maxHeight: 300, marginTop: 20 }}>
        {Object.keys(addedFoods).length === 0 ? (
          <Text style={{ color: "#aaa", textAlign: "center" }}>
            No foods added yet
          </Text>
        ) : (
          Object.entries(addedFoods).map(([meal, foods], i) => (
            <View key={i} style={{ marginBottom: 15 }}>
              {/* For Snacks/Post-Workout */}
              {Array.isArray(foods[0]) ? (
                foods.map((group, gIdx) => (
                  <View key={gIdx} style={{ marginBottom: 5 }}>
                    <Text
                      style={{
                        color: "#d5ff5f",
                        fontFamily: "Poppins_600SemiBold",
                        marginBottom: 3,
                      }}
                    >
                      {meal} {gIdx + 1}:
                    </Text>
                    {group.map((f, idx) => (
                      <Text
                        key={idx}
                        style={{
                          color: "#b8b5b5ff",
                          marginLeft: 10,
                          marginBottom: 2,
                        }}
                      >
                        • {f.name} - {f.quantity}
                      </Text>
                    ))}
                  </View>
                ))
              ) : (
                <>
                  <Text
                    style={{
                      color: "#fff",
                      fontFamily: "Poppins_600SemiBold",
                      marginBottom: 3,
                    }}
                  >
                    {meal}:
                  </Text>
                  {foods.map((f, idx) => (
                    <Text
                      key={idx}
                      style={{
                        color: "#b8b5b5ff",
                        marginLeft: 10,
                        marginBottom: 2,
                      }}
                    >
                      • {f.name} - {f.quantity}
                    </Text>
                  ))}
                </>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Food modal */}
      <Modal
        visible={foodModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFoodModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setFoodModalVisible(false)}>
                <Feather name="x" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ marginTop: 15 }}>
              {foodOptions.map((food, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.optionItem}
                  onPress={() => {
                    setTempFood({ ...tempFood, name: food });
                    setFoodModalVisible(false);
                  }}
                >
                  <Text style={styles.optionText}>{food}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );

  // --- Step 3 ---
  const renderStep3 = () => (
    <>
      <Text style={styles.stepTitle}>Step 3: Preview & Confirm</Text>
      <ScrollView style={{ maxHeight: 500, marginBottom: 15 }}>
        {Object.entries(addedFoods).map(([meal, foods], i) => (
          <View key={i} style={{ marginBottom: 15 }}>
            {Array.isArray(foods[0]) ? (
              foods.map((group, gIdx) => (
                <View key={gIdx} style={{ marginBottom: 5 }}>
                  <Text
                    style={{
                      color: "#d5ff5f",
                      fontFamily: "Poppins_600SemiBold",
                      marginBottom: 3,
                    }}
                  >
                    {meal} {gIdx + 1}:
                  </Text>
                  {group.map((f, idx) => (
                    <Text
                      key={idx}
                      style={{
                        color: "#b8b5b5ff",
                        marginLeft: 10,
                        marginBottom: 2,
                      }}
                    >
                      • {f.name} - {f.quantity}
                    </Text>
                  ))}
                </View>
              ))
            ) : (
              <>
                <Text
                  style={{
                    color: "#fff",
                    fontFamily: "Poppins_600SemiBold",
                    marginBottom: 3,
                  }}
                >
                  {meal}:
                </Text>
                {foods.map((f, idx) => (
                  <Text
                    key={idx}
                    style={{
                      color: "#b8b5b5ff",
                      marginLeft: 10,
                      marginBottom: 2,
                    }}
                  >
                    • {f.name} - {f.quantity}
                  </Text>
                ))}
              </>
            )}
          </View>
        ))}
      </ScrollView>
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
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={{ padding: 5 }}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Diet</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 5 }}>
          <Feather name="x" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

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

      <ScrollView
        contentContainerStyle={{ padding: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        {renderStep()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextBtn} onPress={onNext}>
          <Text style={styles.nextBtnText}>
            {currentStep === totalSteps ? "Confirm" : "Next"}
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
  },
  headerTitle: { color: "white", fontSize: 23 },
  stepIndicator: { paddingHorizontal: 20, marginBottom: 10 },
  stepTrack: { height: 6, backgroundColor: "#333", borderRadius: 3 },
  stepProgress: { height: 6, backgroundColor: "#d5ff5f", borderRadius: 3 },
  stepText: { color: "#aaa", marginTop: 10, fontSize: 13 },
  stepTitle: { fontSize: 22, color: "#fff", marginBottom: 15 },
  input: {
    backgroundColor: "#1d1d1dff",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 15,
    color: "white",
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
    width: 220,
    padding: 15,
    borderRadius: 30,
    alignItems: "center",
    alignSelf: "center",
  },
  addBtnText: { color: "white", fontWeight: "600" },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#d5ff5f",
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
    marginHorizontal: 20,
  },
  nextBtnText: { fontSize: 18, color: "#fff", textAlign: "center" },
  mealTypeBtn: {
    backgroundColor: "#3a3a3a",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 10,
  },
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

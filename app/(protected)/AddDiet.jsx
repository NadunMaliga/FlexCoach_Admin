import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

// Safe API import
let ApiService = null;
try {
  ApiService = require("../services/api").default;
} catch (error) {
  console.error("Failed to import ApiService:", error);
}

export default function AddDiet() {
  const router = useRouter();
  const { userId } = useLocalSearchParams();
  const totalSteps = 3;
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1 - Meal Plan Selection
  const mealPlanOptions = ["Meal 1", "Meal 2", "Meal 3"];
  const [selectedMealPlan, setSelectedMealPlan] = useState("");
  const [mealSelectModalVisible, setMealSelectModalVisible] = useState(false);

  // Step 2 - Food Selection
  const mealTypes = ["Morning", "Breakfast", "Snacks", "Lunch", "Post-Workout", "Dinner"];
  const [foodOptions, setFoodOptions] = useState([
    "Chicken Breast", "Eggs", "Oats", "Banana", "Fish", 
    "Rice", "Vegetables", "Protein Scoop", "Almonds", "Sweet Potato"
  ]);
  const [loadingFoods, setLoadingFoods] = useState(false);
  const [addedFoods, setAddedFoods] = useState({});
  const [selectedMealType, setSelectedMealType] = useState("Breakfast");
  const [tempFood, setTempFood] = useState({ name: "", quantity: "" });
  const [foodModalVisible, setFoodModalVisible] = useState(false);

  // State for existing meal plans
  const [existingMealPlans, setExistingMealPlans] = useState([]);

  // Load foods and existing meal plans from database
  const loadFoods = async () => {
    if (!ApiService) return;
    
    try {
      setLoadingFoods(true);
      const response = await ApiService.getFoods({
        limit: 100,
        sortBy: 'name',
        sortOrder: 'asc'
      });
      
      if (response.success && response.foods) {
        const foodNames = response.foods.map(food => food.name);
        setFoodOptions(foodNames);
        console.log(`Loaded ${foodNames.length} foods from database`);
      }
    } catch (error) {
      console.error('Error loading foods:', error);
    } finally {
      setLoadingFoods(false);
    }
  };

  const loadExistingMealPlans = async () => {
    if (!ApiService) return;
    
    try {
      const validUserId = userId || "68e8fd08e8d1859ebd9edd05";
      const response = await ApiService.getUserDietPlans(validUserId);
      
      if (response.success && response.dietPlans) {
        const existingNames = response.dietPlans.map(plan => plan.name);
        setExistingMealPlans(existingNames);
        console.log('Existing meal plans:', existingNames);
      }
    } catch (error) {
      console.error('Error loading existing meal plans:', error);
    }
  };

  useEffect(() => {
    loadFoods();
    loadExistingMealPlans();
  }, []);

  const onNext = async () => {
    if (currentStep === 1 && !selectedMealPlan.trim()) {
      Alert.alert("Error", "Please select a meal plan");
      return;
    }
    if (currentStep === 2 && Object.keys(addedFoods).length === 0) {
      Alert.alert("Error", "Please add at least one meal");
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      await saveDietPlan();
    }
  };

  const onBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
    else router.back();
  };

  const addFoodToList = () => {
    if (!tempFood.name || !tempFood.quantity) return;

    setAddedFoods((prev) => {
      const updated = { ...prev };
      const list = updated[selectedMealType] || [];
      list.push({ ...tempFood });
      updated[selectedMealType] = list;
      return updated;
    });

    setTempFood({ name: "", quantity: "" });
  };

  const saveDietPlan = async () => {
    if (!ApiService) {
      Alert.alert("Error", "API service not available");
      return;
    }

    try {
      setLoading(true);

      const meals = [];
      let totalCalories = 0;

      Object.entries(addedFoods).forEach(([mealType, foods]) => {
        const mealCalories = foods.reduce((sum, food) => {
          // Try to extract numbers from quantity for calorie calculation
          const numericValue = parseInt(food.quantity) || 0;
          return sum + numericValue;
        }, 0);

        meals.push({
          name: mealType,
          time: mealType,
          foods: foods.map(food => {
            // Extract numeric part for quantity field, keep full text in unit field
            const numericMatch = food.quantity.match(/^\d+(\.\d+)?/);
            const numericPart = numericMatch ? parseFloat(numericMatch[0]) : 1;
            const textPart = food.quantity.replace(/^\d+(\.\d+)?\s*/, '') || 'serving';
            
            return {
              foodName: food.name,
              quantity: numericPart, // Numeric part for database
              unit: textPart || food.quantity // Full text or original input
            };
          }),
          instructions: `${mealType} meal plan`,
          totalCalories: mealCalories
        });

        totalCalories += mealCalories;
      });

      const dietTypeMapping = {
        "Meal 1": "Muscle Building",
        "Meal 2": "Maintenance",
        "Meal 3": "Weight Loss"
      };
      const dietType = dietTypeMapping[selectedMealPlan] || "Maintenance";
      const validUserId = userId || "68e8fd08e8d1859ebd9edd05";

      const dietPlanData = {
        name: selectedMealPlan,
        description: `${selectedMealPlan} with customized meals`,
        userId: validUserId,
        meals: meals,
        totalDailyCalories: totalCalories,
        dietType: dietType,
        isActive: true
      };

      console.log('Saving diet plan:', dietPlanData);

      // Check if this specific meal plan already exists for this user
      const existingPlansResponse = await ApiService.getUserDietPlans(validUserId);
      let existingPlan = null;

      if (existingPlansResponse.success && existingPlansResponse.dietPlans) {
        existingPlan = existingPlansResponse.dietPlans.find(
          plan => plan.name === selectedMealPlan
        );
      }

      let response;
      let actionMessage;

      if (existingPlan) {
        // Update existing diet plan
        console.log(`Updating existing ${selectedMealPlan} with ID: ${existingPlan._id}`);
        response = await ApiService.updateDietPlan(existingPlan._id, dietPlanData);
        actionMessage = `${selectedMealPlan} updated successfully!`;
      } else {
        // Create new diet plan
        console.log(`Creating new ${selectedMealPlan}`);
        response = await ApiService.createDietPlan(dietPlanData);
        actionMessage = `${selectedMealPlan} created successfully!`;
      }

      if (response.success) {
        Alert.alert(
          "Success",
          actionMessage,
          [
            {
              text: "OK",
              onPress: () => router.back()
            }
          ]
        );
      } else {
        Alert.alert("Error", response.error || "Failed to save diet plan");
      }

    } catch (error) {
      console.error('Save diet plan error:', error);
      Alert.alert("Error", "Failed to save diet plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View>
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
    </View>
  );

  const renderStep2 = () => (
    <View>
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
            <Text style={{ color: selectedMealType === meal ? "black" : "#fff" }}>
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
        <Feather name="chevron-down" size={20} color="#fff" />
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Quantity (e.g., 2 cups, 150g, 1 piece)"
        placeholderTextColor="#999"
        value={tempFood.quantity}
        onChangeText={(t) => setTempFood({ ...tempFood, quantity: t })}
      />

      <TouchableOpacity style={styles.addBtn} onPress={addFoodToList}>
        <Text style={styles.addBtnText}>Add Food</Text>
      </TouchableOpacity>

      <ScrollView style={{ maxHeight: 200, marginTop: 20 }}>
        {Object.keys(addedFoods).length === 0 ? (
          <Text style={{ color: "#aaa", textAlign: "center" }}>
            No foods added yet
          </Text>
        ) : (
          Object.entries(addedFoods).map(([meal, foods], i) => (
            <View key={i} style={{ marginBottom: 15 }}>
              <Text style={{ color: "#fff", fontWeight: "600", marginBottom: 3 }}>
                {meal}:
              </Text>
              {foods.map((f, idx) => (
                <Text
                  key={idx}
                  style={{ color: "#b8b5b5ff", marginLeft: 10, marginBottom: 2 }}
                >
                  • {f.name} - {f.quantity}
                </Text>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={foodModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFoodModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>
                Select Food
              </Text>
              <TouchableOpacity onPress={() => setFoodModalVisible(false)}>
                <Feather name="x" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ marginTop: 15 }}>
              {loadingFoods ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#d5ff5f" />
                  <Text style={{ color: '#fff', marginTop: 10 }}>Loading foods...</Text>
                </View>
              ) : (
                foodOptions.map((food, idx) => (
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
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );

  const renderStep3 = () => (
    <View>
      <Text style={styles.stepTitle}>Step 3: Preview & Confirm</Text>
      <ScrollView style={{ maxHeight: 400, marginBottom: 15 }}>
        <Text style={{ color: '#d5ff5f', fontSize: 16, marginBottom: 10 }}>
          Selected Plan: {selectedMealPlan}
        </Text>
        {Object.entries(addedFoods).map(([meal, foods], i) => (
          <View key={i} style={{ marginBottom: 15 }}>
            <Text style={{ color: "#fff", fontWeight: "600", marginBottom: 3 }}>
              {meal}:
            </Text>
            {foods.map((f, idx) => (
              <Text
                key={idx}
                style={{ color: "#b8b5b5ff", marginLeft: 10, marginBottom: 2 }}
              >
                • {f.name} - {f.quantity}
              </Text>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      default: return renderStep1();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />

      <View style={styles.stepIndicator}>
        <View style={styles.stepTrack}>
          <View
            style={[
              styles.stepProgress,
              { width: `${(currentStep / totalSteps) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.stepText}>Step {currentStep} of {totalSteps}</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        {renderStep()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, loading && styles.disabledBtn]}
          onPress={onNext}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.nextBtnText}>
              {currentStep === totalSteps ? "Confirm" : "Next"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
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
  disabledBtn: { opacity: 0.6 },
});
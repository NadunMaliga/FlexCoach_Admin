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
  ActivityIndicator,
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
  View
} from "react-native";
import ApiService from '../services/api';
import Logger from '../utils/logger';
import LoadingGif from '../components/LoadingGif';
import HapticFeedback from '../utils/haptics';
import { showAlert, showSuccess, showError } from '../utils/customAlert';


// Safe API import
let OfflineApiService = null;
try {
  OfflineApiService = require("../services/OfflineApiService").default;
} catch (error) {
  Logger.error("Failed to import OfflineApiService:", error);
}

export default function AddDiet() {
  const router = useRouter();
  const { userId, dietId, mode } = useLocalSearchParams();
  const isEditMode = mode === 'edit' && !!dietId; // Convert to boolean
  const totalSteps = 3;
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(isEditMode); // Start loading if in edit mode

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });

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

  // Error states
  const [step1Error, setStep1Error] = useState('');
  const [step2Error, setStep2Error] = useState('');
  const [step3Error, setStep3Error] = useState('');
  const [foodAddError, setFoodAddError] = useState('');
  const [saveError, setSaveError] = useState(null);

  // Saving state
  const [saving, setSaving] = useState(false);

  // Load foods and existing meal plans from database
  const loadFoods = async () => {
    if (!ApiService) return;

    try {
      setLoadingFoods(true);
      const response = await OfflineApiService.getFoods({
        limit: 100,
        sortBy: 'name',
        sortOrder: 'asc'
      });

      if (response.success && response.foods) {
        const foodNames = response.foods.map(food => food.name);
        setFoodOptions(foodNames);
        Logger.log(`Loaded ${foodNames.length} foods from database`);
      }
    } catch (error) {
      Logger.error('Error loading foods:', error);
    } finally {
      setLoadingFoods(false);
    }
  };

  const loadExistingMealPlans = async () => {
    if (!ApiService) return;

    try {
      const validUserId = userId || "68e8fd08e8d1859ebd9edd05";
      const response = await OfflineApiService.getUserDietPlans(validUserId);

      if (response.success && response.dietPlans) {
        const existingNames = response.dietPlans.map(plan => plan.name);
        setExistingMealPlans(existingNames);
        Logger.log('Existing meal plans:', existingNames);
      }
    } catch (error) {
      Logger.error('Error loading existing meal plans:', error);
    }
  };

  useEffect(() => {
    loadFoods();
    loadExistingMealPlans();

    // Load existing diet data if in edit mode
    if (isEditMode) {
      loadDietForEdit();
    }
  }, []);

  // Load existing diet data for editing
  const loadDietForEdit = async () => {
    if (!ApiService || !dietId) return;

    try {
      setLoading(true);
      Logger.log('Loading diet for edit, dietId:', dietId);

      const response = await OfflineApiService.getUserDietPlans(userId);

      if (response.success && response.dietPlans) {
        const dietToEdit = response.dietPlans.find(d => d._id === dietId);

        if (dietToEdit) {
          Logger.log('Found diet to edit:', dietToEdit);

          // Set meal plan name
          setSelectedMealPlan(dietToEdit.name || '');

          // Transform meals back to addedFoods format (array of food objects)
          const transformedFoods = {};
          dietToEdit.meals.forEach(meal => {
            const foodList = meal.foods.map(food => {
              // Reconstruct the quantity string from quantity + unit
              let quantityStr;
              if (food.unit && food.unit !== 'serving' && food.unit !== '') {
                quantityStr = `${food.quantity} ${food.unit}`;
              } else {
                quantityStr = `${food.quantity}`;
              }

              return {
                name: food.foodName,
                quantity: quantityStr
              };
            });

            transformedFoods[meal.time] = foodList;
          });

          setAddedFoods(transformedFoods);
          Logger.log('Loaded foods for editing:', transformedFoods);
        } else {
          Logger.error('Diet not found with ID:', dietId);
          showAlert('Error', 'Diet plan not found');
          router.back();
        }
      }
    } catch (error) {
      Logger.error('Error loading diet for edit:', error);
      showAlert('Error', 'Failed to load diet plan');
    } finally {
      setLoading(false);
    }
  };

  const onNext = async () => {
    // Clear previous errors
    setStep1Error('');
    setStep2Error('');
    setStep3Error('');
    setSaveError(null);

    // Step 1 validation
    if (currentStep === 1) {
      if (!selectedMealPlan.trim()) {
        setStep1Error('Please select a meal plan');
        HapticFeedback.error();
        return;
      }
    }

    // Step 2 validation
    if (currentStep === 2) {
      if (Object.keys(addedFoods).length === 0) {
        setStep2Error('Please add at least one meal');
        HapticFeedback.error();
        return;
      }
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      HapticFeedback.light();
    } else {
      await saveDietPlan();
    }
  };

  const onBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      HapticFeedback.light();
    } else {
      router.back();
    }
  };

  const addFoodToList = () => {
    // Clear previous error
    setFoodAddError('');

    // Validate required fields
    if (!tempFood.name) {
      setFoodAddError('Please select a food item');
      HapticFeedback.error();
      return;
    }
    if (!tempFood.quantity.trim()) {
      setFoodAddError('Please enter quantity');
      HapticFeedback.error();
      return;
    }

    setAddedFoods((prev) => {
      const updated = { ...prev };
      const list = updated[selectedMealType] || [];
      list.push({ ...tempFood });
      updated[selectedMealType] = list;
      return updated;
    });

    setTempFood({ name: "", quantity: "" });
    setStep2Error('');
    HapticFeedback.success();
  };

  const saveDietPlan = async () => {
    if (!ApiService) {
      showAlert('Error', 'API service not available');
      return;
    }

    try {
      setSaving(true);

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
            const numericPart = numericMatch ? (parseFloat(numericMatch[0]) || 0) : 1;
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

      Logger.log('Saving diet plan:', dietPlanData);

      let response;
      let actionMessage;

      if (isEditMode && dietId) {
        // Update existing diet plan (edit mode)
        Logger.log(`Updating diet plan with ID: ${dietId}`);
        response = await OfflineApiService.updateDietPlan(dietId, dietPlanData);
        actionMessage = `${selectedMealPlan} updated successfully!`;
      } else {
        // Check if this specific meal plan already exists for this user
        const existingPlansResponse = await OfflineApiService.getUserDietPlans(validUserId);
        let existingPlan = null;

        if (existingPlansResponse.success && existingPlansResponse.dietPlans) {
          existingPlan = existingPlansResponse.dietPlans.find(
            plan => plan.name === selectedMealPlan
          );
        }

        if (existingPlan) {
          // Update existing diet plan (found by name)
          Logger.log(`Updating existing ${selectedMealPlan} with ID: ${existingPlan._id}`);
          response = await OfflineApiService.updateDietPlan(existingPlan._id, dietPlanData);
          actionMessage = `${selectedMealPlan} updated successfully!`;
        } else {
          // Create new diet plan
          Logger.log(`Creating new ${selectedMealPlan}`);
          response = await OfflineApiService.createDietPlan(dietPlanData);
          actionMessage = `${selectedMealPlan} created successfully!`;
        }
      }

      if (response.success) {
        HapticFeedback.success();
        showSuccess(actionMessage);
        router.back();
      } else {
        setSaveError(response.error || "Failed to save diet plan");
        HapticFeedback.error();
      }

    } catch (error) {
      Logger.error('Save diet plan error:', error);
      setSaveError('Failed to save diet plan. Please try again.');
      HapticFeedback.error();
    } finally {
      setSaving(false);
    }
  };

  const renderStep1 = () => (
    <View>
      <Text style={styles.stepTitle}>Step 1: Select Meal Plan</Text>
 

      <TouchableOpacity
        style={styles.selectBox}
        onPress={() => {
          setMealSelectModalVisible(true);
          setStep1Error('');
        }}
      >
        <Text style={styles.selectText}>
          {selectedMealPlan || "Choose Meal Plan"}
        </Text>
        <Feather name="chevron-up" size={20} color="#fff" />
        
      </TouchableOpacity>

      <Text style={styles.text}>
        Select one of the 3 meal slots. If a meal already exists, it will be replaced with your new plan.
      </Text>
      {/* Error Message */}
      {step1Error ? (
        <Text style={styles.errorMessage}>{step1Error}</Text>
      ) : null}

      <Modal
        visible={mealSelectModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMealSelectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <TouchableOpacity
              style={styles.modalCloseIcon}
              onPress={() => setMealSelectModalVisible(false)}
            >
              <Text style={{ color: "white", fontSize: 20 }}>✕</Text>
            </TouchableOpacity>
            <ScrollView
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalTitle}>Select Meal</Text>
              <Text style={styles.modalSub}>Choose one of the 3 meals for this client</Text>
              {mealPlanOptions.map((meal, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.modalRow}
                  onPress={() => {
                    setSelectedMealPlan(meal);
                    setMealSelectModalVisible(false);
                    setStep1Error('');
                    HapticFeedback.light();
                  }}
                >
                  <Text style={styles.modalRowKey}>{meal}</Text>
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
            <Text style={{ color: selectedMealType === meal ? "black" : "#fff", fontFamily: "Poppins_400Regular" }}>
              {meal}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.selectBox}
        onPress={() => {
          setFoodModalVisible(true);
          setFoodAddError('');
        }}
      >
        <Text style={styles.selectText}>{tempFood.name || "Choose Food"}</Text>
        <Feather name="chevron-down" size={20} color="#fff" />
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Quantity (e.g., 2 cups, 150g, 1 piece)"
        placeholderTextColor="#999"
        value={tempFood.quantity}
        onChangeText={(t) => {
          setTempFood({ ...tempFood, quantity: t });
          setFoodAddError('');
        }}
      />

      {/* Food Add Error Message */}
      {foodAddError ? (
        <Text style={styles.errorMessage}>{foodAddError}</Text>
      ) : null}

      <TouchableOpacity style={styles.addBtn} onPress={addFoodToList}>
        <Text style={styles.addBtnText}>Add Food</Text>
      </TouchableOpacity>

      {/* Step 2 Error Message */}
      {step2Error ? (
        <Text style={[styles.errorMessage, { marginTop: 15 }]}>{step2Error}</Text>
      ) : null}

      <ScrollView style={{ maxHeight: 200, marginTop: 20 }} showsVerticalScrollIndicator={true}>
        {Object.keys(addedFoods).length === 0 ? (
          <Text style={{ color: "#aaa", textAlign: "center", fontFamily: "Poppins_400Regular" }}>
            No foods added yet
          </Text>
        ) : (
          Object.entries(addedFoods).map(([meal, foods], i) => (
            <View key={i} style={{ marginBottom: 15 }}>
              <Text style={{ color: "#fff", fontWeight: "600", marginBottom: 3, fontFamily: "Poppins_400Regular" }}>
                {meal}:
              </Text>
              {foods.map((f, idx) => (
                <View
                  key={idx}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginLeft: 10,
                    marginBottom: 5,
                    backgroundColor: "#2a2a2a",
                    padding: 8,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: "#b8b5b5ff", flex: 1, fontFamily: "Poppins_400Regular" }}>
                    • {f.name} - {f.quantity}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <TouchableOpacity
                      onPress={() => {
                        // Edit food item
                        setTempFood({ name: f.name, quantity: f.quantity });
                        setSelectedMealType(meal);
                        // Remove the item so it can be re-added after editing
                        setAddedFoods((prev) => {
                          const updated = { ...prev };
                          updated[meal] = updated[meal].filter((_, i) => i !== idx);
                          if (updated[meal].length === 0) {
                            delete updated[meal];
                          }
                          return updated;
                        });
                        setStep2Error('');
                        setFoodAddError('');
                        HapticFeedback.light();
                      }}
                      style={{ padding: 4 }}
                    >
                      <Feather name="edit-2" size={16} color="#b8b8b8ff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        // Delete food item
                        setAddedFoods((prev) => {
                          const updated = { ...prev };
                          updated[meal] = updated[meal].filter((_, i) => i !== idx);
                          if (updated[meal].length === 0) {
                            delete updated[meal];
                          }
                          return updated;
                        });
                        setStep2Error('');
                        HapticFeedback.success();
                      }}
                      style={{ padding: 4 }}
                    >
                      <Feather name="trash-2" size={16} color="#ff8282ff" />
                    </TouchableOpacity>
                  </View>
                </View>
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
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', fontFamily: "Poppins_400Regular" }}>
                Select Food
              </Text>
              <TouchableOpacity onPress={() => setFoodModalVisible(false)}>
                <Feather name="x" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ marginTop: 15 }} showsVerticalScrollIndicator={true}>
              {loadingFoods ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <LoadingGif size={24} />
                </View>
              ) : (
                foodOptions.map((food, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.optionItem}
                    onPress={() => {
                      setTempFood({ ...tempFood, name: food });
                      setFoodModalVisible(false);
                      setFoodAddError('');
                      HapticFeedback.light();
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
 

      <ScrollView style={{ maxHeight: 400, marginBottom: 15 }} showsVerticalScrollIndicator={true}>
        <Text style={{ color: '#dfdfdfff', fontSize: 16, marginBottom: 10, fontFamily: "Poppins_400Regular" }}>
          Selected Plan: {selectedMealPlan}
        </Text>
        {Object.entries(addedFoods).map(([meal, foods], i) => (
          <View key={i} style={{ marginBottom: 15 }}>
            <Text style={{ color: "#fff", fontWeight: "600", marginBottom: 3, fontFamily: "Poppins_400Regular" }}>
              {meal}:
            </Text>
            {foods.map((f, idx) => (
              <Text
                key={idx}
                style={{ color: "#b8b5b5ff", marginLeft: 10, marginBottom: 2, fontFamily: "Poppins_400Regular" }}
              >
                • {f.name} - {f.quantity}
              </Text>
            ))}
          </View>
        ))}
      </ScrollView>

      {/* Save Error Message */}
      {saveError ? (
        <Text style={styles.errorMessage}>{saveError}</Text>
      ) : null}
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

  if (!fontsLoaded) return null;

  // Show loading screen while fetching diet data in edit mode
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <LoadingGif size={200} />
       </View>
    );
  }

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
          {isEditMode ? 'Edit Diet' : 'Add Diet'}
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
        <Text style={styles.stepText}>Step {currentStep} of {totalSteps}</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
      >
        {renderStep()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, saving && { opacity: 0.7 }]}
          onPress={onNext}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text style={styles.nextBtnText}>
              {currentStep === totalSteps ? (isEditMode ? "Update" : "Confirm") : "Next"}
            </Text>
          )}
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
    fontSize: 19,
    fontFamily: "Poppins_300Light",
  },
  text:{
    color:"#a2a2a2ff",
    textAlign:"center",
    marginHorizontal:9, 
    fontSize: 14,
    fontFamily: "Poppins_300Light",
    marginTop:10,
    marginBottom:10,
  },
  stepIndicator: { paddingHorizontal: 20, marginBottom: 10 },
  stepTrack: { height: 6, backgroundColor: "#333", borderRadius: 3 },
  stepProgress: { height: 6, backgroundColor: "#d5ff5f", borderRadius: 3 },
  stepText: { color: "#aaa", marginTop: 10, fontSize: 13, fontFamily: "Poppins_300Light" },
  stepTitle: { fontSize: 22, color: "#fff", marginBottom: 15, fontFamily: "Poppins_300Light" },
  input: {
    backgroundColor: "#1d1d1dff",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 15,
    color: "white",
    fontSize: 16,
    marginBottom: 15,
    fontFamily: "Poppins_300Light",
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
  selectText: { color: "#fff", fontSize: 16, fontFamily: "Poppins_300Light" },
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
  addBtnText: { color: "white", fontWeight: "600", fontFamily: "Poppins_300Light" },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 25,
    paddingVertical: 20,
  },
  nextBtn: {
    backgroundColor: "#d5ff5f",
    paddingVertical: 22,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  nextBtnText: {
    fontSize: 18,
    color: "#000",
    fontFamily: "Poppins_300Light",
    textAlign: "center",
  },
  mealTypeBtn: {
    backgroundColor: "#3a3a3a",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
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
  optionText: { color: "#949191ff", fontSize: 16, fontFamily: "Poppins_300Light" },
  // Modal styles matching DietPlan
  modalBox: {
    backgroundColor: "#1c1c1c",
    paddingHorizontal: 25,
    paddingTop: 20,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    maxHeight: "45%",
  },
  modalCloseIcon: {
    alignSelf: "flex-end",
    padding: 10,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "400",
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
    marginBottom: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: "#333",
    paddingBottom: 10,
  },
  modalRowKey: {
    color: "#f5f5f5",
    fontSize: 16,
    marginBottom: 5,
    fontFamily: "Poppins_500Medium",
  },
  modalRowValue: {
    color: "#bbb",
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    lineHeight: 20,
  },
  disabledBtn: { opacity: 0.6 },
  errorMessage: {
    color: "#ff6b6b",
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    marginTop: 10,
    marginBottom: 5,
    textAlign: "center",
  },
});
// @ts-nocheck
import React from "react";
import {
  ActivityIndicator,
  Animated,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
} from "react-native";
import Logger from '../utils/logger';
import Svg, { Path } from "react-native-svg";
import OfflineApiService from "../services/OfflineApiService";
import ListSkeleton from '../components/ListSkeleton';
import LoadingGif from '../components/LoadingGif';
import { showAlert, showSuccess, showError } from '../utils/customAlert';



// SVG Icons
const SearchIcon = ({ size = 20, color = "#999" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </Svg>
);

const ChevronForwardIcon = ({ size = 20, color = "#999" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 18l6-6-6-6" />
  </Svg>
);

const AddCircleIcon = ({ size = 40, color = "#626161ff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
    <Path d="M12 8v8M8 12h8" />
  </Svg>
);

const CloseIcon = ({ size = 28, color = "white" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 6L6 18M6 6l12 12" />
  </Svg>
);

interface Food {
  _id: string;
  name: string;
  category: string;
  nutritionPer100g?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  };
  servingSize?: {
    amount?: number;
    unit?: string;
  };
  allergens?: string[];
  dietaryRestrictions?: string[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function Foods() {
  const [searchText, setSearchText] = React.useState("");
  const [foods, setFoods] = React.useState<Food[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [fadeAnim] = React.useState(new Animated.Value(1));

  const [modalVisible, setModalVisible] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    category: "Protein" as const,
    nutritionPer100g: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0
    }
  });
  const [saving, setSaving] = React.useState(false);

  const [actionModalVisible, setActionModalVisible] = React.useState(false);
  const [selectedFood, setSelectedFood] = React.useState<Food | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);

  React.useEffect(() => {
    loadFoods();
  }, []);

  const loadFoods = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fade out while loading
      if (foods.length > 0) {
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 150,
          useNativeDriver: true,
        }).start();
      }

      const response = await OfflineApiService.getFoods({ limit: 100 });
      if (response.success) {
        setFoods(response.foods);

        // Fade in with loaded data
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else {
        setError('Failed to load foods');
      }
    } catch (err) {
      Logger.error('Load foods error:', err);
      setError('Failed to load foods');
      // Restore opacity on error
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } finally {
      setLoading(false);
    }
  };

  // Filter foods
  const filteredFoods = foods.filter((f) =>
    f.name.toLowerCase().includes(searchText.toLowerCase())
  );

  // Add or update food
  const addFood = async () => {
    if (!form.name.trim()) {
      showAlert('Error', 'Please enter a food name');
      return;
    }

    try {
      setSaving(true);
      Logger.log('Sending food data:', form);

      if (isEditing && selectedFood) {
        const response = await OfflineApiService.updateFood(selectedFood._id, form);
        if (response.success) {
          await loadFoods(); // Reload foods
          showAlert('Success', 'Food updated successfully');
        } else {
          showAlert('Error', 'Failed to update food');
        }
      } else {
        Logger.log('Creating new food with data:', form);
        const response = await OfflineApiService.createFood(form);
        if (response.success) {
          await loadFoods(); // Reload foods
          showAlert('Success', 'Food created successfully');
        } else {
          showAlert('Error', 'Failed to create food');
        }
      }

      setForm({
        name: "",
        category: "Protein",
        nutritionPer100g: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0
        }
      });
      setModalVisible(false);
      setIsEditing(false);
      setSelectedFood(null);
    } catch (error) {
      Logger.error('Save food error:', error);
      showAlert('Error', 'Failed to save food');
    } finally {
      setSaving(false);
    }
  };

  const deleteFood = async (food: Food) => {
    try {
      const response = await OfflineApiService.deleteFood(food._id);
      if (response.success) {
        await loadFoods(); // Reload foods
        showAlert('Success', 'Food deleted successfully');
      } else {
        showAlert('Error', 'Failed to delete food');
      }
    } catch (error) {
      Logger.error('Delete food error:', error);
      showAlert('Error', 'Failed to delete food');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <LoadingGif size={200} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#ff6b6b', textAlign: 'center', margin: 20 }}>
          {error}
        </Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={loadFoods}
        >
          <Text style={styles.saveButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        stickyHeaderIndices={[0]}
      >
        {/* Sticky Top */}
        <View style={{ backgroundColor: "#000", paddingTop: 20 }}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <SearchIcon size={20} color="#999" />
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
                <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
                  {f.name.length > 10 ? f.name.substring(0, 10) + '...' : f.name}
                </Text>
                <Text style={styles.dateRange} numberOfLines={1} ellipsizeMode="tail">
                  {f.category.length > 18 ? f.category.substring(0, 18) + '...' : f.category}
                </Text>
              </View>

              <View style={styles.rightContainer}>
                <ChevronForwardIcon size={20} color="#999" />
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {filteredFoods.length === 0 && (
          <Text style={styles.noDataText}>No foods found.</Text>
        )}
      </Animated.ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.addbutton}
        onPress={() => {
          setModalVisible(true);
          setIsEditing(false);
          setForm({
            name: "",
            category: "Protein",
            nutritionPer100g: {
              calories: 0,
              protein: 0,
              carbs: 0,
              fat: 0,
              fiber: 0
            }
          });
        }}
      >
        <Text style={styles.addBtnText}>+</Text>
      </TouchableOpacity>

      {/* Add/Edit Food Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          >
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <ScrollView
                contentContainerStyle={styles.modalScrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.modalBox}>
                  <View style={styles.modalHeaderRow}>
                    <Text style={styles.modalHeader}>
                      {isEditing ? "Edit Food" : "Add Food"}
                    </Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                      <CloseIcon size={28} color="white" />
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    placeholder="Food Name"
                    placeholderTextColor="#999"
                    style={styles.modalInput}
                    value={form.name}
                    onChangeText={(t) => setForm({ ...form, name: t })}
                  />

                  {/* Category Picker */}
                  <View style={styles.modalInput}>
                    <Text style={{ color: '#999', marginBottom: 10 }}>Category</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {['Protein', 'Carbohydrates', 'Vegetables', 'Fruits', 'Dairy', 'Fats', 'Beverages', 'Snacks'].map((category) => (
                        <TouchableOpacity
                          key={category}
                          style={[
                            styles.categoryButton,
                            form.category === category && styles.categoryButtonActive
                          ]}
                          onPress={() => setForm({ ...form, category: category as any })}
                        >
                          <Text style={[
                            styles.categoryText,
                            form.category === category && styles.categoryTextActive
                          ]}>
                            {category}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <TouchableOpacity
                    style={[styles.saveButton, saving && { opacity: 0.7 }]}
                    onPress={addFood}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <Text style={styles.saveButtonText}>
                        {isEditing ? "Update Food" : "Save Food"}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Action Modal */}
      <Modal visible={actionModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer2}>
          <View style={styles.actionBox}>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => {
                setIsEditing(true);
                if (selectedFood) {
                  setForm({
                    name: selectedFood.name,
                    category: selectedFood.category as any,
                    nutritionPer100g: {
                      calories: selectedFood.nutritionPer100g?.calories || 0,
                      protein: selectedFood.nutritionPer100g?.protein || 0,
                      carbs: selectedFood.nutritionPer100g?.carbs || 0,
                      fat: selectedFood.nutritionPer100g?.fat || 0,
                      fiber: selectedFood.nutritionPer100g?.fiber || 0
                    }
                  });
                }
                setActionModalVisible(false);
                setModalVisible(true);
              }}
            >
              <Text style={styles.optionText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => {
                Alert.alert(
                  'Delete Food',
                  'Are you sure you want to delete this food?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => {
                        if (selectedFood) deleteFood(selectedFood);
                        setActionModalVisible(false);
                      }
                    }
                  ]
                );
              }}
            >
              <Text style={[styles.optionText, { color: "#ff6b6b" }]}>
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
    backgroundColor: "#161616ff",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 15,
    marginTop: -5,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 17,
    paddingVertical: 5,
    fontFamily: "Poppins_300Light",
  },
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
  title: { fontSize: 19, color: "#a6a5a5ff", fontFamily: "Poppins_300Light" },
  dateRange: { fontSize: 14, color: "#999", fontFamily: "Poppins_300Light" },
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
  addBtnText: {
    fontSize: 40,
    color: "black",
    fontWeight: "300",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  modalContainer2: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
  },
  modalBox: {
    backgroundColor: "#0b0b0bff",
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
  modalHeader: { fontSize: 25, color: "#fff", fontWeight: "500", fontFamily: "Poppins_300Light" },
  modalInput: {
    backgroundColor: "#161616ff",
    fontSize: 15,
    color: "#fff",
    borderRadius: 15,
    padding: 16,
    paddingLeft: 20,
    marginBottom: 11,
    fontFamily: "Poppins_300Light",
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
  saveButtonText: { fontSize: 18, fontWeight: "400", color: "#000", fontFamily: "Poppins_300Light" },
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
  categoryButton: {
    backgroundColor: "#3a3a3a",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  categoryButtonActive: {
    backgroundColor: "#e3e3e3ff",
  },
  categoryText: {
    color: "#fff",
    fontSize: 14,
  },
  categoryTextActive: {
    color: "#000",
  },
});

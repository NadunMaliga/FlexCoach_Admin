// @ts-nocheck
import { useRoute } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Alert,
  KeyboardAvoidingView,
  Linking,
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
import HapticFeedback from '../utils/haptics';


// SVG Icons
const SearchIcon = ({ size = 20, color = "#999" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </Svg>
);

const YoutubeIcon = ({ size = 24, color = "#d5ff5f" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
    <Path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
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

interface Exercise {
  _id: string;
  name: string;
  description: string;
  videoUrl: string;
  category?: string;
  difficulty?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function ProfileSchedules() {
  const route = useRoute();

  const [searchText, setSearchText] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fadeAnim] = useState(new Animated.Value(1));

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    videoUrl: ""
  });
  const [saving, setSaving] = useState(false);

  // Action Modal state
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fade out while loading
      if (exercises.length > 0) {
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 150,
          useNativeDriver: true,
        }).start();
      }

      const response = await OfflineApiService.getExercises({ limit: 100 });
      if (response.success) {
        setExercises(response.exercises);

        // Fade in with loaded data
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else {
        setError('Failed to load exercises');
      }
    } catch (err) {
      Logger.error('Load exercises error:', err);
      setError('Failed to load exercises');
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

  // Filter exercises
  const filteredExercises = exercises.filter((ex) =>
    ex.name.toLowerCase().includes(searchText.toLowerCase())
  );

  // Save new or edited exercise
  const addExercise = async () => {
    if (!form.name.trim() || !form.description.trim() || !form.videoUrl.trim()) {
      showAlert('Error', 'Please fill in all fields');
      return;
    }

    // Basic URL validation on frontend
    const urlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com)/i;
    if (!urlPattern.test(form.videoUrl) && !form.videoUrl.startsWith('http')) {
      showAlert('Error', 'Please provide a valid video URL (YouTube, Vimeo, etc.)');
      return;
    }

    try {
      setSaving(true);
      Logger.log('Sending exercise data:', form);

      if (isEditing && selectedExercise) {
        const response = await OfflineApiService.updateExercise(selectedExercise._id, form);
        if (response.success) {
          await loadExercises(); // Reload exercises
          showAlert('Success', 'Exercise updated successfully');
        } else {
          showAlert('Error', 'Failed to update exercise');
        }
      } else {
        Logger.log('Creating new exercise with data:', form);
        const response = await OfflineApiService.createExercise(form);
        if (response.success) {
          await loadExercises(); // Reload exercises
          showAlert('Success', 'Exercise created successfully');
        } else {
          showAlert('Error', 'Failed to create exercise');
        }
      }

      setForm({ name: "", description: "", videoUrl: "" });
      setModalVisible(false);
      setIsEditing(false);
      setSelectedExercise(null);
    } catch (error) {
      Logger.error('Save exercise error:', error);
      showAlert('Error', 'Failed to save exercise');
    } finally {
      setSaving(false);
    }
  };

  const deleteExercise = async (exercise: Exercise) => {
    try {
      HapticFeedback.medium();
      const response = await OfflineApiService.deleteExercise(exercise._id);
      if (response.success) {
        await loadExercises(); // Reload exercises
        HapticFeedback.success();
        showAlert('Success', 'Exercise deleted successfully');
      } else {
        HapticFeedback.error();
        showAlert('Error', 'Failed to delete exercise');
      }
    } catch (error) {
      Logger.error('Delete exercise error:', error);
      HapticFeedback.error();
      showAlert('Error', 'Failed to delete exercise');
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
          onPress={loadExercises}
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
              placeholder="Search exercises..."
              placeholderTextColor="#999"
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          {/* Description */}
          <Text style={styles.text}>
            Manage exercises that will be available{'\n'}for workouts.
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
              <View style={styles.infoContainer}>
                <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
                  {ex.name.length > 10 ? ex.name.substring(0, 10) + '...' : ex.name}
                </Text>
                <Text style={styles.dateRange} numberOfLines={1} ellipsizeMode="tail">
                  {ex.description
                    ? (ex.description.length > 18 ? ex.description.substring(0, 18) + '...' : ex.description)
                    : 'No description'}
                </Text>
              </View>

              <View style={styles.rightContainer}>
                <TouchableOpacity
                  onPress={() => Linking.openURL(ex.videoUrl)}
                  style={{ marginRight: 10 }}
                >
                  <YoutubeIcon size={24} color="#d5ff5f" />
                </TouchableOpacity>
                <ChevronForwardIcon size={20} color="#999" />
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {filteredExercises.length === 0 && (
          <Text style={styles.noDataText}>No exercises found.</Text>
        )}
      </Animated.ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.addbutton}
        onPress={() => {
          setModalVisible(true);
          setIsEditing(false);
          setForm({ name: "", description: "", videoUrl: "" });
        }}
      >
        <Text style={styles.addBtnText}>+</Text>
      </TouchableOpacity>

      {/* Add/Edit Exercise Modal */}
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
                      {isEditing ? "Edit Exercise" : "Add Exercise"}
                    </Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                      <CloseIcon size={28} color="white" />
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
                    value={form.description}
                    onChangeText={(t) => setForm({ ...form, description: t })}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />

                  <TouchableOpacity
                    style={[styles.saveButton, saving && { opacity: 0.7 }]}
                    onPress={addExercise}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <Text style={styles.saveButtonText}>
                        {isEditing ? "Update Exercise" : "Save Exercise"}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Action Modal (Edit/Delete) */}
      <Modal visible={actionModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer2}>
          <View style={styles.actionBox}>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => {
                setIsEditing(true);
                if (selectedExercise) {
                  setForm({
                    name: selectedExercise.name,
                    description: selectedExercise.description,
                    videoUrl: selectedExercise.videoUrl
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
                  'Delete Exercise',
                  'Are you sure you want to delete this exercise?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => {
                        if (selectedExercise) deleteExercise(selectedExercise);
                        setActionModalVisible(false);
                      }
                    }
                  ]
                );
              }}
            >
              <Text style={[styles.optionText, { color: "#ff6b6b" }]}>Delete</Text>
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
    justifyContent: "space-between",
  },
  iconWrapper: {
    padding: 19,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  infoContainer: { flex: 1, marginLeft: 15, },
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

  // Modal styles
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
    paddingLeft:20,
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
    fontFamily: "Poppins_300Light",
  },
});

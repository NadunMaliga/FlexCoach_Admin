import { useRouter } from "expo-router";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import Svg, { Path } from "react-native-svg";

import {
Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    useFonts,
} from "@expo-google-fonts/poppins";
import {
    Animated,
    Image,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Platform,
    StatusBar,
} from "react-native";
import Logger from '../utils/logger';
import OfflineApiService from "../services/OfflineApiService";
import ClientsSkeleton from '../components/ClientsSkeleton';
import ProfileAvatar from '../components/ProfileAvatar';
import LoadingGif from '../components/LoadingGif';
import EmptyState from '../components/EmptyState';
import { validateUserId, validateName, validateEmail, sanitizeString } from '../utils/validators';
import HapticFeedback from '../utils/haptics';



// SVG Icons
const SearchIcon = ({ size = 25, color = "#999" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </Svg>
);

export default function Clients({ initialFilter = "All" }) {
  const [searchText, setSearchText] = useState("");
  const router = useRouter();

  const [filter, setFilter] = useState(initialFilter); // All, Active, Inactive

  // Update filter when initialFilter prop changes
  React.useEffect(() => {
    if (initialFilter) {
      setFilter(initialFilter);
    }
  }, [initialFilter]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [lastLoadTime, setLastLoadTime] = useState(0);
  const [lastParams, setLastParams] = useState({ filter: "All", search: "" });
  const [fadeAnim] = useState(new Animated.Value(1));
  const [skeletonAnim] = useState(new Animated.Value(0));

  // Skeleton pulse animation
  useEffect(() => {
    if (loading && users.length === 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(skeletonAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(skeletonAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [loading, users.length]);

  let [fontsLoaded] = useFonts({
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });

  useEffect(() => {
    // Only reload if filter/search changed or data is stale
    const now = Date.now();
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    const paramsChanged = lastParams.filter !== filter || lastParams.search !== searchText;
    
    if (paramsChanged || users.length === 0 || now - lastLoadTime > CACHE_DURATION) {
      loadUsers();
      setLastParams({ filter, search: searchText });
    } else {
      setLoading(false); // Use cached data
    }
  }, [filter, searchText]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      setLastLoadTime(Date.now()); // Update cache timestamp

      // Fade out if there's existing data
      if (users.length > 0) {
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 150,
          useNativeDriver: true,
        }).start();
      }

      const params = {
        limit: 50,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      // Apply filters (using isApproved field)
      if (filter === 'Active') {
        params.isApproved = 'true';
      } else if (filter === 'Inactive') {
        params.isApproved = 'false';
      }

      if (searchText.trim()) {
        params.search = searchText.trim();
      }

      const response = await OfflineApiService.getUsers(params);

      if (response.success) {
        Logger.log(`📋 Loaded ${response.users.length} users`);
        
        // Fetch profile photos from UserProfiles for each user
        const usersWithProfiles = await Promise.all(
          response.users.map(async (user) => {
            try {
              const profileResponse = await OfflineApiService.getUserProfile(user._id);
              const profilePhoto = profileResponse.success 
                ? profileResponse.userProfile.profilePhoto 
                : null;
              
              const finalProfilePhoto = profilePhoto || user.profilePhoto;
              
              return {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                profilePhoto: finalProfilePhoto, // Use UserProfile photo first, fallback to User photo
                gender: user.gender,
                name: `${user.firstName} ${user.lastName}`,
                daysAgo: Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)),
                status: user.isApproved ? "Active" : "Inactive",
                userData: { ...user, profilePhoto: finalProfilePhoto } // Include profile photo in userData
              };
            } catch (err) {
              Logger.log(`Profile not found for ${user.firstName} ${user.lastName}:`, err.message);
              return {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                profilePhoto: user.profilePhoto,
                gender: user.gender,
                name: `${user.firstName} ${user.lastName}`,
                daysAgo: Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)),
                status: user.isApproved ? "Active" : "Inactive",
                userData: user
              };
            }
          })
        );
        
        setUsers(usersWithProfiles);
        
        // Fade in with new data
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    } catch (err) {
      Logger.error('Load users error:', err);
      setError(err.message);
      // Restore opacity on error
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  if (!fontsLoaded) return null;

  // Filter users by searchText and filter status
  const filteredUsers = users.filter((user) => {
    const matchesText = user.name
      .toLowerCase()
      .includes(searchText.toLowerCase());
    const matchesFilter =
      filter === "All"
        ? true
        : filter === "Active"
          ? user.status === "Active"
          : user.status === "Inactive";
    return matchesText && matchesFilter;
  });

  // Handle status badge click
  const handleStatusPress = (user) => {
    setSelectedUser(user);
    setModalVisible(true);
  };

  // Confirm status change
  const confirmChangeStatus = async () => {
    try {
      if (!selectedUser) return;

      const newStatus = selectedUser.status === "Active" ? false : true;
      const response = await OfflineApiService.updateUserStatus(selectedUser.id, newStatus);

      if (response.success) {
        HapticFeedback.success(); // Success haptic
        setModalVisible(false);
        await loadUsers(); // Reload to get fresh data
      } else {
        HapticFeedback.error(); // Error haptic
        Logger.error('Status change failed:', response.error);
      }
    } catch (err) {
      HapticFeedback.error(); // Error haptic
      Logger.error('Status change error:', err);
    }
  };

  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <View style={{ height: statusBarHeight }} />
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <SearchIcon size={25} color="#999" />
        <TextInput
          placeholder="Search users..."
          accessibilityLabel="Search users"
          accessibilityHint="Type to search for users by name"
          placeholderTextColor="#999"
          style={styles.searchInput}
          value={searchText}
          onChangeText={(text) => setSearchText(sanitizeString(text))}
        />
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {["All", "Active", "Inactive"].map((item) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.filterButton,
              filter === item && styles.filterButtonActive,
            ]}
            onPress={() => {
              HapticFeedback.selection(); // Selection feedback
              setFilter(item);
            }}
          >
            <Text
              style={[
                styles.filterText,
                filter === item && {
                  color: "#000",
                  fontFamily: "Poppins_600SemiBold",
                },
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Users List */}
      <Animated.ScrollView
        style={{ flex: 1, opacity: fadeAnim }}
        contentContainerStyle={{ padding: 20, paddingBottom: 140 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#d5ff5f" />
        }
      >
        {error && (
          <Text style={{ color: '#ff6b6b', textAlign: 'center', margin: 20 }}>
            Error: {error}
          </Text>
        )}
        
        {/* Show skeleton loader only when loading and no data */}
        {loading && users.length === 0 && (
          <View>
            {[1, 2, 3, 4, 5].map((item) => (
              <View key={item} style={styles.skeletonCard}>
                <Animated.View 
                  style={[
                    styles.skeletonAvatar,
                    {
                      opacity: skeletonAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 0.8],
                      })
                    }
                  ]} 
                />
                <View style={{ flex: 1 }}>
                  <Animated.View 
                    style={[
                      styles.skeletonName,
                      {
                        opacity: skeletonAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.5, 0.8],
                        })
                      }
                    ]} 
                  />
                  <Animated.View 
                    style={[
                      styles.skeletonDate,
                      {
                        opacity: skeletonAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.5, 0.8],
                        })
                      }
                    ]} 
                  />
                </View>
                <Animated.View 
                  style={[
                    styles.skeletonBadge,
                    {
                      opacity: skeletonAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 0.8],
                      })
                    }
                  ]} 
                />
              </View>
            ))}
          </View>
        )}
        
        {!loading && filteredUsers.map((user) => (
          <TouchableOpacity
            key={user.id}
            style={styles.userRow}
            onPress={async () => {
              HapticFeedback.light(); // Light tap feedback
              // Preload exercise and diet data in the background for instant tab switching
              Logger.log('🚀 Preloading data for user:', user.id);
              
              // Start both API calls in parallel (don't await)
              const exercisePromise = OfflineApiService.getUserWorkoutSchedules(user.id, {
                limit: 50,
                sortBy: 'scheduledDate',
                sortOrder: 'asc'
              }).then(response => {
                if (response.success && response.workoutSchedules) {
                  const transformedSchedules = response.workoutSchedules.map((schedule, index) => ({
                    _id: schedule._id,
                    day: schedule.day || `Day ${index + 1}`,
                    detail: `${schedule.exercises?.length || 0} exercises - Duration ${schedule.estimatedDuration || 'N/A'} min`,
                    status: schedule.isCompleted ? "Completed" : "Not Completed",
                    isCompleted: schedule.isCompleted,
                    name: schedule.name,
                    workoutType: schedule.workoutType,
                    scheduledDate: schedule.scheduledDate,
                    exercises: schedule.exercises
                  }));
                  Logger.log('✅ Preloaded exercise data:', transformedSchedules.length, 'schedules');
                  return transformedSchedules;
                }
                return [];
              }).catch(err => {
                Logger.error('Preload exercise error:', err);
                return [];
              });

              const dietPromise = OfflineApiService.getUserDietPlans(user.id).then(response => {
                if (response.success && response.dietPlans) {
                  // Transform to match DietPlan component's expected format
                  const transformedMeals = response.dietPlans.map((dietPlan, index) => {
                    const mealDetails = {};

                    // Group meals by time and create details object
                    if (dietPlan.meals) {
                      dietPlan.meals.forEach(meal => {
                        const foodList = meal.foods.map(food => {
                          let displayText;
                          if (food.unit && food.unit !== 'serving' && food.unit !== '') {
                            displayText = `${food.foodName} ${food.quantity} ${food.unit}`;
                          } else {
                            displayText = `${food.foodName} ${food.quantity}`;
                          }
                          return displayText;
                        }).join('\n');

                        mealDetails[meal.time] = foodList || meal.instructions || `${meal.name} - ${meal.totalCalories} calories`;
                      });
                    }

                    return {
                      _id: dietPlan._id,
                      name: dietPlan.name || `Meal ${index + 1}`,
                      details: mealDetails
                    };
                  });
                  Logger.log('✅ Preloaded diet data:', transformedMeals.length, 'meals');
                  return transformedMeals;
                }
                return [];
              }).catch(err => {
                Logger.error('Preload diet error:', err);
                return [];
              });

              // Navigate immediately with preloaded data promises
              Promise.all([exercisePromise, dietPromise]).then(([exerciseData, dietData]) => {
                router.push({
                  pathname: "/ClientProfile",
                  params: { 
                    userId: user.id,
                    user: JSON.stringify(user.userData || user),
                    preloadedExerciseData: JSON.stringify(exerciseData),
                    preloadedDietData: JSON.stringify(dietData)
                  }
                });
              });
            }}
          >
            <ProfileAvatar 
              user={user} 
              size={60}
              style={styles.avatar}
            />
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">
                {user.name}
              </Text>
              <Text style={styles.userJoined}>
                Joined {user.daysAgo} days ago
              </Text>
            </View>

            {/* Chat Icon for Active Users */}
            {user.status === "Active" && (
              <TouchableOpacity
                style={{ marginRight: 15 }}
                onPress={() => router.push({
                  pathname: "/Chat",
                  params: { userId: user.id }
                })}
              >
                <Svg width={25} height={25} viewBox="0 0 24 24" fill="none" stroke="#707070ff" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M21 15C21 16.6569 19.6569 18 18 18H7L3 22V4C3 2.34315 4.34315 1 6 1H18C19.6569 1 21 2.34315 21 4V15Z" />
                </Svg>
              </TouchableOpacity>
            )}


            {/* Status Button */}
            <TouchableOpacity
              style={[
                styles.statusBadge,
                user.status === "Active" ? styles.active : styles.inactive,
              ]}
              onPress={() => handleStatusPress(user)}
            >
              <Text
                style={[
                  styles.statusText,
                  user.status === "Active"
                    ? { color: "#010e03ff" }
                    : { color: "#fff" },
                ]}
              >
                {user.status}
              </Text>
            </TouchableOpacity>


          </TouchableOpacity>
        ))}


        {filteredUsers.length === 0 && !loading && (
          <EmptyState
            icon="users"
            title="No users found"
            message={searchText ? `No users match "${searchText}"` : "No users available"}
          />
        )}
      </Animated.ScrollView>

      {/* Modal for Change Status */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Change Status</Text>
            {selectedUser && (
              <Text style={styles.modalMessage}>
                Do you want to{" "}
                {selectedUser.status === "Active"
                  ? "deactivate"
                  : "activate"}{" "}
                {selectedUser.name}?
              </Text>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#d5ff5f" }]}
                onPress={confirmChangeStatus}
              >
                <Text style={[styles.modalBtnText, { color: "#000" }]}>
                  Yes
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, { borderWidth: 1, borderColor: "#555" }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.modalBtnText, { color: "#fff" }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1c1c1c",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 40,
    margin: 10,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontFamily: "Poppins_400Regular",
    fontSize: 17,
    paddingVertical: 5,
  },
  filterContainer: {
    flexDirection: "row",
    marginHorizontal: 10,
    marginVertical: 10,
    paddingHorizontal: 3,
    justifyContent: "flex-start",
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderColor: "#848484ff",
    borderWidth: 1,
    marginRight: 5,
  },
  filterButtonActive: {
    backgroundColor: "#d5ff5f",
    borderColor: "#d5ff5f",
  },
  filterText: {
    fontFamily: "Poppins_400Regular",
    color: "#fff",
    fontSize: 16,
  },
  userRow: {
    flexDirection: "row",
    borderRadius: 50,
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 3,
    marginBottom: 5,
  },
  avatar: { width: 65, height: 65, borderRadius: 50, marginRight: 13 },
  userName: {
    color: "#d4d3d3ff",
    fontSize: 18,
    fontFamily: "Poppins_400Regular",
  },
  userJoined: {
    color: "#aaa",
    fontSize: 13,
    fontFamily: "Poppins_300Light",
  },
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  active: { backgroundColor: "#fbfefcff" },
  inactive: { backgroundColor: "#444444ff" },
  statusText: { fontSize: 13, fontFamily: "Poppins_400Regular" },

  // Modal Styles
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#1C1C1E",
    borderRadius: 25,
    padding: 25,
    width: "85%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    color: "#fff",
    marginBottom: 10,
    fontFamily: "Poppins_600SemiBold",
  },
  modalMessage: {
    fontSize: 15,
    color: "#aaa",
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "Poppins_400Regular",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: "center",
    marginHorizontal: 5,
  },
  modalBtnText: {
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
  },
  
  // Skeleton styles
  skeletonCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 3,
    marginBottom: 5,
  },
  skeletonAvatar: {
    width: 65,
    height: 65,
    borderRadius: 50,
    backgroundColor: "#2a2a2a",
    marginRight: 13,
  },
  skeletonName: {
    width: 150,
    height: 18,
    backgroundColor: "#2a2a2a",
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonDate: {
    width: 100,
    height: 13,
    backgroundColor: "#2a2a2a",
    borderRadius: 4,
  },
  skeletonBadge: {
    width: 80,
    height: 32,
    backgroundColor: "#2a2a2a",
    borderRadius: 20,
  },
});

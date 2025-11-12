// @ts-nocheck
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  StatusBar,
  BlurView,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from 'expo-secure-store';
import Logger from '../utils/logger';
import { LineChart } from "react-native-chart-kit";
import Svg, { Path } from "react-native-svg";
import Icon from "react-native-vector-icons/Feather";
import { useAuth } from "../contexts/AuthContext";
import OfflineApiService from "../services/OfflineApiService";
import DashboardSkeleton from '../components/DashboardSkeleton';
import LoadingGif from '../components/LoadingGif';
import EmptyState from '../components/EmptyState';
import { fadeIn, staggerAnimation, bounce } from '../utils/animations';
import { showAlert, showSuccess, showError } from '../utils/customAlert';



// Define types for better TypeScript support
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  isActive: boolean;
  profilePhoto?: string;
}

interface DashboardStats {
  totalUsers?: number;
  activeUsers?: number;
  pendingUsers?: number;
  activeUsersPercentage?: string;
  pendingUsersPercentage?: string;
  newUsersLast30Days?: number;
  totalDietPlans?: number;
  totalWorkouts?: number;
}

interface ClientOverview {
  dailyData: Array<{
    date: string;
    day: string;
    newUsers: number;
    activeUsers: number;
    totalUsers: number;
  }>;
  statusBreakdown: {
    active: number;
    inactive: number;
    approved: number;
    pending: number;
  };
  totalUsers: number;
}

interface RecentUser {
  id: string;
  name: string;
  daysAgo: number;
  status: string;
  avatar: string;
}

interface DashboardProps {
  onNavigateToClients?: (filter: string) => void;
}

export default function Dashboard({ onNavigateToClients }: DashboardProps) {
  const { logout } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [adminProfilePhoto, setAdminProfilePhoto] = useState<string>("https://i.pinimg.com/736x/6f/a3/6a/6fa36aa2c367da06b2a4c8ae1cf9ee02.jpg");
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);
  const [clientOverview, setClientOverview] = useState<ClientOverview | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastLoadTime, setLastLoadTime] = useState<number>(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [cardAnims] = useState([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]);
  const [chartAnim] = useState(new Animated.Value(0));
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    // Load saved admin profile photo
    loadAdminProfilePhoto();

    // Only load if data is stale (older than 5 minutes) or not loaded
    const now = Date.now();
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    if (!dashboardData || now - lastLoadTime > CACHE_DURATION) {
      loadDashboardData();
    } else {
      setLoading(false); // Data is cached, no need to load
    }

    // Animate on mount
    fadeIn(fadeAnim, 400).start();
    setTimeout(() => {
      staggerAnimation(cardAnims, 300, 100).start();
    }, 200);
    setTimeout(() => {
      // Animate chart container after cards
      Animated.spring(chartAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
      // Line drawing animation is handled by AnimatedLineChart component
    }, 600);
  }, []);

  const loadAdminProfilePhoto = async () => {
    try {
      const savedPhoto = await SecureStore.getItemAsync('adminProfilePhoto');
      if (savedPhoto) {
        setAdminProfilePhoto(savedPhoto);
        Logger.log('Loaded admin profile photo:', savedPhoto);

        // Prefetch the image to cache it natively
        Image.prefetch(savedPhoto)
          .then(() => Logger.log('✅ Admin profile photo cached'))
          .catch((err) => Logger.error('❌ Failed to cache admin profile photo:', err));
      }
    } catch (error) {
      Logger.error('Error loading admin profile photo:', error);
    }
  };

  const handleProfilePictureChange = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        showAlert('Permission Required', 'Please grant camera roll permissions to change your profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingPhoto(true);
        const originalUri = result.assets[0].uri;

        Logger.log('📷 Compressing admin profile picture...');

        // Compress image before upload for faster loading
        const { compressImage } = require('../utils/imageCompression');
        const compressedUri = await compressImage(originalUri, {
          maxWidth: 400,
          maxHeight: 400,
          quality: 0.8,
        });

        Logger.log('✅ Image compressed, uploading...');

        // Create form data with compressed image
        const formData = new FormData();
        formData.append('profilePhoto', {
          uri: compressedUri,
          type: 'image/jpeg',
          name: 'admin-profile.jpg',
        } as any);

        // Upload to admin backend
        const response = await OfflineApiService.uploadAdminProfilePhoto(formData);

        if (response.success) {
          // Convert relative URL to full URL
          const fullPhotoUrl = response.profilePhotoUrl.startsWith('http')
            ? response.profilePhotoUrl
            : `${OfflineApiService.getBaseUrl()}${response.profilePhotoUrl}`;

          // Save to SecureStore for persistence
          await SecureStore.setItemAsync('adminProfilePhoto', fullPhotoUrl);

          setAdminProfilePhoto(fullPhotoUrl);
          setShowProfileModal(false);
          showAlert('Success', 'Profile picture updated successfully!');
          Logger.log('Admin profile photo saved:', fullPhotoUrl);
        } else {
          Alert.alert('Error', response.error || 'Failed to upload profile picture');
        }
      }
    } catch (error) {
      Logger.error('Profile picture upload error:', error);
      showAlert('Error', 'Failed to upload profile picture. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setLastLoadTime(Date.now()); // Update cache timestamp

      // Fade out while loading
      if (dashboardData) {
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 150,
          useNativeDriver: true,
        }).start();
      }

      // Load client overview and recent users (skip broken stats endpoint for now)
      const [overviewResponse, usersResponse] = await Promise.all([
        OfflineApiService.getClientOverview('7'), // Last 7 days
        OfflineApiService.getUsers({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' })
      ]);

      if (overviewResponse.success) {
        setClientOverview(overviewResponse.overview);
        Logger.log('Client overview loaded:', overviewResponse.overview);

        // Extract stats from client overview data
        const overview = overviewResponse.overview;
        const extractedStats = {
          totalUsers: overview.totalUsers,
          activeUsers: overview.statusBreakdown.active,
          pendingUsers: overview.statusBreakdown.pending,
          approvedUsers: overview.statusBreakdown.approved,
          activeUsersPercentage: overview.totalUsers > 0 ?
            Math.round((overview.statusBreakdown.active / overview.totalUsers) * 100) + '%' : '0%',
          pendingUsersPercentage: overview.totalUsers > 0 ?
            Math.round((overview.statusBreakdown.pending / overview.totalUsers) * 100) + '%' : '0%',
          newUsersLast30Days: overview.dailyData.reduce((sum, day) => sum + day.newUsers, 0),
          totalDietPlans: 0, // Will be updated when we fix the stats endpoint
          totalWorkouts: 0   // Will be updated when we fix the stats endpoint
        };

        setDashboardData(extractedStats);
        Logger.log('Extracted dashboard stats:', extractedStats);
      }

      if (usersResponse.success) {
        // Fetch user profiles for profile photos
        Logger.log(`📋 Loading profiles for ${usersResponse.users.length} recent users...`);

        const usersWithProfiles = await Promise.all(
          usersResponse.users.map(async (user: User) => {
            try {
              const profileResponse = await OfflineApiService.getUserProfile(user._id);
              const profilePhoto = profileResponse.success
                ? profileResponse.userProfile.profilePhoto
                : null;

              Logger.log(`👤 ${user.firstName} ${user.lastName}: ${profilePhoto ? '✅ Has profile photo' : '❌ No profile photo'}`);

              const finalProfilePhoto = profilePhoto || user.profilePhoto || "https://i.pinimg.com/736x/6f/a3/6a/6fa36aa2c367da06b2a4c8ae1cf9ee02.jpg";

              return {
                id: user._id,
                name: `${user.firstName} ${user.lastName}`,
                daysAgo: Math.floor((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
                status: user.isActive ? "Active" : "Inactive",
                avatar: finalProfilePhoto,
                userData: { ...user, profilePhoto: finalProfilePhoto } // Store full user data with profile photo
              };
            } catch (err) {
              Logger.log(`❌ Profile not found for user ${user.firstName} ${user.lastName} (${user._id}):`, err.message);
              const fallbackPhoto = user.profilePhoto || "https://i.pinimg.com/736x/6f/a3/6a/6fa36aa2c367da06b2a4c8ae1cf9ee02.jpg";

              return {
                id: user._id,
                name: `${user.firstName} ${user.lastName}`,
                daysAgo: Math.floor((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
                status: user.isActive ? "Active" : "Inactive",
                avatar: fallbackPhoto,
                userData: { ...user, profilePhoto: fallbackPhoto } // Store full user data with profile photo
              };
            }
          })
        );

        setRecentUsers(usersWithProfiles);

        // Prefetch all user avatars to cache them
        usersWithProfiles.forEach(user => {
          if (user.avatar) {
            Image.prefetch(user.avatar)
              .then(() => Logger.log(`✅ Cached avatar for ${user.name}`))
              .catch((err) => Logger.error(`❌ Failed to cache avatar for ${user.name}:`, err));
          }
        });
      }

      // Fade in with loaded data
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } catch (err) {
      Logger.error('Dashboard load error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000", justifyContent: 'center', alignItems: 'center' }}>
        <LoadingGif size={200} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000", justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#ff6b6b', textAlign: 'center', margin: 20 }}>
          Error loading dashboard: {error}
        </Text>
      </View>
    );
  }

  // Use real data from API with fallback to mock data
  const measurements = [
    {
      name: "Total Clients",
      value: dashboardData?.totalUsers?.toString() || "1200",
      updated: "100%",
      filter: "All"
    },
    {
      name: "Active Clients",
      value: dashboardData?.activeUsers?.toString() || "875",
      updated: dashboardData?.activeUsersPercentage || "73%",
      filter: "Active"
    },
    {
      name: "New Clients",
      value: dashboardData?.newUsersLast30Days?.toString() || "125",
      updated: dashboardData?.pendingUsersPercentage || "25%",
      filter: "Inactive"
    },
  ];

  // Prepare chart data from real API data or use mock data
  const chartData = clientOverview && clientOverview.dailyData.length > 0
    ? {
      labels: clientOverview.dailyData.map(d => d.day.substring(0, 3)), // Mon, Tue, etc.
      datasets: [{
        data: clientOverview.dailyData.map(d => d.newUsers + d.activeUsers) // Combined activity
      }]
    }
    : {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [{ data: [1000, 1050, 1080, 1100, 1130, 1150, 1200] }]
    };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <Animated.ScrollView
        style={[styles.container, { opacity: fadeAnim }]}
        contentContainerStyle={{ paddingBottom: 180 }} // extra space for navbar
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#000000ff"
            colors={["#000000ff"]}
          />
        }
      >
        {/* Greeting */}
        <View style={styles.greetingContainer}>
          <TouchableOpacity
            style={styles.profileWrapper}
            onPress={() => setShowProfileModal(true)}
            activeOpacity={0.8}
          >
            <Image
              source={{
                uri: adminProfilePhoto,
                cache: 'force-cache',
                headers: {
                  'Cache-Control': 'max-age=31536000' // Cache for 1 year
                }
              }}
              style={styles.profilePic}
            />
            <View style={styles.onlineBadge} />
          </TouchableOpacity>
          <View style={styles.greetingTextContainer}>
            <Text style={styles.helloText}>Hello, FlexCoach</Text>
            <Text style={styles.startDayText}>Let's start your day</Text>
          </View>
        </View>

        {/* Horizontal Cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          {measurements.map((item, index) => (
            <Animated.View
              key={index}
              style={{
                opacity: cardAnims[index],
                transform: [{
                  translateY: cardAnims[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0]
                  })
                }]
              }}
            >
              <TouchableOpacity
                style={styles.measureBox}
                onPress={() => onNavigateToClients?.(item.filter)}
                activeOpacity={0.7}
              >
                <Text style={styles.measureName}>{item.name}</Text>
                <Text style={styles.measureValue}>{item.value}</Text>
                <Text style={styles.measureUpdated}>{item.updated}</Text>
                <Svg
                  width={12}
                  height={12}
                  viewBox="0 0 24 24"
                  strokeWidth={1.7}
                  fill="none"
                  stroke="#7c7c7cff"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={styles.arrowIcon}
                >
                  <Path d="M6 19L19 6M19 6V18.48M19 6H6.52" />
                </Svg>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>

        {/* Line Chart */}
        <Animated.View
          style={[
            styles.chartContainer,
            {
              opacity: chartAnim,
              transform: [{
                scale: chartAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1]
                })
              }]
            }
          ]}
        >
          <Text style={styles.sectionTitle}>Client Overview</Text>
          <View style={styles.chartWrapper}>
            <LineChart
              data={chartData}
              width={Dimensions.get("window").width - 40}
              height={220}
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: "#404040ff",
                backgroundGradientFrom: "#000",
                backgroundGradientTo: "#000",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(213, 255, 95, ${opacity})`, // #d5ff5f
                labelColor: (opacity = 1) => `rgba(200,200,200,${opacity})`,
                propsForDots: { r: "5", strokeWidth: "2", stroke: "#d5ff5f" },
              }}
              bezier
              style={{ borderRadius: 15 }}
            />
          </View>
        </Animated.View>

        {/* Recent Activity */}
        <View style={{ marginTop: 30 }}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {recentUsers.length === 0 && !loading && (
            <EmptyState
              icon="users"
              title="No recent activity"
              message="New user registrations will appear here"
            />
          )}
          {recentUsers.map((user: any) => (
            <TouchableOpacity
              key={user.id}
              style={styles.userRow}
              onPress={async () => {
                Logger.log('Navigating to ClientProfile for user:', user.id);

                // Preload exercise and diet data like Clients.jsx does
                const exercisePromise = OfflineApiService.getUserWorkoutSchedules(user.id)
                  .then(res => res.success ? res.workoutSchedules : [])
                  .catch(err => {
                    Logger.error('Preload exercise error:', err);
                    return [];
                  });

                const dietPromise = OfflineApiService.getUserDietPlans(user.id)
                  .then(res => res.success ? res.dietPlans : [])
                  .catch(err => {
                    Logger.error('Preload diet error:', err);
                    return [];
                  });

                // Navigate with preloaded data
                Promise.all([exercisePromise, dietPromise]).then(([exerciseData, dietData]) => {
                  const userDataToPass = user.userData || user;
                  Logger.log('User data being passed to ClientProfile:', userDataToPass);

                  router.push({
                    pathname: "/ClientProfile",
                    params: {
                      userId: user.id,
                      user: JSON.stringify(userDataToPass),
                      preloadedExerciseData: JSON.stringify(exerciseData),
                      preloadedDietData: JSON.stringify(dietData)
                    }
                  });
                });
              }}
              activeOpacity={0.7}
            >
              <Image
                source={{
                  uri: user.avatar,
                  cache: 'force-cache'
                }}
                style={styles.avatar}
                onLoad={() => Logger.success('Dashboard avatar loaded for:', user.name)}
                onError={(error) => Logger.log('❌ Dashboard avatar error for:', user.name, error.nativeEvent.error)}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">{user.name}</Text>
                <Text style={styles.userJoined}>Joined {user.daysAgo} days ago</Text>
              </View>
              {/* Status Badge */}
              <View
                style={[
                  styles.statusBadge,
                  user.status === "Active" ? styles.active : styles.inactive,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    user.status === "Active" ? { color: "#010e03ff" } : { color: "#fff" },
                  ]}
                >
                  {user.status}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.ScrollView>

      {/* Profile Picture Change Modal */}
      <Modal
        visible={showProfileModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.profileModal}>
            <Text style={styles.modalTitle}>Change Profile Picture</Text>
            <Text style={styles.modalSubtitle}>Update your admin profile photo</Text>

            <Image
              source={{
                uri: adminProfilePhoto,
                cache: 'force-cache'
              }}
              style={styles.modalProfilePic}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowProfileModal(false)}
                disabled={uploadingPhoto}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.changeButton]}
                onPress={handleProfilePictureChange}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={styles.changeButtonText}>Choose Photo</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 20 },
  measureBox: {
    width: 180,
    backgroundColor: "#1c1c1c",
    padding: 25,
    borderRadius: 25,
    marginRight: 15,
    position: "relative"
  },
  measureName: { fontSize: 18, fontWeight: "300", color: "#fff", marginBottom: 5, fontFamily: "Poppins_300Light" },
  measureValue: { fontSize: 35, fontWeight: "400", color: "#f2f2f2ff", marginTop: -8, fontFamily: "Poppins_300Light" },
  measureUpdated: { fontSize: 13, color: "#999", fontWeight: "300", marginTop: -2, fontFamily: "Poppins_300Light" },
  arrowIcon: {
    position: "absolute",
    padding: 13,
    bottom: 25,
    right: 20,
    backgroundColor: "#171717ff",
    borderRadius: 20
  },
  chartContainer: { marginTop: 20, alignItems: "center" },
  chartWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sectionTitle: { color: "#bbbbbbff", fontSize: 20, fontWeight: "300", marginBottom: 1, fontFamily: "Poppins_300Light" },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    marginBottom: 5
  },
  avatar: { width: 60, height: 60, borderRadius: 50, marginRight: 15 },
  userName: { color: "white", fontSize: 19, fontWeight: "400", fontFamily: "Poppins_300Light", maxWidth: '70%' },
  userJoined: { color: "#aaa", fontSize: 13, marginTop: -7, fontFamily: "Poppins_300Light" },
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  active: {
    backgroundColor: "#ffffffff",
  },
  inactive: {
    backgroundColor: "#555",
  },
  statusText: {
    fontSize: 13,
    fontWeight: "400",
    fontFamily: "Poppins_300Light",
  },
  // Greeting
  greetingContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 30,
  },
  profileWrapper: { position: "relative" },
  profilePic: { width: 70, height: 70, borderRadius: 50 },
  onlineBadge: {
    position: "absolute",
    top: 50,
    right: 0,
    width: 19,
    height: 19,
    borderRadius: 20,
    backgroundColor: "#d5ff5f",
    borderWidth: 2,
    borderColor: "black",
  },
  greetingTextContainer: { marginLeft: 10 },
  helloText: { fontSize: 23, fontWeight: "600", color: "#eaeaea", fontFamily: "Poppins_300Light" },
  startDayText: { fontSize: 15, color: "#939393", marginTop: -9, fontFamily: "Poppins_300Light" },
  // Profile Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  profileModal: {
    backgroundColor: "#1c1c1c",
    borderRadius: 25,
    padding: 30,
    width: "85%",
    alignItems: "center",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 8,
    fontFamily: "Poppins_300Light",
  },
  modalSubtitle: {
    color: "#999",
    fontSize: 14,
    marginBottom: 25,
    fontFamily: "Poppins_300Light",
  },
  modalProfilePic: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 25,
    borderWidth: 3,
    borderColor: "#d5ff5f",
  },
  modalButtons: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#333",
  },
  changeButton: {
    backgroundColor: "#d5ff5f",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "Poppins_300Light",
  },
  changeButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Poppins_300Light",
  },
});
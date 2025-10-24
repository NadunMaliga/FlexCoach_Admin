import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import ApiService from "../services/api";

// SVG Icons for Personal Information
const PersonIcon = ({ size = 24, color = "#9e9e9e" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <Path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
  </Svg>
);

const CalendarIcon = ({ size = 24, color = "#9e9e9e" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
  </Svg>
);

const GenderIcon = ({ size = 24, color = "#9e9e9e" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 1v6M12 17v6M7 12h10M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z" />
  </Svg>
);

const PhoneIcon = ({ size = 24, color = "#9e9e9e" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </Svg>
);

const MailIcon = ({ size = 24, color = "#9e9e9e" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <Path d="M22 6l-10 7L2 6" />
  </Svg>
);

const InfoIcon = ({ size = 24, color = "#9e9e9e" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
    <Path d="M12 16v-4M12 8h.01" />
  </Svg>
);

const FitnessIcon = ({ size = 24, color = "#9e9e9e" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M7.4 7H4.6C4.26863 7 4 7.26863 4 7.6V16.4C4 16.7314 4.26863 17 4.6 17H7.4C7.73137 17 8 16.7314 8 16.4V7.6C8 7.26863 7.73137 7 7.4 7Z" />
    <Path d="M19.4 7H16.6C16.2686 7 16 7.26863 16 7.6V16.4C16 16.7314 16.2686 17 16.6 17H19.4C19.7314 17 20 16.7314 20 16.4V7.6C20 7.26863 19.7314 7 19.4 7Z" />
    <Path d="M1 14.4V9.6C1 9.26863 1.26863 9 1.6 9H3.4C3.73137 9 4 9.26863 4 9.6V14.4C4 14.7314 3.73137 15 3.4 15H1.6C1.26863 15 1 14.7314 1 14.4Z" />
    <Path d="M23 14.4V9.6C23 9.26863 22.7314 9 22.4 9H20.6C20.2686 9 20 9.26863 20 9.6V14.4C20 14.7314 20.2686 15 20.6 15H22.4C22.7314 15 23 14.7314 23 14.4Z" />
    <Path d="M8 12H16" />
  </Svg>
);

// Helper function to get the appropriate SVG icon
const getIconComponent = (iconName) => {
  switch (iconName) {
    case "person-outline":
      return PersonIcon;
    case "calendar-outline":
      return CalendarIcon;
    case "male-female-outline":
      return GenderIcon;
    case "call-outline":
      return PhoneIcon;
    case "mail-outline":
      return MailIcon;
    case "information-circle-outline":
      return InfoIcon;
    case "fitness-outline":
      return FitnessIcon;
    default:
      return PersonIcon;
  }
};

const router = useRouter();

export default function ClientProfile() {
  const { userId, user: userParam } = useLocalSearchParams();
  const [user, setUser] = useState(null);
  const [latestMeasurements, setLatestMeasurements] = useState({});
  const [onboardingData, setOnboardingData] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("Personal");
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to parse user from params first
      if (userParam) {
        try {
          const parsedUser = JSON.parse(userParam);
          setUser(parsedUser);
        } catch (e) {
          console.error('Error parsing user param:', e);
        }
      }

      // Load fresh user data and measurements if userId is available
      if (userId) {
        const [userResponse, measurementsResponse, onboardingResponse, userProfileResponse] = await Promise.all([
          ApiService.getUserById(userId),
          ApiService.getUserLatestMeasurements(userId),
          ApiService.getUserOnboarding(userId),
          ApiService.getUserProfile(userId).catch(err => {
            console.log('User profile not found:', err.message);
            return { success: false };
          })
        ]);

        if (userResponse.success) {
          setUser(userResponse.user);
        }

        if (measurementsResponse.success) {
          setLatestMeasurements(measurementsResponse.latestMeasurements);
        }

        if (onboardingResponse.success) {
          setOnboardingData(onboardingResponse.onboarding);
        }

        if (userProfileResponse.success) {
          setUserProfile(userProfileResponse.userProfile);
          console.log('📸 User profile loaded:', userProfileResponse.userProfile.profilePhoto);
        }
      }
    } catch (err) {
      console.error('Load user data error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000", justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#d5ff5f" />
        <Text style={{ color: '#fff', marginTop: 10 }}>Loading profile...</Text>
      </View>
    );
  }

  if (error || !user) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000", justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#ff6b6b', textAlign: 'center', margin: 20 }}>
          {error || 'User not found'}
        </Text>
      </View>
    );
  }

  // Calculate age from birthday
  const calculateAge = (birthday) => {
    if (!birthday) return 'N/A';
    const today = new Date();
    const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const handleMeasurementClick = (key) => {
    setModalVisible(false);
    router.push(`/MeasurementHistory?measurement=${key}&userId=${userId}`);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ alignItems: "center", paddingBottom: 80 }}>
        {/* Profile Image */}
        <Image
          source={{
            uri: userProfile?.profilePhoto || user.profilePhoto || "https://i.pinimg.com/736x/6f/a3/6a/6fa36aa2c367da06b2a4c8ae1cf9ee02.jpg"
          }}
          style={styles.profilePic}
          onLoad={() => console.log('✅ Profile image loaded:', userProfile?.profilePhoto || user.profilePhoto)}
          onError={(error) => console.log('❌ Profile image error:', error.nativeEvent.error)}
        />

        {/* Name */}
        <Text style={styles.name} numberOfLines={1}>
          {`${user.firstName} ${user.lastName}`}
        </Text>
        <Text style={styles.subInfo}>
          Age: {calculateAge(user.birthday)}, Weight: {latestMeasurements.Weight?.value || 'N/A'} {latestMeasurements.Weight?.unit || ''}
        </Text>
        <Text style={styles.goal}>
          Training Mode: {user.trainingMode || 'N/A'}
        </Text>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {["Personal", "Exercise", "Diet Plan", "Details"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => {
                if (tab === "Exercise") {
                  console.log('Navigating to ExercisePlan with userId:', userId);
                  router.push(`/ExercisePlan?userId=${userId}`);
                } else if (tab === "Diet Plan") {
                  console.log('Navigating to DietPlan with userId:', userId);
                  router.push(`/DietPlan?userId=${userId}`);
                } else {
                  setActiveTab(tab);
                }
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === "Personal" && (
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            {[
              { icon: "person-outline", label: "First Name", value: user.firstName },
              { icon: "person-outline", label: "Last Name", value: user.lastName },
              { icon: "calendar-outline", label: "Birthday", value: formatDate(user.birthday) },
              { icon: "male-female-outline", label: "Gender", value: user.gender },
              { icon: "call-outline", label: "Contact", value: user.mobile },
              { icon: "mail-outline", label: "Email", value: user.email },
              { icon: "information-circle-outline", label: "Status", value: user.status },
              { icon: "fitness-outline", label: "Training Mode", value: user.trainingMode },
            ].map((item, index) => (
              <View style={styles.infoRow} key={index}>
                <View style={styles.iconBox}>
                  {React.createElement(getIconComponent(item.icon), { size: 24, color: "#9e9e9e" })}
                </View>
                <View style={styles.textBox}>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  <Text style={styles.infoValue}>{item.value}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === "Exercise" && (
          <View style={styles.placeholderBox}>
            <Text style={styles.placeholderText}>
              Exercise Plan will appear here
            </Text>
          </View>
        )}

        {activeTab === "Diet Plan" && (
          <View style={styles.placeholderBox}>
            <Text style={styles.placeholderText}>
              Diet Plan will appear here
            </Text>
          </View>
        )}

        {activeTab === "Details" && (
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>User Details</Text>
            {[
              { label: "Registration Date", value: formatDate(user.createdAt) },
              { label: "Last Updated", value: formatDate(user.updatedAt) },
              { label: "Onboarding Completed", value: user.onboardingCompleted ? "Yes" : "No" },
              { label: "Account Active", value: user.isActive ? "Yes" : "No" },
              { label: "Approved", value: user.isApproved ? "Yes" : "No" },
              { label: "Approval Date", value: user.approvedAt ? formatDate(user.approvedAt) : "N/A" },
              { label: "Primary Goal", value: user.fitnessGoals?.primaryGoal || "N/A" },
              { label: "Target Weight", value: user.fitnessGoals?.targetWeight ? `${user.fitnessGoals.targetWeight} kg` : "N/A" },
              { label: "Target Date", value: user.fitnessGoals?.targetDate ? formatDate(user.fitnessGoals.targetDate) : "N/A" },
              { label: "Current Steps", value: user.activity?.steps?.toString() || "0" },
              { label: "Steps Goal", value: user.activity?.stepsGoal?.toString() || "10000" },
            ].map((item, index) => (
              <View style={styles.infoRow} key={index}>
                <View style={styles.textBox}>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  <Text style={styles.infoValue}>{item.value}</Text>
                </View>
              </View>
            ))}

            {onboardingData && (
              <>
                <Text style={styles.sectionTitle}>Onboarding Information</Text>
                {[
                  { label: "Fitness Goals", value: onboardingData.fitnessGoals?.length > 0 ? onboardingData.fitnessGoals.join(", ") : "N/A" },
                  { label: "Specific Preferences", value: onboardingData.specificPreferences || "N/A" },
                  { label: "Exercise Frequency", value: onboardingData.exerciseFrequency || "N/A" },
                  { label: "Physical Activities", value: onboardingData.physicalActivities || "N/A" },
                  { label: "Fitness Level", value: onboardingData.fitnessLevel || "N/A" },
                  { label: "Dietary Restrictions", value: onboardingData.dietaryRestrictions || "N/A" },
                  { label: "Nutrition Habits Rating", value: onboardingData.nutritionHabitsRating ? `${onboardingData.nutritionHabitsRating}/10` : "N/A" },
                  { label: "Need Nutrition Assistance", value: onboardingData.needNutritionAssistance || "N/A" },
                  { label: "Available Days", value: onboardingData.availableDays || "N/A" },
                  { label: "Equipment Access", value: onboardingData.equipmentAccess?.length > 0 ? onboardingData.equipmentAccess.join(", ") : "N/A" },
                  { label: "Occupation", value: onboardingData.occupation || "N/A" },
                  { label: "Stress Level", value: onboardingData.stressLevel ? `${onboardingData.stressLevel}/10` : "N/A" },
                  { label: "Sleep Hours", value: onboardingData.sleepHours ? `${onboardingData.sleepHours} hours` : "N/A" },
                  { label: "Alcohol/Smoking", value: onboardingData.alcoholSmoking || "N/A" },
                  { label: "Medical Conditions", value: onboardingData.medicalConditions || "None" },
                  { label: "Medications", value: onboardingData.medications || "None" },
                  { label: "Injuries", value: onboardingData.injuries || "None" },
                  { label: "Onboarding Completed", value: formatDate(onboardingData.createdAt) },
                ].map((item, index) => (
                  <View style={styles.infoRow} key={`onboarding-${index}`}>
                    <View style={styles.textBox}>
                      <Text style={styles.infoLabel}>{item.label}</Text>
                      <Text style={styles.infoValue}>{item.value}</Text>
                    </View>
                  </View>
                ))}
              </>
            )}

            {!onboardingData && (
              <View style={styles.placeholderBox}>
                <Text style={styles.placeholderText}>
                  No onboarding data found for this user
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>


      <TouchableOpacity
        style={styles.imageViewButton}
        onPress={() => router.push(`/ClientBodyImage?userId=${userId}`)} // navigate to ClientBodyImage page with userId
      >
        <Svg width={25} height={25} viewBox="0 0 24 24" fill="none" stroke={"#101010ff"} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M4 4H20V20H4V4Z" />
          <Path d="M4 15L8 11L13 16L16 13L20 17" />
          <Path d="M9 9H9.01" />
        </Svg>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.chatButton}
        onPress={() => router.push("/Chat")} // navigate to Chat page
      >
        <Svg width={25} height={25} viewBox="0 0 24 24" fill="none" stroke="#707070ff" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M21 15C21 16.6569 19.6569 18 18 18H7L3 22V4C3 2.34315 4.34315 1 6 1H18C19.6569 1 21 2.34315 21 4V15Z" />
        </Svg>
      </TouchableOpacity>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerBtn}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.footerBtnText}>Body Measurement</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <TouchableOpacity
              style={styles.modalCloseIcon}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: "white", fontSize: 20 }}>✕</Text>
            </TouchableOpacity>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingVertical: 20 }}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalTitle}>Body Measurement</Text>
              <Text style={styles.modalSub}>Add your body measurements here</Text>

              {/* Daily */}
              <Text style={styles.sectionTitle}>Daily</Text>
              {[
                { key: "Weight", dbKey: "Weight", label: "Weight" },
                { key: "Steps", dbKey: "Steps", label: "Steps" },
              ].map((item) => {
                const measurement = latestMeasurements[item.dbKey];
                return (
                  <TouchableOpacity
                    style={styles.modalRow}
                    key={item.key}
                    onPress={() => handleMeasurementClick(item.key)}
                  >
                    <Text style={styles.modalRowKey}>{item.label}</Text>
                    <Text style={styles.modalRowValue}>
                      {measurement ? `${measurement.value} ${measurement.unit}` : "Not recorded"}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* One-Time */}
              <Text style={styles.sectionTitle}>One-Time</Text>
              {[
                { key: "Height", dbKey: "Height", label: "Height" },
              ].map((item) => {
                const measurement = latestMeasurements[item.dbKey];
                return (
                  <TouchableOpacity
                    style={styles.modalRow}
                    key={item.key}
                    onPress={() => handleMeasurementClick(item.key)}
                  >
                    <Text style={styles.modalRowKey}>{item.label}</Text>
                    <Text style={styles.modalRowValue}>
                      {measurement ? `${measurement.value} ${measurement.unit}` : "Not recorded"}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* Weekly */}
              <Text style={styles.sectionTitle}>Weekly</Text>
              {[
                { key: "Shoulders", dbKey: "Shoulders", label: "Shoulders" },
                { key: "Chest", dbKey: "Chest", label: "Chest" },
                { key: "Neck", dbKey: "Neck", label: "Neck" },
                { key: "Waist", dbKey: "Waist", label: "Waist" },
                { key: "Hips", dbKey: "Hips", label: "Hips" },
                { key: "LeftBicep", dbKey: "LeftBicep", label: "Left Bicep" },
                { key: "RightBicep", dbKey: "RightBicep", label: "Right Bicep" },
                { key: "LeftForearm", dbKey: "LeftForearm", label: "Left Forearm" },
                { key: "RightForearm", dbKey: "RightForearm", label: "Right Forearm" },
                { key: "LeftThigh", dbKey: "LeftThigh", label: "Left Thigh" },
                { key: "RightThigh", dbKey: "RightThigh", label: "Right Thigh" },
                { key: "LeftCalf", dbKey: "LeftCalf", label: "Left Calf" },
                { key: "RightCalf", dbKey: "RightCalf", label: "Right Calf" },
              ].map((item) => {
                const measurement = latestMeasurements[item.dbKey];
                return (
                  <TouchableOpacity
                    style={styles.modalRow}
                    key={item.key}
                    onPress={() => handleMeasurementClick(item.key)}
                  >
                    <Text style={styles.modalRowKey}>{item.label}</Text>
                    <Text style={styles.modalRowValue}>
                      {measurement ? `${measurement.value} ${measurement.unit}` : "Not recorded"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black", paddingTop: 3, paddingBottom: 60, },
  profilePic: {
    width: 180,
    height: 180,
    borderRadius: 100,
    marginBottom: 15,
    borderWidth: 5,
    borderColor: "#d5ff5f",
  },
  name: {
    color: "#e4e4e4",
    fontSize: 24,
    fontWeight: "400",
    textAlign: "center",
    marginHorizontal: 10,
    fontFamily: "Poppins_400Regular",
  },
  subInfo: { color: "gray", fontSize: 13, fontFamily: "Poppins_400Regular" },
  goal: { color: "gray", fontSize: 13, marginBottom: 25, fontFamily: "Poppins_400Regular" },

  tabRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#333",
    alignItems: "center",
  },
  tabBtnActive: { borderBottomColor: "#dddadaff" },
  tabText: { color: "gray", fontSize: 16, fontFamily: "Poppins_400Regular" },
  tabTextActive: { color: "#dddadaff", fontWeight: "600" },

  infoSection: { width: "85%", marginTop: 10 },
  sectionTitle: {
    color: "#e4e4e4",
    fontSize: 18,
    fontFamily: "Poppins_400Regular",
    marginBottom: 10,
    marginTop: 20,
  },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 19,
    backgroundColor: "#262626",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textBox: { flexDirection: "column" },
  infoLabel: { color: "#c4c4c4", fontSize: 17 },
  infoValue: { color: "gray", fontSize: 14 },

  placeholderBox: { marginTop: 40, alignItems: "center" },
  placeholderText: { color: "gray", fontSize: 15, fontFamily: "Poppins_400Regular" },

  chatButton: {
    position: "absolute",
    bottom: 150,
    right: 20,
    backgroundColor: "#dcff7cff",
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  imageViewButton: {

    position: "absolute",
    bottom: 240,
    right: 20,
    backgroundColor: "#ffffffff",
    width: 65,
    height: 65,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#d5ff5f",
    padding: 25,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#171717ff",
  },
  footerBtn: {
    backgroundColor: "black",
    paddingVertical: 22,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  footerBtnText: {

    fontSize: 18,
    color: "#ffffffff",
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: "#1c1c1c",
    paddingHorizontal: 25,
    paddingTop: 20,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    maxHeight: "80%",
    flex: 1,
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
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#333",
  },
  modalRowKey: {
    color: "#aaa",
    fontSize: 16,
  },
  modalRowValue: {
    color: "#fff",
    fontSize: 16,
  },
});

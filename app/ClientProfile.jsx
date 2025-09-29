import React, { useState } from "react";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";

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
const router = useRouter();

export default function ClientProfile() {
  const [user] = useState({
    firstName: "Nadun",
    lastName: "Malinga",
    email: "nadun321@gmail.com",
    age: 24,
    gender: "Male",
    contact: "+94 71 234 5678",
    birthday: "2001-05-10",
    photo: "https://i.pinimg.com/736x/6f/a3/6a/6fa36aa2c367da06b2a4c8ae1cf9ee02.jpg",
    goal: "Muscle Gain",
    status: "Active",
    weight: "180lbs",
    fitnessGoals: ["Muscle gain", "Endurance"],
    specificPreferences: "Dislike running",
    exerciseFrequency: "3-4 times a week",
    physicalActivities: "Gym workouts, cycling",
    fitnessLevel: 7,
    dietaryRestrictions: "Vegetarian",
    nutritionHabitsRating: 6,
    needNutritionAssistance: "Yes",
    availableDays: "Mon, Wed, Fri - evenings",
    equipmentAccess: ["Gym", "Dumbbells at home"],
    occupation: "Software Engineer",
    stressLevel: 6,
    sleepHours: 7,
    alcoholSmoking: "Occasionally",
    medicalConditions: "None",
    medications: "No",
    injuries: "Shoulder strain before",
    doctorClearance: "Yes",
  });

  const [activeTab, setActiveTab] = useState("Personal");
  const [modalVisible, setModalVisible] = useState(false);

  const handleMeasurementClick = (key) => {
    setModalVisible(false);
    router.push(`/MeasurementHistory?measurement=${key}`);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ alignItems: "center", paddingBottom: 80 }}>
        {/* Profile Image */}
        <Image source={{ uri: user.photo }} style={styles.profilePic} />

        {/* Name */}
        <Text style={styles.name} numberOfLines={1}>
          {`${user.firstName} ${user.lastName}`}
        </Text>
        <Text style={styles.subInfo}>
          Age: {user.age}, Weight: {user.weight}
        </Text>
        <Text style={styles.goal}>Fitness Goal: {user.goal}</Text>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {["Personal", "Exercise", "Diet Plan", "Details"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => {
                if (tab === "Exercise") router.push("/ExercisePlan");
                else if (tab === "Diet Plan") router.push("/DietPlan");
                else setActiveTab(tab);
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
              { icon: "calendar-outline", label: "Birthday", value: user.birthday },
              { icon: "male-female-outline", label: "Gender", value: user.gender },
              { icon: "call-outline", label: "Contact", value: user.contact },
              { icon: "mail-outline", label: "Email", value: user.email },
              { icon: "information-circle-outline", label: "Status", value: user.status },
            ].map((item, index) => (
              <View style={styles.infoRow} key={index}>
                <View style={styles.iconBox}>
                  <Ionicons name={item.icon} size={24} color="#9e9e9e" />
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
            <Text style={styles.sectionTitle}>Onboarding Details</Text>
            {[
              { label: "Fitness Goals", value: user.fitnessGoals.join(", ") },
              { label: "Preferences", value: user.specificPreferences },
              { label: "Exercise Frequency", value: user.exerciseFrequency },
              { label: "Activities", value: user.physicalActivities },
              { label: "Fitness Level", value: user.fitnessLevel },
              { label: "Dietary Restrictions", value: user.dietaryRestrictions },
              { label: "Nutrition Rating", value: user.nutritionHabitsRating },
              { label: "Need Nutrition Assistance", value: user.needNutritionAssistance },
              { label: "Available Days", value: user.availableDays },
              { label: "Equipment", value: user.equipmentAccess.join(", ") },
              { label: "Occupation", value: user.occupation },
              { label: "Stress Level", value: user.stressLevel },
              { label: "Sleep Hours", value: user.sleepHours },
              { label: "Alcohol/Smoking", value: user.alcoholSmoking },
              { label: "Medical Conditions", value: user.medicalConditions },
              { label: "Medications", value: user.medications },
              { label: "Injuries", value: user.injuries },
              { label: "Doctor Clearance", value: user.doctorClearance },
            ].map((item, index) => (
              <View style={styles.infoRow} key={index}>
                <View style={styles.textBox}>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  <Text style={styles.infoValue}>{item.value}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

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
                { key: "Weight", value: "80 kg" },
                { key: "Steps", value: "10,000" },
              ].map((item) => (
                <TouchableOpacity
                  style={styles.modalRow}
                  key={item.key}
                  onPress={() => handleMeasurementClick(item.key)}
                >
                  <Text style={styles.modalRowKey}>{item.key}</Text>
                  <Text style={styles.modalRowValue}>{item.value}</Text>
                </TouchableOpacity>
              ))}

              {/* One-Time */}
              <Text style={styles.sectionTitle}>One-Time</Text>
              {[
                { key: "Height", value: "175 cm" },
              ].map((item) => (
                <TouchableOpacity
                  style={styles.modalRow}
                  key={item.key}
                  onPress={() => handleMeasurementClick(item.key)}
                >
                  <Text style={styles.modalRowKey}>{item.key}</Text>
                  <Text style={styles.modalRowValue}>{item.value}</Text>
                </TouchableOpacity>
              ))}

              {/* Weekly */}
              <Text style={styles.sectionTitle}>Weekly</Text>
              {[
                { key: "Shoulders", value: "105 cm" },
                { key: "Chest", value: "95 cm" },
                { key: "Neck", value: "40 cm" },
                { key: "Waist", value: "78 cm" },
                { key: "Hips", value: "98 cm" },
                { key: "Left Bicep", value: "35 cm" },
                { key: "Right Bicep", value: "35 cm" },
                { key: "Left Forearm", value: "30 cm" },
                { key: "Right Forearm", value: "30 cm" },
                { key: "Left Thigh", value: "55 cm" },
                { key: "Right Thigh", value: "55 cm" },
                { key: "Left Calf", value: "38 cm" },
                { key: "Right Calf", value: "38 cm" },
              ].map((item) => (
                <TouchableOpacity
                  style={styles.modalRow}
                  key={item.key}
                  onPress={() => handleMeasurementClick(item.key)}
                >
                  <Text style={styles.modalRowKey}>{item.key}</Text>
                  <Text style={styles.modalRowValue}>{item.value}</Text>
                </TouchableOpacity>
              ))}
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

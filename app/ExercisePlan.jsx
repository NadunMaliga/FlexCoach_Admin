import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold } from "@expo-google-fonts/poppins";
import { useNavigation } from "@react-navigation/native";

export default function ExercisePlan() {
  const navigation = useNavigation();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });

  // Example data for 4 days
  const schedules = [
    { day: "Day 1", detail: "Exercise 5 - Duration 50 min" },
    { day: "Day 2", detail: "Exercise 4 - Duration 45 min" },
    { day: "Day 3", detail: "Exercise 6 - Duration 60 min" },
    { day: "Day 4", detail: "Exercise 3 - Duration 40 min" },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>

      <Text style={styles.text}>
        This Client workout will be updated here according to Client schedule that Cleint receive and Client will receive it. Click on that schedule and see the full details. All the information is there.
      </Text>

      {/* Schedule List */}
      {schedules.map((item, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => navigation.navigate("ProfileSchedules", { day: item.day })}
        >
          <View style={styles.card}>
            {/* Left Icon */}
            <View style={styles.iconWrapper}>
              <Svg
                width={30}
                height={30}
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth={1.9}
                stroke="#fff"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <Path d="M13 21H5C3.89543 21 3 20.1046 3 19V10H21V15M15 4V2M15 4V6M15 4H10.5" />
                <Path d="M3 10V6C3 4.89543 3.89543 4 5 4H7" />
                <Path d="M7 2V6" />
                <Path d="M21 10V6C21 4.89543 20.1046 4 19 4H18.5" />
                <Path d="M16 20L18 22L22 18" />
              </Svg>
            </View>

            {/* Info */}
            <View style={styles.infoContainer}>
              <Text style={styles.title}>{item.day}</Text>
              <Text style={styles.dateRange}>{item.detail}</Text>
            </View>

            {/* Right Arrow */}
            <Svg
              width={18}
              height={18}
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="#999"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <Path d="M9 18l6-6-6-6" />
            </Svg>
          </View>
        </TouchableOpacity>
      ))}
      {/* Floating Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={() => { }}>
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>

    </ScrollView>

  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  backButton: {
    marginBottom: 15,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1c1c1c",
    borderRadius: 50,
    padding: 17,
    marginBottom: 15,
    justifyContent: "space-between",
  },
  iconWrapper: {
    backgroundColor: "#3a3a3aff",
    padding: 19,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: "#777777ff",
    textAlign: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
  },
  infoContainer: { flex: 1, marginLeft: 15 },
  title: {
    fontSize: 19,
    fontWeight: "300",
    color: "#ffffffff",
    fontFamily: "Poppins_400Regular",
  },
  dateRange: { fontSize: 14, color: "#999", fontFamily: "Poppins_400Regular" },
  
});

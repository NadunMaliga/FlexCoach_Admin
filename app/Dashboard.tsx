import React from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  ScrollView, 
  Image, 
  SafeAreaView 
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import Svg, { Path } from "react-native-svg";

export default function Dashboard() {
  const measurements = [
    { name: "Total Clients", value: "1200", updated: "95%" },
    { name: "Active Clients", value: "875", updated: "73%" },
    { name: "New Clients", value: "125", updated: "25%" },
  ];

  const recentUsers = [
    { id: 1, name: "John Doe", daysAgo: 2, status: "Active", avatar: "https://i.pinimg.com/736x/8c/6d/db/8c6ddb5fe6600fcc4b183cb2ee228eb7.jpg" },
    { id: 2, name: "Jane Smith", daysAgo: 4, status: "Inactive", avatar: "https://i.pinimg.com/736x/3b/2d/23/3b2d2393c14ec7650927614922186347.jpg" },
    { id: 3, name: "Chris Brown", daysAgo: 5, status: "Active", avatar: "https://i.pinimg.com/1200x/33/68/c4/3368c4cf650b851ed3f13b87bc882db9.jpg" },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={{ paddingBottom: 140 }} // 🔼 extra space for navbar
      >
        {/* Greeting */}
        <View style={styles.greetingContainer}>
          <View style={styles.profileWrapper}>
            <Image
              source={{
                uri: "https://i.pinimg.com/736x/6f/a3/6a/6fa36aa2c367da06b2a4c8ae1cf9ee02.jpg",
              }}
              style={styles.profilePic}
            />
            <View style={styles.onlineBadge} />
          </View>
          <View style={styles.greetingTextContainer}>
            <Text style={styles.helloText}>Hello, FlexCoach</Text>
            <Text style={styles.startDayText}>Let's start your day</Text>
          </View>
        </View>

        {/* Horizontal Cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          {measurements.map((item, index) => (
            <View key={index} style={styles.measureBox}>
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
            </View>
          ))}
        </ScrollView>

        {/* Line Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Client Overview</Text>
          <LineChart
            data={{
              labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
              datasets: [{ data: [1000, 1050, 1080, 1100, 1130, 1150, 1200] }],
            }}
            width={Dimensions.get("window").width - 40}
            height={220}
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: "#404040ff",
              backgroundGradientFrom: "#000",
              backgroundGradientTo: "#000",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(213, 255, 95, ${opacity})`, // 🔹 #d5ff5f
              labelColor: (opacity = 1) => `rgba(200,200,200,${opacity})`,
              propsForDots: { r: "5", strokeWidth: "2", stroke: "#d5ff5f" },
            }}
            bezier
            style={{ borderRadius: 15 }}
          />
        </View>

        {/* Recent Activity */}
        <View style={{ marginTop: 30 }}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {recentUsers.map(user => (
            <View key={user.id} style={styles.userRow}>
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>{user.name}</Text>
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
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 20 },
  measureBox: { width: 180, backgroundColor: "#1c1c1c", padding: 25, borderRadius: 25, marginRight: 15, position: "relative" },
  measureName: { fontSize: 18, fontWeight: "300", color: "#fff", marginBottom: 5 },
  measureValue: { fontSize: 30, fontWeight: "400", color: "#f2f2f2ff", marginTop: 10 },
  measureUpdated: { fontSize: 13, color: "#999", fontWeight: "300", marginTop: 5 },
  arrowIcon: { position: "absolute", padding: 13, bottom: 10, right: 20, backgroundColor: "#171717ff", borderRadius: 20 },
  chartContainer: { marginTop: 20, alignItems: "center" },
  sectionTitle: { color: "white", fontSize: 20, fontWeight: "300", marginBottom: 10 },
  userRow: { flexDirection: "row", alignItems: "center", padding: 10, borderRadius: 12, marginBottom: 5 },
  avatar: { width: 60, height: 60, borderRadius: 50, marginRight: 15 },
  userName: { color: "white", fontSize: 19, fontWeight: "400" },
  userJoined: { color: "#aaa", fontSize: 13 },

  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  active: {
    backgroundColor: "#a2f4a6ff",
  },
  inactive: {
    backgroundColor: "#555",
  },
  statusText: {
    fontSize: 13,
    fontWeight: "400",
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
  helloText: { fontSize: 23, fontWeight: "600", color: "#eaeaea" },
  startDayText: { fontSize: 15, color: "#939393" },
});

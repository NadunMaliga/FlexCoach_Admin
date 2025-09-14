import React from "react";
import { View, Text, StyleSheet, Dimensions, ScrollView, Image } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import Svg, { Path } from "react-native-svg";

export default function Dashboard() {
  const measurements = [
    { name: "Total Clients", value: "1200", updated: "95%" },
    { name: "Active Clients", value: "875", updated: "73%" },
    { name: "New Clients", value: "125", updated: "25%" },
  ];

  const recentUsers = [
    { id: 1, name: "John Doe", daysAgo: 2, avatar: "https://i.pinimg.com/736x/8c/6d/db/8c6ddb5fe6600fcc4b183cb2ee228eb7.jpg" },
    { id: 2, name: "Jane Smith", daysAgo: 4, avatar: "https://i.pinimg.com/736x/3b/2d/23/3b2d2393c14ec7650927614922186347.jpg" },
    { id: 3, name: "Chris Brown", daysAgo: 5, avatar: "https://i.pinimg.com/1200x/33/68/c4/3368c4cf650b851ed3f13b87bc882db9.jpg" },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      
      {/* Horizontal Cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
        {measurements.map((item, index) => (
          <View key={index} style={styles.measureBox}>
            <Text style={styles.measureName}>{item.name}</Text>
            <Text style={styles.measureValue}>{item.value}</Text>
            <Text style={styles.measureUpdated}>{item.updated}</Text>
            <Svg width={12} height={12} viewBox="0 0 24 24" strokeWidth={1.7} fill="none" stroke="#7c7c7cff" strokeLinecap="round" strokeLinejoin="round" style={styles.arrowIcon}>
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
            labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
            datasets: [{ data: [1000,1050,1080,1100,1130,1150,1200] }]
          }}
          width={Dimensions.get("window").width - 40}
          height={220}
          yAxisSuffix=""
          chartConfig={{
            backgroundColor:"#404040ff",
            backgroundGradientFrom:"#000",
            backgroundGradientTo:"#000",
            decimalPlaces:0,
            color: (opacity = 1) => `rgba(0,200,255,${opacity})`,
            labelColor: (opacity = 1) => `rgba(200,200,200,${opacity})`,
            propsForDots: { r:"5", strokeWidth:"2", stroke:"#00c8ff" },
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
            <Image source={{ uri: user.avatar }} style={styles.avatar}/>
            <View>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userJoined}>Joined {user.daysAgo} days ago</Text>
            </View>
          </View>
        ))}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 20 },
  measureBox: { width: 180, backgroundColor: "#1c1c1c", padding: 25, borderRadius: 25, marginRight: 15, position: "relative" },
  measureName: { fontSize: 18, fontWeight: "300", color: "#fff", marginBottom: 5 },
  measureValue: { fontSize: 30, fontWeight: "400", color: "#f2f2f2ff", marginTop: 10 },
  measureUpdated: { fontSize: 13, color: "#999", fontWeight: "300", marginTop: 5 },
  arrowIcon: { position: "absolute", padding: 13, bottom: 10, right: 20, backgroundColor: "#171717ff", borderRadius: 20, },
  chartContainer: { marginTop:20, alignItems:"center", },
  sectionTitle: { color:"white", fontSize:20, fontWeight:"600", marginBottom:10 },
  userRow: { flexDirection:"row", alignItems:"center", padding:10, borderRadius:12, marginBottom:5},
  avatar: { width:60, height:60, borderRadius:50, marginRight:15 },
  userName: { color:"white", fontSize:19, fontWeight:"600" },
  userJoined: { color:"#aaa", fontSize:14 },
});

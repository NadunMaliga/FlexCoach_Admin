import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "expo-router";
import Svg, { Path } from "react-native-svg";

// Import tab components
import Dashboard from "./Dashboard";
import Clients from "./Clients";
import Exercise from "./Exercise";
import Foods from "./Foods";   // 👈 Foods import karala

// ------------------- SVG ICONS -------------------
const homeSVG = (color, size) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 21H7C4.79086 21 3 19.2091 3 17V10.7076C3 9.30887 3.73061 8.01175 4.92679 7.28679L9.92679 4.25649C11.2011 3.48421 12.7989 3.48421 14.0732 4.25649L19.0732 7.28679C20.2694 8.01175 21 9.30887 21 10.7076V17C21 19.2091 19.2091 21 17 21H15M9 21V17C9 15.3431 10.3431 14 12 14V14C13.6569 14 15 15.3431 15 17V21M9 21H15"/>
  </Svg>
);

const exerciseSVG = (color, size) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M15 4V2M15 4V6M15 4H10.5M3 10V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V10H3Z"/>
    <Path d="M3 10V6C3 4.89543 3.89543 4 5 4H7"/>
    <Path d="M7 2V6"/>
    <Path d="M21 10V6C21 4.89543 20.1046 4 19 4H18.5"/>
  </Svg>
);

const clientsSVG = (color, size) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M1 20V19C1 15.134 4.13401 12 8 12V12C11.866 12 15 15.134 15 19V20"/>
    <Path d="M13 14V14C13 11.2386 15.2386 9 18 9V9C20.7614 9 23 11.2386 23 14V14.5"/>
    <Path d="M8 12C10.2091 12 12 10.2091 12 8C12 5.79086 10.2091 4 8 4C5.79086 4 4 5.79086 4 8C4 10.2091 5.79086 12 8 12Z"/>
    <Path d="M18 9C19.6569 9 21 7.65685 21 6C21 4.34315 19.6569 3 18 3C16.3431 3 15 4.34315 15 6C15 7.65685 16.3431 9 18 9Z"/>
  </Svg>
);

const foodsSVG = (color, size) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 3H20M4 9H20M4 15H20M4 21H20" />  
  </Svg>
);

// ------------------- HOME COMPONENT -------------------
export default function Home() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      headerTitle: activeTab,
      headerStyle: { backgroundColor: "black" },
      headerTintColor: "white",
    });
  }, [activeTab]);

  const renderContent = () => {
    switch (activeTab) {
      case "Dashboard":
        return <Dashboard />;
      case "Clients":
        return <Clients />;
      case "Exercise":
        return <Exercise />;
      case "Foods":       // 👈 Foods tab
        return <Foods />;
      default:
        return <Dashboard />;
    }
  };

  const tabs = [
    { name: "Dashboard", label: "Home", svg: homeSVG },
    { name: "Clients", label: "Clients", svg: clientsSVG },
    { name: "Exercise", label: "Exercise", svg: exerciseSVG },
    { name: "Foods", label: "Foods", svg: foodsSVG }, // 👈 Foods tab
  ];

  return (
    <View style={styles.container}>
      <View style={styles.content}>{renderContent()}</View>

      <View style={styles.bottomNav}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.name;
          return (
            <TouchableOpacity
              key={tab.name}
              style={[styles.navItem, isActive && styles.activeNavItem]}
              onPress={() => setActiveTab(tab.name)}
            >
              {tab.svg(isActive ? "#d5ff5f" : "#fff", 28)}
              <Text style={[styles.navText, isActive && { color: "#d5ff5f" }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ------------------- STYLES -------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  content: { flex: 1 },
  bottomNav: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "rgba(44, 44, 44, 1)",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 40,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 6,
    width: "90%",
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  navText: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
    textAlign: "center",
  },
  activeNavItem: {
    backgroundColor: "#a7ff5f28",
    paddingHorizontal: 20,
    borderRadius: 20,
  },
});

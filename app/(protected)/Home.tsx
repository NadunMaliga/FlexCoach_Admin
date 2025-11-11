import { useNavigation } from "expo-router";
import React from "react";
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import HapticFeedback from '../utils/haptics';

const AnimatedView = Animated.View as any;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Import tab components
import Clients from "./Clients";
import Dashboard from "./Dashboard";
import Exercise from "./Exercise";
import Foods from "./Foods";

// ------------------- SVG ICONS -------------------
const homeSVG = (color: string, size: number) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 21H7C4.79086 21 3 19.2091 3 17V10.7076C3 9.30887 3.73061 8.01175 4.92679 7.28679L9.92679 4.25649C11.2011 3.48421 12.7989 3.48421 14.0732 4.25649L19.0732 7.28679C20.2694 8.01175 21 9.30887 21 10.7076V17C21 19.2091 19.2091 21 17 21H15M9 21V17C9 15.3431 10.3431 14 12 14V14C13.6569 14 15 15.3431 15 17V21M9 21H15" />
  </Svg>
);

const exerciseSVG = (color: string, size: number) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M15 4V2M15 4V6M15 4H10.5M3 10V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V10H3Z" />
    <Path d="M3 10V6C3 4.89543 3.89543 4 5 4H7" />
    <Path d="M7 2V6" />
    <Path d="M21 10V6C21 4.89543 20.1046 4 19 4H18.5" />
  </Svg>
);

const clientsSVG = (color: string, size: number) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M1 20V19C1 15.134 4.13401 12 8 12V12C11.866 12 15 15.134 15 19V20" />
    <Path d="M13 14V14C13 11.2386 15.2386 9 18 9V9C20.7614 9 23 11.2386 23 14V14.5" />
    <Path d="M8 12C10.2091 12 12 10.2091 12 8C12 5.79086 10.2091 4 8 4C5.79086 4 4 5.79086 4 8C4 10.2091 5.79086 12 8 12Z" />
    <Path d="M18 9C19.6569 9 21 7.65685 21 6C21 4.34315 19.6569 3 18 3C16.3431 3 15 4.34315 15 6C15 7.65685 16.3431 9 18 9Z" />
  </Svg>
);

const foodsSVG = (color: string, size: number) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    {/* Apple icon from DietPlan */}
    <Path d="M12.1471 21.2646L12 21.2351L11.8529 21.2646C9.47627 21.7399 7.23257 21.4756 5.59352 20.1643C3.96312 18.86 2.75 16.374 2.75 12C2.75 7.52684 3.75792 5.70955 5.08541 5.04581C5.77977 4.69863 6.67771 4.59759 7.82028 4.72943C8.96149 4.86111 10.2783 5.21669 11.7628 5.71153L12.0235 5.79841L12.2785 5.69638C14.7602 4.70367 16.9909 4.3234 18.5578 5.05463C20.0271 5.7403 21.25 7.39055 21.25 12C21.25 16.374 20.0369 18.86 18.4065 20.1643C16.7674 21.4756 14.5237 21.7399 12.1471 21.2646Z" />
    <Path d="M12 5.5C12 3 11 2 9 2" />
  </Svg>
);

// ------------------- HOME COMPONENT -------------------
export default function Home() {
  const [activeTab, setActiveTab] = React.useState("Dashboard");
  const [clientsFilter, setClientsFilter] = React.useState("All");
  const navigation = useNavigation();

  // Track previous tab index for slide direction
  const previousTabIndex = React.useRef(0);

  // Animation values for each tab (opacity)
  const dashboardAnim = React.useRef(new Animated.Value(1)).current;
  const clientsAnim = React.useRef(new Animated.Value(0)).current;
  const exerciseAnim = React.useRef(new Animated.Value(0)).current;
  const foodsAnim = React.useRef(new Animated.Value(0)).current;

  // Animation values for slide position
  const dashboardSlide = React.useRef(new Animated.Value(0)).current;
  const clientsSlide = React.useRef(new Animated.Value(0)).current;
  const exerciseSlide = React.useRef(new Animated.Value(0)).current;
  const foodsSlide = React.useRef(new Animated.Value(0)).current;

  // Map tab names to their animation values
  const tabAnimations = {
    Dashboard: dashboardAnim,
    Clients: clientsAnim,
    Exercise: exerciseAnim,
    Foods: foodsAnim,
  };

  const tabSlideAnimations = {
    Dashboard: dashboardSlide,
    Clients: clientsSlide,
    Exercise: exerciseSlide,
    Foods: foodsSlide,
  };

  const tabs = [
    { name: "Dashboard", label: "Home", svg: homeSVG },
    { name: "Clients", label: "Clients", svg: clientsSVG },
    { name: "Exercise", label: "Exercise", svg: exerciseSVG },
    { name: "Foods", label: "Foods", svg: foodsSVG },
  ];

  // Function to switch to Clients tab with specific filter
  const switchToClientsTab = (filter: string) => {
    setClientsFilter(filter);
    animateTabSwitch("Clients");
  };

  // Animate tab switching with directional slide
  const animateTabSwitch = (newTab: string) => {
    const currentAnim = tabAnimations[activeTab as keyof typeof tabAnimations];
    const newAnim = tabAnimations[newTab as keyof typeof tabAnimations];
    const currentSlide = tabSlideAnimations[activeTab as keyof typeof tabSlideAnimations];
    const newSlide = tabSlideAnimations[newTab as keyof typeof tabSlideAnimations];

    // Determine slide direction
    const currentIndex = tabs.findIndex(t => t.name === activeTab);
    const newIndex = tabs.findIndex(t => t.name === newTab);
    const isMovingRight = newIndex > currentIndex;

    // Set initial position for incoming tab
    newSlide.setValue(isMovingRight ? SCREEN_WIDTH : -SCREEN_WIDTH);

    // Animate: slide out current, slide in new
    Animated.parallel([
      // Fade and slide out current tab
      Animated.timing(currentAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(currentSlide, {
        toValue: isMovingRight ? -SCREEN_WIDTH * 0.2 : SCREEN_WIDTH * 0.2,
        duration: 120,
        useNativeDriver: true,
      }),
      // Fade and slide in new tab
      Animated.timing(newAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(newSlide, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setActiveTab(newTab);
      previousTabIndex.current = newIndex;
      // Reset the old tab's position
      currentSlide.setValue(0);
    });
  };

  // Update header title when active tab changes
  React.useEffect(() => {
    const getHeaderTitle = () => {
      switch (activeTab) {
        case "Dashboard":
          return "Dashboard";
        case "Clients":
          return "Clients";
        case "Exercise":
          return "Exercises";
        case "Foods":
          return "Foods";
        default:
          return "Dashboard";
      }
    };

    navigation.setOptions({
      headerTitle: getHeaderTitle(),
    });
  }, [activeTab, navigation]);

  // Render all tabs but only show the active one
  // This keeps components mounted and prevents reloading
  const renderContent = () => {
    return (
      <View style={{ flex: 1 }}>
        <AnimatedView
          style={[
            activeTab === "Dashboard" ? styles.visible : styles.hidden,
            {
              opacity: dashboardAnim,
              transform: [{ translateX: dashboardSlide }]
            }
          ]}
        >
          <Dashboard onNavigateToClients={switchToClientsTab} />
        </AnimatedView>
        <AnimatedView
          style={[
            activeTab === "Clients" ? styles.visible : styles.hidden,
            {
              opacity: clientsAnim,
              transform: [{ translateX: clientsSlide }]
            }
          ]}
        >
          <Clients initialFilter={clientsFilter} />
        </AnimatedView>
        <AnimatedView
          style={[
            activeTab === "Exercise" ? styles.visible : styles.hidden,
            {
              opacity: exerciseAnim,
              transform: [{ translateX: exerciseSlide }]
            }
          ]}
        >
          <Exercise />
        </AnimatedView>
        <AnimatedView
          style={[
            activeTab === "Foods" ? styles.visible : styles.hidden,
            {
              opacity: foodsAnim,
              transform: [{ translateX: foodsSlide }]
            }
          ]}
        >
          <Foods />
        </AnimatedView>
      </View>
    );
  };

  // Animation values for tab bar icons
  const tabIconAnims = React.useRef(
    tabs.map(() => new Animated.Value(1))
  ).current;

  // Sliding bubble indicator animation
  const bubblePosition = React.useRef(new Animated.Value(0)).current;
  const bubbleWidth = React.useRef(new Animated.Value(80)).current;

  // Calculate bubble position based on active tab
  React.useEffect(() => {
    const tabIndex = tabs.findIndex(t => t.name === activeTab);
    const navBarWidth = SCREEN_WIDTH * 0.9 > 450 ? 450 : SCREEN_WIDTH * 0.9; // Match nav bar width
    const paddingHorizontal = 15; // Match nav bar padding
    const availableWidth = navBarWidth - (paddingHorizontal * 2); // Subtract padding
    const tabWidth = availableWidth / tabs.length; // Divide equally
    const newPosition = paddingHorizontal + (tabIndex * tabWidth) + (tabWidth - 70) / 2; // Center the bubble

    Animated.spring(bubblePosition, {
      toValue: newPosition,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>{renderContent()}</View>

      <View style={styles.bottomNav}>
        {/* Sliding green bubble indicator */}
        <AnimatedView
          style={[
            styles.bubbleIndicator,
            {
              transform: [{ translateX: bubblePosition }],
            },
          ]}
        />

        {tabs.map((tab) => {
          const isActive = activeTab === tab.name;
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.navItem}
              onPress={() => {
                if (tab.name !== activeTab) {
                  // Haptic feedback on tab press
                  HapticFeedback.light();
                  
                  // Bounce animation on tap
                  const iconIndex = tabs.findIndex(t => t.name === tab.name);
                  Animated.sequence([
                    Animated.spring(tabIconAnims[iconIndex], {
                      toValue: 0.85,
                      friction: 3,
                      tension: 40,
                      useNativeDriver: true,
                    }),
                    Animated.spring(tabIconAnims[iconIndex], {
                      toValue: 1,
                      friction: 3,
                      tension: 40,
                      useNativeDriver: true,
                    }),
                  ]).start();

                  animateTabSwitch(tab.name);
                }
              }}
            >
              <AnimatedView
                style={{
                  transform: [{ scale: tabIconAnims[tabs.findIndex(t => t.name === tab.name)] }]
                }}
              >
                {tab.svg(isActive ? "#d5ff5f" : "#fff", 28)}
              </AnimatedView>
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
  visible: { flex: 1 },
  hidden: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    zIndex: -1
  },
  bottomNav: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    backgroundColor: "rgba(44, 44, 44, 1)",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 40,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 6,
    width: SCREEN_WIDTH * 0.9,
    maxWidth: 450,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 20,
    zIndex: 2,
    flex: 1,
    minWidth: 60,
  },
  navText: {
    fontSize: 11,
    color: "#777",
    marginTop: 4,
    textAlign: "center",
    maxWidth: 70,
  },
  activeNavItem: {
    backgroundColor: "#a7ff5f28",
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  bubbleIndicator: {
    position: 'absolute',
    left: 0,
    top: 10,
    width: 70,
    height: 56,
    backgroundColor: '#a7ff5f28',
    borderRadius: 28,
    zIndex: 1,
  },
});
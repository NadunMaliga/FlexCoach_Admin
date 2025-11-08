// @ts-nocheck
import React, { useEffect, useState } from "react";
import {
Dimensions,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";
import Logger from '../utils/logger';
import { LineChart } from "react-native-chart-kit";
import Svg, { Path } from "react-native-svg";
import { useAuth } from "../contexts/AuthContext";
import ApiService from "../services/api";
import DashboardSkeleton from '../components/DashboardSkeleton';
import LoadingGif from '../components/LoadingGif';



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

export default function Dashboard() {
  const { logout } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [clientOverview, setClientOverview] = useState<ClientOverview | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load client overview and recent users (skip broken stats endpoint for now)
      const [overviewResponse, usersResponse] = await Promise.all([
        ApiService.getClientOverview('7'), // Last 7 days
        ApiService.getUsers({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' })
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
              const profileResponse = await ApiService.getUserProfile(user._id);
              const profilePhoto = profileResponse.success 
                ? profileResponse.userProfile.profilePhoto 
                : null;
              
              Logger.log(`👤 ${user.firstName} ${user.lastName}: ${profilePhoto ? '✅ Has profile photo' : '❌ No profile photo'}`);
              
              return {
                id: user._id,
                name: `${user.firstName} ${user.lastName}`,
                daysAgo: Math.floor((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
                status: user.isActive ? "Active" : "Inactive",
                avatar: profilePhoto || user.profilePhoto || "https://i.pinimg.com/736x/6f/a3/6a/6fa36aa2c367da06b2a4c8ae1cf9ee02.jpg"
              };
            } catch (err) {
              Logger.log(`❌ Profile not found for user ${user.firstName} ${user.lastName} (${user._id}):`, err.message);
              return {
                id: user._id,
                name: `${user.firstName} ${user.lastName}`,
                daysAgo: Math.floor((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
                status: user.isActive ? "Active" : "Inactive",
                avatar: user.profilePhoto || "https://i.pinimg.com/736x/6f/a3/6a/6fa36aa2c367da06b2a4c8ae1cf9ee02.jpg"
              };
            }
          })
        );
        
        setRecentUsers(usersWithProfiles);
      }
    } catch (err) {
      Logger.error('Dashboard load error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#000", justifyContent: 'center', alignItems: 'center' }}>
        <LoadingGif size={100} />
        <Text style={{ color: '#fff', marginTop: 10 }}>Loading dashboard...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#000", justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#ff6b6b', textAlign: 'center', margin: 20 }}>
          Error loading dashboard: {error}
        </Text>
      </SafeAreaView>
    );
  }

  // Use real data from API with fallback to mock data
  const measurements = [
    { 
      name: "Total Clients", 
      value: dashboardData?.totalUsers?.toString() || "1200", 
      updated: "100%" 
    },
    { 
      name: "Active Clients", 
      value: dashboardData?.activeUsers?.toString() || "875", 
      updated: dashboardData?.activeUsersPercentage || "73%" 
    },
    { 
      name: "New Clients", 
      value: dashboardData?.newUsersLast30Days?.toString() || "125", 
      updated: dashboardData?.pendingUsersPercentage || "25%" 
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={{ paddingBottom: 140 }} // extra space for navbar
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

        {/* Recent Activity */}
        <View style={{ marginTop: 30 }}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {recentUsers.map((user: any) => (
            <View key={user.id} style={styles.userRow}>
              <Image 
                source={{ uri: user.avatar }} 
                style={styles.avatar}
                onLoad={() => Logger.success('Dashboard avatar loaded for:', user.name)}
                onError={(error) => Logger.log('❌ Dashboard avatar error for:', user.name, error.nativeEvent.error)}
              />
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
  measureBox: { 
    width: 180, 
    backgroundColor: "#1c1c1c", 
    padding: 25, 
    borderRadius: 25, 
    marginRight: 15, 
    position: "relative" 
  },
  measureName: { fontSize: 18, fontWeight: "300", color: "#fff", marginBottom: 5 },
  measureValue: { fontSize: 30, fontWeight: "400", color: "#f2f2f2ff", marginTop: 10 },
  measureUpdated: { fontSize: 13, color: "#999", fontWeight: "300", marginTop: 5 },
  arrowIcon: { 
    position: "absolute", 
    padding: 13, 
    bottom: 10, 
    right: 20, 
    backgroundColor: "#171717ff", 
    borderRadius: 20 
  },
  chartContainer: { marginTop: 20, alignItems: "center" },
  sectionTitle: { color: "white", fontSize: 20, fontWeight: "300", marginBottom: 10 },
  userRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    padding: 10, 
    borderRadius: 12, 
    marginBottom: 5 
  },
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
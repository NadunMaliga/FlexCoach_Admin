import {
    Poppins_400Regular,
    Poppins_500Medium,
    useFonts,
} from "@expo-google-fonts/poppins";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Logger from '../utils/logger';
import Svg, { Path } from "react-native-svg";
import OfflineApiService from "../services/OfflineApiService";
import DietHistorySkeleton from '../components/DietHistorySkeleton';
import { Feather } from "@expo/vector-icons";


export default function DietHistory() {
    const [selectedMeal, setSelectedMeal] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState([]);
    const { userId } = useLocalSearchParams();

    // Use the passed userId or fallback to test user ID for development
    const effectiveUserId = userId || "68e8fd08e8d1859ebd9edd05";

    // Debug logging to verify userId is being passed correctly
    Logger.log('DietHistory - Received userId:', userId);
    Logger.log('DietHistory - Using effectiveUserId:', effectiveUserId);

    const [fontsLoaded] = useFonts({
        Poppins_400Regular,
        Poppins_500Medium,
    });

    // Fetch diet history from backend
    const loadDietHistory = useCallback(async () => {
        try {
            setLoading(true);
            Logger.log('Loading diet history for userId:', effectiveUserId);

            const response = await OfflineApiService.getUserDietPlans(effectiveUserId);
            Logger.log('API response:', response);

            if (response.success && response.dietPlans && response.dietPlans.length > 0) {
                // Transform API data to history format grouped by date
                const historyMap = {};

                response.dietPlans.forEach((dietPlan) => {
                    const date = new Date(dietPlan.createdAt).toISOString().split('T')[0];

                    if (!historyMap[date]) {
                        historyMap[date] = {
                            date,
                            meals: [],
                            totalPlans: 0,
                            totalCalories: 0
                        };
                    }

                    // Transform meal data
                    const mealDetails = {};
                    let planCalories = 0;
                    dietPlan.meals.forEach(meal => {
                        const foodList = meal.foods.map(food => {
                            // Reconstruct the original user input from quantity + unit
                            let displayText;
                            if (food.unit && food.unit !== 'serving' && food.unit !== '') {
                                displayText = `${food.foodName} ${food.quantity} ${food.unit}`;
                            } else {
                                displayText = `${food.foodName} ${food.quantity}`;
                            }
                            return displayText;
                        }).join('\n');

                        mealDetails[meal.time] = foodList || meal.instructions || `${meal.name} - ${meal.totalCalories} calories`;
                        planCalories += meal.totalCalories || 0;
                    });

                    historyMap[date].meals.push({
                        _id: dietPlan._id,
                        name: dietPlan.name,
                        details: mealDetails,
                        dietType: dietPlan.dietType,
                        totalCalories: dietPlan.totalDailyCalories || planCalories
                    });

                    historyMap[date].totalPlans += 1;
                    historyMap[date].totalCalories += dietPlan.totalDailyCalories || planCalories;
                });

                // Convert to array and sort by date (newest first)
                const historyArray = Object.values(historyMap).sort((a, b) =>
                    new Date(b.date) - new Date(a.date)
                );

                setHistory(historyArray);
                Logger.log('Loaded history:', historyArray.length, 'days');
            } else {
                // No diet history found
                setHistory([]);
            }
        } catch (err) {
            Logger.error('Load diet history error:', err);
            // Show empty state on error
            setHistory([]);
        } finally {
            setLoading(false);
        }
    }, [effectiveUserId]);

    // Refresh data when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            if (effectiveUserId) {
                loadDietHistory();
            }
        }, [effectiveUserId, loadDietHistory])
    );

    if (!fontsLoaded) return null;

    const openMealModal = (meal) => {
        setSelectedMeal(meal);
        setModalVisible(true);
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <DietHistorySkeleton count={3} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#000" }}>
            {/* Scroll Content */}
            <ScrollView
                style={styles.container}
                contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.text}>
                    This Client diet history will be updated here. Click on a meal and see the
                    full details. All the information is there.
                </Text>

                {/* History List */}
                {history.length > 0 ? (
                    history.map((day, dayIndex) => (
                        <View key={dayIndex} style={styles.daySection}>
                            {/* Date Header */}
                            <View style={styles.dateHeader}>
                                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#cacacaff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                    <Path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
                                </Svg>
                                <Text style={styles.dateText}>
                                    {new Date(day.date).toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </Text>
                            </View>

                            {/* Meals for this day */}
                            {day.meals.map((meal, mealIndex) => (
                                <TouchableOpacity
                                    key={mealIndex}
                                    onPress={() => openMealModal(meal)}
                                >
                                    <View style={styles.card}>
                                        <View style={styles.infoContainer}>
                                            <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
                                                {meal.name.length > 15 ? meal.name.substring(0, 15) + '...' : meal.name}
                                            </Text>
                                            <Text style={styles.dateRange}>
                                                {meal.totalCalories ? `${meal.totalCalories} calories` : 'Tap to view details'}
                                            </Text>
                                        </View>
                                        <Feather name="chevron-right" size={20} color="#999" />
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Svg
                            width={60}
                            height={60}
                            viewBox="0 0 24 24"
                            fill="none"
                            strokeWidth={1.5}
                            stroke="#666"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <Path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
                        </Svg>
                        <Text style={styles.emptyTitle}>No Diet History</Text>
                        <Text style={styles.emptySubtitle}>
                            You don't have any diet history yet.{'\n'}
                            Create some diet plans to see them here.
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Modal for Meal Details */}
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
                            contentContainerStyle={{ paddingBottom: 20 }}
                            showsVerticalScrollIndicator={false}
                        >
                            <Text style={styles.modalTitle}>{selectedMeal?.name}</Text>
                            <Text style={styles.modalSub}>Full diet details from morning to dinner</Text>
                            {selectedMeal &&
                                Object.entries(selectedMeal.details).map(([key, value], idx) => (
                                    <View key={idx} style={styles.modalRow}>
                                        <Text style={styles.modalRowKey}>{key}</Text>
                                        <Text style={styles.modalRowValue}>{value}</Text>
                                    </View>
                                ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#000" },
    card: {
        flexDirection: "row",
        alignItems: "flex-start",
        padding: 10,
        marginBottom: 15,
        justifyContent: "space-between",
        width: '100%',
    },
    text: {
        color: "#777",
        textAlign: "center",
        paddingHorizontal: 20,
        paddingVertical: 10,
        fontFamily: "Poppins_300Light",
        fontSize: 14,
    },
    mtext: {
        color: "#fff",
        textAlign: "center",
        fontFamily: "Poppins_400Regular",
        fontSize: 25,
    },
    daySection: {
        marginTop: 20,
        marginBottom: 10,
    },
    dateHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 15,
        paddingHorizontal: 10,
    },
    dateText: {
        color: "#c0c0c0ff",
        fontSize: 16,
        fontFamily: "Poppins_300Light",
    },
    infoContainer: { flex: 1, marginRight: 10 },
    title: {
        fontSize: 19,
        color: "#a6a5a5ff",
        fontFamily: "Poppins_300Light",
    },
    dateRange: { fontSize: 14, color: "#999", fontFamily: "Poppins_300Light" },

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
        fontFamily: "Poppins_300Light",

    },
    modalSub: {
        color: "#aaa",
        fontSize: 15,
        marginBottom: 20,
        textAlign: "center",
        fontFamily: "Poppins_300Light",

    },
    modalRow: {
        marginBottom: 15,
        borderBottomWidth: 0.5,
        borderBottomColor: "#333",
        paddingBottom: 10,
    },
    modalRowKey: {
        color: "#f5f5f5",
        fontSize: 16,
        fontFamily: "Poppins_300Light",
    },
    modalRowValue: {
        color: "#bbb",
        fontSize: 14,
        fontFamily: "Poppins_300Light",
        lineHeight: 20,
    },
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    emptyTitle: {
        color: "#fff",
        fontSize: 20,
        fontFamily: "Poppins_500Medium",
        marginTop: 20,
        marginBottom: 10,
    },
    emptySubtitle: {
        color: "#777",
        fontSize: 14,
        fontFamily: "Poppins_400Regular",
        textAlign: "center",
        lineHeight: 20,
    },
});

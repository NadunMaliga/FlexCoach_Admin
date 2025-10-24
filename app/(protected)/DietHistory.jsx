import { Poppins_400Regular, Poppins_500Medium, useFonts } from "@expo-google-fonts/poppins";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import ApiService from "../services/api";

export default function DietHistory() {
    const [selectedMeal, setSelectedMeal] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState([]);
    const { userId } = useLocalSearchParams();

    // Use the passed userId or fallback to test user ID for development
    const effectiveUserId = userId || "68e8fd08e8d1859ebd9edd05";
    
    // Debug logging to verify userId is being passed correctly
    console.log('DietHistory - Received userId:', userId);
    console.log('DietHistory - Using effectiveUserId:', effectiveUserId);

    const [fontsLoaded] = useFonts({
        Poppins_400Regular,
        Poppins_500Medium,
    });

    // Fetch diet history from backend
    const loadDietHistory = useCallback(async () => {
        try {
            setLoading(true);
            console.log('Loading diet history for userId:', effectiveUserId);

            // Try the new diet history API first
            try {
                const response = await ApiService.getDietHistory(effectiveUserId, {
                    limit: 50,
                    groupBy: 'date'
                });
                console.log('Diet history API response:', response);

                if (response.success && response.history && response.history.length > 0) {
                    // The API already returns data in the correct format for the UI
                    setHistory(response.history);
                    console.log('Loaded history:', response.history.length, 'days');
                    return;
                }
            } catch (apiError) {
                console.log('New diet history API not available, falling back to getUserDietPlans');
                
                // Fallback to the original API
                const fallbackResponse = await ApiService.getUserDietPlans(effectiveUserId);
                console.log('Fallback API response:', fallbackResponse);

                if (fallbackResponse.success && fallbackResponse.dietPlans && fallbackResponse.dietPlans.length > 0) {
                    // Transform API data to history format grouped by date
                    const historyMap = {};
                    
                    fallbackResponse.dietPlans.forEach((dietPlan) => {
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
                            const foodList = meal.foods.map(food => 
                                `${food.foodName} ${food.quantity}${food.unit}`
                            ).join('\n');
                            
                            mealDetails[meal.time] = foodList || meal.instructions || `${meal.name} - ${meal.totalCalories} calories`;
                            planCalories += meal.totalCalories || 0;
                        });

                        historyMap[date].meals.push({
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
                    console.log('Loaded fallback history:', historyArray.length, 'days');
                    return;
                }
            }
            
            // No diet history found
            setHistory([]);
        } catch (err) {
            console.error('Load diet history error:', err);
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
            <View style={[{ flex: 1, backgroundColor: "#000" }, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#d5ff5f" />
                <Text style={{ color: '#fff', marginTop: 10, fontFamily: "Poppins_400Regular" }}>
                    Loading diet history...
                </Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#000" }}>
            <Text style={styles.header}>Diet History</Text>
            <Text style={styles.text}>
                This Client diet History will be updated here. Click on a meal and see the
                full details. All the information is there.
            </Text>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                {history.length > 0 ? (
                    history.map((day, index) => (
                        <View key={index} style={styles.dayCard}>
                            <View style={styles.dateRow}>
                                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
                                    <Path d="M3 8h18M3 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M19 8V6a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v2M3 8v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8" />
                                </Svg>
                                <Text style={styles.dateText}>{day.date}</Text>
                            </View>

                            {/* Meals for this day */}
                            <View style={{ marginTop: 10 }}>
                                {day.meals.map((meal, idx) => (
                                    <TouchableOpacity key={idx} onPress={() => openMealModal(meal)}>
                                        <View style={styles.mealCard}>
                                            <Text style={styles.mealText}>{meal.name}</Text>
                                            <Svg width={18} height={18} viewBox="0 0 24 24" stroke="white" strokeWidth={2} fill="none">
                                                <Path d="M9 18l6-6-6-6" />
                                            </Svg>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
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
                            <Path d="M3 8h18M3 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M19 8V6a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v2M3 8v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8" />
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
                                       style={styles.modalClose}
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
                                       <Text style={styles.modalSub}>
                                           Full diet details from morning to dinner
                                       </Text>
           
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
    header: {
        color: "#fff",
        fontSize: 28,
        textAlign: "center",
        marginVertical: 20,
        fontFamily: "Poppins_500Medium",
    },
    dayCard: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#333",
        paddingBottom: 10,
        paddingHorizontal:10,
    },
    dateRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    dateText: {
        color: "#fff",
        fontSize: 18,
        fontFamily: "Poppins_500Medium",
    },
     text: {
        color: "#777777ff",
        textAlign: "center",
        paddingHorizontal: 50,
        paddingVertical: 1,
        fontFamily: "Poppins_400Regular",
        fontSize: 14,
    }, 
    mealCard: {
        flexDirection: "row",
        justifyContent: "space-between",
        backgroundColor: "#1c1c1c",
        borderRadius: 40,
        padding: 20,
        marginVertical: 5,
        alignItems: "center",
    },
    modalSub: {
        color: "#aaa",
        fontSize: 15,
        marginBottom: 20,
        textAlign: "center",
    },
    mealText: {
        color: "#fff",
        fontSize: 16,
        fontFamily: "Poppins_400Regular",
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
    modalClose: { alignSelf: "flex-end", padding: 10 },
    modalTitle: { color: "#fff", fontSize: 24, textAlign: "center", marginBottom: 15, fontFamily: "Poppins_500Medium" },
    modalRow: { marginBottom: 15, borderBottomWidth: 0.5, borderBottomColor: "#333", paddingBottom: 10 },
    modalRowKey: { color: "#f5f5f5", fontSize: 16, marginBottom: 5, fontFamily: "Poppins_500Medium" },
    modalRowValue: { color: "#bbb", fontSize: 14, fontFamily: "Poppins_400Regular", lineHeight: 20 },
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
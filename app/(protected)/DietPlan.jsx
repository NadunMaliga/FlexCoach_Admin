import {
    Poppins_400Regular,
    Poppins_500Medium,
    useFonts,
} from "@expo-google-fonts/poppins";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import ApiService from "../services/api";

export default function DietPlan() {
    const [selectedMeal, setSelectedMeal] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [meals, setMeals] = useState([]);
    const router = useRouter();
    const { userId } = useLocalSearchParams();

    // Use the passed userId or fallback to test user ID for development
    const effectiveUserId = userId || "68e8fd08e8d1859ebd9edd05";
    
    // Debug logging to verify userId is being passed correctly
    console.log('DietPlan - Received userId:', userId);
    console.log('DietPlan - Using effectiveUserId:', effectiveUserId);

    const [fontsLoaded] = useFonts({
        Poppins_400Regular,
        Poppins_500Medium,
    });

    // Fetch diet plans from backend
    const loadDietPlans = useCallback(async () => {
        try {
            setLoading(true);
            console.log('Loading diet plans for userId:', effectiveUserId);

            const response = await ApiService.getUserDietPlans(effectiveUserId);
            console.log('API response:', response);

            if (response.success && response.dietPlans && response.dietPlans.length > 0) {
                // Transform API data to match the UI format
                const transformedMeals = response.dietPlans.map((dietPlan, index) => {
                    const mealDetails = {};

                    // Group meals by time and create details object
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
                    });

                    return {
                        name: dietPlan.name || `Meal ${index + 1}`,
                        details: mealDetails
                    };
                });

                setMeals(transformedMeals);
                console.log('Loaded meals:', transformedMeals.length);
            } else {
                // No diet plans found - show empty state
                setMeals([]);
            }
        } catch (err) {
            console.error('Load diet plans error:', err);
            // Show empty state on error
            setMeals([]);
        } finally {
            setLoading(false);
        }
    }, [effectiveUserId]);

    // Refresh data when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            if (effectiveUserId) {
                loadDietPlans();
            }
        }, [effectiveUserId, loadDietPlans])
    );

    if (!fontsLoaded) return null;

    const openMealModal = (meal) => {
        setSelectedMeal(meal);
        setModalVisible(true);
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#d5ff5f" />
                <Text style={{ color: '#fff', marginTop: 10, fontFamily: "Poppins_400Regular" }}>
                    Loading diet plans...
                </Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#000" }}>
            {/* Scroll Content */}
            <ScrollView
                style={styles.container}
                contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.mtext}>Current Plan</Text>
                <Text style={styles.text}>
                    This Client diet plan will be updated here. Click on a meal and see the
                    full details. All the information is there.
                </Text>

                {/* Meals List */}
                {meals.length > 0 ? (
                    meals.map((meal, index) => (
                        <TouchableOpacity key={index} onPress={() => openMealModal(meal)}>
                            <View style={styles.card}>
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
                                        <Path d="M12.1471 21.2646L12 21.2351L11.8529 21.2646C9.47627 21.7399 7.23257 21.4756 5.59352 20.1643C3.96312 18.86 2.75 16.374 2.75 12C2.75 7.52684 3.75792 5.70955 5.08541 5.04581C5.77977 4.69863 6.67771 4.59759 7.82028 4.72943C8.96149 4.86111 10.2783 5.21669 11.7628 5.71153L12.0235 5.79841L12.2785 5.69638C14.7602 4.70367 16.9909 4.3234 18.5578 5.05463C20.0271 5.7403 21.25 7.59326 21.25 12C21.25 16.374 20.0369 18.86 18.4065 20.1643C16.7674 21.4756 14.5237 21.7399 12.1471 21.2646Z" />
                                        <Path d="M12 5.5C12 3 11 2 9 2" />
                                    </Svg>
                                </View>
                                <View style={styles.infoContainer}>
                                    <Text style={styles.title}>{meal.name}</Text>
                                    <Text style={styles.dateRange}>Tap to view details</Text>
                                </View>
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
                            <Path d="M12.1471 21.2646L12 21.2351L11.8529 21.2646C9.47627 21.7399 7.23257 21.4756 5.59352 20.1643C3.96312 18.86 2.75 16.374 2.75 12C2.75 7.52684 3.75792 5.70955 5.08541 5.04581C5.77977 4.69863 6.67771 4.59759 7.82028 4.72943C8.96149 4.86111 10.2783 5.21669 11.7628 5.71153L12.0235 5.79841L12.2785 5.69638C14.7602 4.70367 16.9909 4.3234 18.5578 5.05463C20.0271 5.7403 21.25 7.59326 21.25 12C21.25 16.374 20.0369 18.86 18.4065 20.1643C16.7674 21.4756 14.5237 21.7399 12.1471 21.2646Z" />
                            <Path d="M12 5.5C12 3 11 2 9 2" />
                        </Svg>
                        <Text style={styles.emptyTitle}>No Diet Plans</Text>
                        <Text style={styles.emptySubtitle}>
                            You don't have any diet plans yet.{'\n'}
                            Tap the + button to create your first diet plan.
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Footer Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.footerBtn}
                    onPress={() => router.push(`/DietHistory?userId=${effectiveUserId}`)}
                >
                    <Text style={styles.footerBtnText}>History</Text>
                </TouchableOpacity>
            </View>

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

            {/* Floating Add Button */}
            <TouchableOpacity
                style={styles.floatingAddBtn}
                onPress={() => router.push(`/AddDiet?userId=${effectiveUserId}`)}
            >
                <Text style={styles.addBtnText}>+</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#000" },
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
        padding: 15,
        borderRadius: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    text: {
        color: "#777",
        textAlign: "center",
        paddingHorizontal: 20,
        paddingVertical: 10,
        fontFamily: "Poppins_400Regular",
        fontSize: 14,
    },
    mtext: {
        color: "#fff",
        textAlign: "center",
        fontFamily: "Poppins_400Regular",
        fontSize: 25,
    },
    infoContainer: { flex: 1, marginLeft: 15 },
    title: {
        fontSize: 19,
        color: "#fff",
        fontFamily: "Poppins_500Medium",
    },
    dateRange: { fontSize: 14, color: "#999", fontFamily: "Poppins_400Regular" },
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
    floatingAddBtn: {
        position: "absolute",
        bottom: 150, // a little above the footer
        right: 25,
        backgroundColor: "#d5ff5f",
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: "center",
        justifyContent: "center",
    },
    addBtnText: {
        fontSize: 35,
        color: "black", // matching footer color
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
        marginBottom: 15,
        borderBottomWidth: 0.5,
        borderBottomColor: "#333",
        paddingBottom: 10,
    },
    modalRowKey: {
        color: "#f5f5f5",
        fontSize: 16,
        marginBottom: 5,
        fontFamily: "Poppins_500Medium",
    },
    modalRowValue: {
        color: "#bbb",
        fontSize: 14,
        fontFamily: "Poppins_400Regular",
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
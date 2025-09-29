import React, { useState } from "react";
import { useRouter } from "expo-router";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import {
    useFonts,
    Poppins_400Regular,
    Poppins_500Medium,
} from "@expo-google-fonts/poppins";

export default function DietPlan() {
    const [selectedMeal, setSelectedMeal] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const router = useRouter(); // ✅ FIX

    const [fontsLoaded] = useFonts({
        Poppins_400Regular,
        Poppins_500Medium,
    });

    if (!fontsLoaded) return null;

    // Example Meals Data
    const meals = [
        {
            name: "Meal 1",
            details: {
                Morning: "Protein Scoop 1",
                Breakfast:
                    "Chicken breast\nEgg whites\nVegetables 150g-300g (Steamed or salad)",
                Snacks: "Watermelon 200g",
                Lunch:
                    "Basmati rice\nWhite Fish\nVegetables 150g-300g (Steamed or salad)\n1 teaspoon olive oil",
                "Post-Workout": "Protein Scoop 1",
                Dinner:
                    "Pasta\nChicken\nVegetables 150g-300g (Steamed or salad)\n1 teaspoon olive oil",
            },
        },
        {
            name: "Meal 2",
            details: {
                Morning: "Protein Scoop 1",
                Breakfast: "Oats with fruits",
                Snacks: "Almonds handful",
                Lunch: "Brown rice\nChicken\nVegetables 200g",
                "Post-Workout": "Protein Scoop 1",
                Dinner: "Sweet potato\nTuna\nVegetables 150g-300g",
            },
        },
        {
            name: "Meal 3",
            details: {
                Morning: "Green Tea + Apple",
                Breakfast: "Egg Omelette + Spinach",
                Snacks: "Banana 1",
                Lunch: "Quinoa\nGrilled Chicken\nVegetables 200g",
                "Post-Workout": "Protein Shake",
                Dinner: "Whole wheat pasta\nFish\nVegetables 200g",
            },
        },
    ];

    const openMealModal = (meal) => {
        setSelectedMeal(meal);
        setModalVisible(true);
    };

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
                {meals.map((meal, index) => (
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
                ))}
            </ScrollView>

            {/* Footer Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.footerBtn}
                    onPress={() => router.push("/DietHistory")}
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
});

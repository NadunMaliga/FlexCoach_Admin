import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useFonts, Poppins_400Regular, Poppins_500Medium } from "@expo-google-fonts/poppins";

export default function DietHistory() {
    const [selectedMeal, setSelectedMeal] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const [fontsLoaded] = useFonts({
        Poppins_400Regular,
        Poppins_500Medium,
    });

    if (!fontsLoaded) return null;

    // Example Diet History Data (Each day 3 meals)
    const history = [
        {
            date: "2025-09-25",
            meals: [
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
                    name: "Meal 3",
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
            ],
        },
        {
            date: "2025-09-26",
            meals: [
                {
                    name: "Meal 1",
                    details: { Morning: "Smoothie", Breakfast: "Egg + Toast", Lunch: "Rice + Fish", Dinner: "Salad + Chicken" },
                },
                {
                    name: "Meal 2",
                    details: { Morning: "Protein Shake", Breakfast: "Oats + Milk", Lunch: "Chicken + Quinoa", Dinner: "Pasta + Tuna" },
                },
                {
                    name: "Meal 3",
                    details: { Morning: "Green Tea", Breakfast: "Egg Omelette", Lunch: "Brown Rice + Fish", Dinner: "Veggies + Chicken" },
                },
            ],
        },
    ];

    const openMealModal = (meal) => {
        setSelectedMeal(meal);
        setModalVisible(true);
    };

    return (
        <View style={{ flex: 1, backgroundColor: "#000" }}>
            <Text style={styles.header}>Diet History</Text>
            <Text style={styles.text}>
                This Client diet History will be updated here. Click on a meal and see the
                full details. All the information is there.
            </Text>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                {history.map((day, index) => (
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
                ))}
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
});

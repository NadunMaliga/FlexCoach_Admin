import React from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { useFonts, Poppins_400Regular, Poppins_500Medium } from '@expo-google-fonts/poppins';
import { useNavigation } from "@react-navigation/native"; 
import Svg, { Path } from "react-native-svg";

export default function MeasurementHistory({ measurementName = "Weight" }) {
    const navigation = useNavigation();

    const [fontsLoaded] = useFonts({
        Poppins_400Regular,
        Poppins_500Medium,
    });

    const data = [72, 68, 65, 64, 66, 68.3];
    const labels = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"];
    const screenWidth = Dimensions.get("window").width - 40;

    const history = [
        { date: "16 Sep 2025", value: "68.3 kg" },
        { date: "14 Sep 2025", value: "68.8 kg" },
        { date: "12 Sep 2025", value: "67.8 kg" },
        { date: "08 Sep 2025", value: "68.5 kg" },
        { date: "07 Sep 2025", value: "67.7 kg" },
        { date: "05 Sep 2025", value: "68.3 kg" },
        { date: "01 Sep 2025", value: "67.5 kg" },
    ];

    return (
        <View style={{ flex: 1, backgroundColor: "#000" }}>
            {/* Chart + Label */}
            <View style={styles.chartCard}>
                <Text style={styles.measurementLabel}>{measurementName}</Text>
                <LineChart
                    data={{ labels, datasets: [{ data }] }}
                    width={screenWidth}
                    height={220}
                    yAxisSuffix="kg"
                    chartConfig={{
                        backgroundColor: "#000",
                        backgroundGradientFrom: "#000",
                        backgroundGradientTo: "#000",
                        decimalPlaces: 1,
                        color: (opacity = 1) => `rgba(213, 255, 95, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                        propsForDots: { r: "6", strokeWidth: "2", stroke: "#d5ff5f" },
                    }}
                    bezier
                    style={{ borderRadius: 25 }}
                />
            </View>

            {/* Scrollable History */}
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
                <Text style={styles.sectionTitle}>September</Text>
                {history.map((item, i) => (
                    <View key={i} style={styles.card}>
                        <View style={styles.iconWrapper}>
                            <Svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <Path d="M12 1v22M5 12h14" />
                            </Svg>
                        </View>
                        <View style={styles.infoContainer}>
                            <Text style={styles.date}>{item.date}</Text>
                            <Text style={styles.value}>{item.value}</Text>
                        </View>
                    </View>
                ))}
            </ScrollView>

           
        </View>
    );
}


const styles = StyleSheet.create({
    chartCard: {
        width: "100%",
        backgroundColor: "#1111",
        borderRadius: 25,
        padding: 15,
        marginTop: 20,
        alignSelf: "center",
    },
    measurementLabel: {
        color: "#fff",
        fontSize: 22,
        fontWeight: "500",
        marginBottom: 15,
        fontFamily: "Poppins_500Medium",
        alignSelf: "center",
    },
    sectionTitle: {
        color: "#fff",
        fontSize: 17,
        fontWeight: "400",
        marginBottom: 12,
        alignSelf: "center",
    }, 
    card: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#1c1c1c",
        borderRadius: 50,
        padding: 17,
        marginBottom: 15,
        justifyContent: "space-between",
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 5,
        elevation: 4,
    },
    iconWrapper: {
        backgroundColor: "#3a3a3a",
        padding: 16,
        borderRadius: 50,
        justifyContent: "center",
        alignItems: "center",
    },
    infoContainer: { flex: 1, marginLeft: 15, justifyContent: "center" },
    date: {
        fontSize: 14,
        color: "#aaa",
        fontFamily: "Poppins_400Regular",
    },
    value: {
        fontSize: 19,
        fontWeight: "300",
        color: "#fff",
        fontFamily: "Poppins_400Regular",
        marginTop: 2,
    },
});

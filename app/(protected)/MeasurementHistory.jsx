import { Poppins_400Regular, Poppins_500Medium, useFonts } from '@expo-google-fonts/poppins';
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import Svg, { Path } from "react-native-svg";
import ApiService from '../services/api';
import Logger from '../utils/logger';
import LoadingGif from '../components/LoadingGif';



export default function MeasurementHistory() {
    const { userId, measurement } = useLocalSearchParams();
    const measurementName = measurement || "Weight";

    const [fontsLoaded] = useFonts({
        Poppins_400Regular,
        Poppins_500Medium,
    });

    const [measurements, setMeasurements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userProfile, setUserProfile] = useState(null);

    const screenWidth = Dimensions.get("window").width - 40;

    useEffect(() => {
        if (userId) {
            fetchMeasurements();
        }
    }, [userId]);

    const fetchMeasurements = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await ApiService.getUserBodyMeasurements(userId);
            
            if (response.success) {
                setMeasurements(response.measurements || []);
                setUserProfile(response.userProfile);
            } else {
                setError('Failed to load measurements');
            }
        } catch (err) {
            Logger.error('Load measurements error:', err);
            setError('Failed to load measurements');
        } finally {
            setLoading(false);
        }
    };

    // Filter measurements by type and prepare chart data
    const getFilteredMeasurements = () => {
        return measurements.filter(m => 
            m.measurementType.toLowerCase() === measurementName.toLowerCase()
        ).sort((a, b) => new Date(a.date) - new Date(b.date));
    };

    const prepareChartData = () => {
        const filtered = getFilteredMeasurements();
        if (filtered.length === 0) {
            return { data: [0], labels: ['No Data'] };
        }

        // Take last 6 measurements for chart
        const recent = filtered.slice(-6);
        const data = recent.map(m => m.value);
        const labels = recent.map(m => {
            const date = new Date(m.date);
            return date.toLocaleDateString('en-US', { month: 'short' });
        });

        return { data, labels };
    };

    const prepareHistoryData = () => {
        const filtered = getFilteredMeasurements();
        return filtered.slice(-10).reverse().map(m => ({
            date: new Date(m.date).toLocaleDateString('en-US', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric' 
            }),
            value: `${m.value} ${m.unit}`
        }));
    };

    const chartData = prepareChartData();
    const history = prepareHistoryData();

    if (!fontsLoaded) {
        return null;
    }

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <LoadingGif size={100} />
                <Text style={styles.loadingText}>Loading measurements...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.container, styles.centered]}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchMeasurements}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (history.length === 0) {
        return (
            <View style={[styles.container, styles.centered]}>
                <Text style={styles.noDataText}>No {measurementName} measurements found</Text>
                <Text style={styles.noDataSubtext}>
                    {userProfile ? `for ${userProfile.firstName} ${userProfile.lastName}` : ''}
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Chart + Label */}
            <View style={styles.chartCard}>
                <Text style={styles.measurementLabel}>
                    {measurementName} {userProfile && `- ${userProfile.firstName} ${userProfile.lastName}`}
                </Text>
                {chartData.data.length > 1 ? (
                    <LineChart
                        data={{ labels: chartData.labels, datasets: [{ data: chartData.data }] }}
                        width={screenWidth}
                        height={220}
                        yAxisSuffix={history[0]?.value.split(' ')[1] || ''}
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
                ) : (
                    <View style={styles.noChartContainer}>
                        <Text style={styles.noChartText}>Not enough data for chart</Text>
                        <Text style={styles.noChartSubtext}>Need at least 2 measurements</Text>
                    </View>
                )}
            </View>

            {/* Scrollable History */}
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
                <Text style={styles.sectionTitle}>Recent Measurements</Text>
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
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
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
        textAlign: 'center',
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
    loadingText: {
        color: "#fff",
        fontSize: 16,
        marginTop: 10,
        fontFamily: "Poppins_400Regular",
    },
    errorText: {
        color: "#ff6b6b",
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        fontFamily: "Poppins_400Regular",
    },
    retryButton: {
        backgroundColor: "#d5ff5f",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    retryButtonText: {
        color: "#000",
        fontSize: 16,
        fontWeight: "500",
        fontFamily: "Poppins_500Medium",
    },
    noDataText: {
        color: "#fff",
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 10,
        fontFamily: "Poppins_500Medium",
    },
    noDataSubtext: {
        color: "#aaa",
        fontSize: 14,
        textAlign: 'center',
        fontFamily: "Poppins_400Regular",
    },
    noChartContainer: {
        height: 220,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noChartText: {
        color: "#fff",
        fontSize: 16,
        fontFamily: "Poppins_500Medium",
    },
    noChartSubtext: {
        color: "#aaa",
        fontSize: 14,
        marginTop: 5,
        fontFamily: "Poppins_400Regular",
    },
});
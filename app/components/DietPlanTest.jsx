import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function DietPlanTest() {
    const router = useRouter();
    
    // Test user ID from our database
    const testUserId = "68e8fd08e8d1859ebd9edd05";
    
    const navigateToDietPlan = () => {
        router.push(`/DietPlan?userId=${testUserId}`);
    };
    
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Diet Plan Test</Text>
            <Text style={styles.subtitle}>Test User ID: {testUserId}</Text>
            
            <TouchableOpacity style={styles.button} onPress={navigateToDietPlan}>
                <Text style={styles.buttonText}>Go to Diet Plan with User ID</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
                style={[styles.button, styles.secondaryButton]} 
                onPress={() => router.push('/DietPlan')}
            >
                <Text style={styles.buttonText}>Go to Diet Plan without User ID</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
        padding: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        fontSize: 24,
        color: "#fff",
        marginBottom: 10,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 14,
        color: "#999",
        marginBottom: 30,
        textAlign: "center",
    },
    button: {
        backgroundColor: "#d5ff5f",
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 25,
        marginBottom: 15,
        minWidth: 250,
    },
    secondaryButton: {
        backgroundColor: "#333",
    },
    buttonText: {
        color: "#000",
        fontSize: 16,
        textAlign: "center",
        fontWeight: "500",
    },
});
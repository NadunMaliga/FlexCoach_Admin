import {
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    useFonts,
} from "@expo-google-fonts/poppins";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    PanResponder,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import Logger from '../utils/logger';
import Svg, { Path } from "react-native-svg";
import OfflineApiService from "../services/OfflineApiService";
import ListSkeleton from '../components/ListSkeleton';
import { showAlert, showSuccess, showError } from '../utils/customAlert';
import HapticFeedback from '../utils/haptics';


export default function ExercisePlan() {
    const router = useRouter();
    const { userId, preloadedData: preloadedDataParam } = useLocalSearchParams();

    Logger.log('ExercisePlan component loaded with userId:', userId);

    // Parse preloaded data if available - memoized to prevent re-parsing
    const preloadedData = useMemo(() => {
        if (preloadedDataParam) {
            try {
                const parsed = JSON.parse(preloadedDataParam);
                Logger.log('🚀 Using preloaded exercise data:', parsed?.length || 0, 'items');
                return parsed;
            } catch (e) {
                Logger.error('Error parsing preloaded data:', e);
                return null;
            }
        }
        return null;
    }, [preloadedDataParam]);

    // State for workout schedules - initialize with preloaded data if available
    const [schedules, setSchedules] = useState(preloadedData || []);
    const [loading, setLoading] = useState(!preloadedData);
    const [error, setError] = useState(null);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(!!preloadedData);

    const [fontsLoaded] = useFonts({
        Poppins_400Regular,
        Poppins_500Medium,
        Poppins_600SemiBold,
    });

    useEffect(() => {
        // Skip loading if we already have preloaded data
        if (preloadedData && preloadedData.length > 0) {
            Logger.log('✅ Preloaded exercise data ready - skipping API call');
            setHasLoadedOnce(true);
            setLoading(false);
            return;
        }

        // Load data if no preloaded data available and haven't loaded yet
        if (userId && !hasLoadedOnce) {
            loadWorkoutSchedules();
        } else if (!userId) {
            // If no userId, use mock data
            setSchedules([
                { _id: "1", day: "Day 1", detail: "Exercise 5 - Duration 50 min", status: "Completed", isCompleted: true },
                { _id: "2", day: "Day 2", detail: "Exercise 4 - Duration 45 min", status: "Not Completed", isCompleted: false },
                { _id: "3", day: "Day 3", detail: "Exercise 6 - Duration 60 min", status: "Completed", isCompleted: true },
                { _id: "4", day: "Day 4", detail: "Exercise 3 - Duration 40 min", status: "Not Completed", isCompleted: false },
            ]);
            setLoading(false);
        }
    }, [userId, preloadedData]);

    // Refresh data when screen comes into focus (e.g., after adding a schedule)
    // But skip the first focus if we have preloaded data
    useFocusEffect(
        useCallback(() => {
            if (userId && hasLoadedOnce) {
                Logger.log('🔄 ExercisePlan focused - refreshing data');
                loadWorkoutSchedules();
            }
        }, [userId, hasLoadedOnce])
    );

    const loadWorkoutSchedules = async () => {
        try {
            setLoading(true);
            setError(null);
            Logger.log('Loading workout schedules for userId:', userId);

            const response = await OfflineApiService.getUserWorkoutSchedules(userId, {
                limit: 50,
                sortBy: 'scheduledDate',
                sortOrder: 'asc'
            });

            if (response.success) {
                // Transform the API data to match the expected format
                const transformedSchedules = response.workoutSchedules.map((schedule, index) => ({
                    _id: schedule._id,
                    day: schedule.day || `Day ${index + 1}`,
                    detail: `${schedule.exercises?.length || 0} exercises - Duration ${schedule.estimatedDuration || 'N/A'} min`,
                    status: schedule.isCompleted ? "Completed" : "Not Completed",
                    isCompleted: schedule.isCompleted,
                    name: schedule.name,
                    workoutType: schedule.workoutType,
                    scheduledDate: schedule.scheduledDate,
                    exercises: schedule.exercises
                }));

                setSchedules(transformedSchedules);
                Logger.log('Loaded workout schedules:', transformedSchedules.length);
            } else {
                setError('Failed to load workout schedules');
                // Fallback to mock data
                setSchedules([
                    { _id: "1", day: "Day 1", detail: "No schedules found", status: "Not Completed", isCompleted: false }
                ]);
            }
        } catch (err) {
            Logger.error('Load workout schedules error:', err);
            setError('Failed to load workout schedules');
            // Fallback to mock data
            setSchedules([
                { _id: "1", day: "Day 1", detail: "Error loading schedules", status: "Not Completed", isCompleted: false }
            ]);
        } finally {
            setLoading(false);
        }
    };

    if (!fontsLoaded) {
        Logger.log('Fonts not loaded yet');
        return null;
    }

    Logger.log('ExercisePlan rendering with fonts loaded');

    // Swipeable Workout Card Component using PanResponder
    const SwipeableWorkoutCard = ({ item, onPress, onDelete }) => {
        const translateX = useRef(new Animated.Value(0)).current;
        const deleteOpacity = useRef(new Animated.Value(0)).current;
        const deleteScale = useRef(new Animated.Value(0.8)).current;
        const cardScale = useRef(new Animated.Value(1)).current;

        // Track gesture state for better detection
        const swipeState = useRef({
            isActive: false,
            startTime: 0,
            initialX: 0,
        }).current;

        // Optimized constants for natural feel
        const SWIPE_THRESHOLD = 0.5; // 50% of card width (more natural)
        const VELOCITY_THRESHOLD = 0.8; // Increased for better fast swipe detection
        const MAX_SWIPE_DISTANCE = 150; // Fixed: was 10, now proper distance
        const DELETE_ZONE_WIDTH = 120;
        const MIN_HORIZONTAL_DISTANCE = 8; // Minimum distance to start horizontal gesture
        const VERTICAL_TOLERANCE_RATIO = 3; // dx must be 3x larger than dy

        const panResponder = useRef(
            PanResponder.create({
                onStartShouldSetPanResponder: () => false,
                onMoveShouldSetPanResponder: (evt, gestureState) => {
                    const { dx, dy } = gestureState;
                    const currentTranslateX = translateX._value;

                    // Enhanced gesture detection for better responsiveness
                    const isHorizontalGesture = Math.abs(dx) > Math.abs(dy) * VERTICAL_TOLERANCE_RATIO;
                    const hasMinimumDistance = Math.abs(dx) > MIN_HORIZONTAL_DISTANCE;
                    const isLeftSwipe = dx < 0;
                    const isRightSwipe = dx > 0;

                    // Allow left swipes when card is normal, or right swipes when card is in delete state
                    const shouldRespondToLeftSwipe = isLeftSwipe && currentTranslateX >= -10;
                    const shouldRespondToRightSwipe = isRightSwipe && currentTranslateX < -10;

                    return isHorizontalGesture && hasMinimumDistance && (shouldRespondToLeftSwipe || shouldRespondToRightSwipe);
                },
                onPanResponderGrant: (evt) => {
                    // Initialize gesture tracking
                    swipeState.isActive = true;
                    swipeState.startTime = Date.now();
                    swipeState.initialX = evt.nativeEvent.pageX;

                    // Immediate tactile feedback
                    Animated.spring(cardScale, {
                        toValue: 0.98,
                        tension: 400,
                        friction: 25,
                        useNativeDriver: true,
                    }).start();
                },
                onPanResponderMove: (evt, gestureState) => {
                    if (!swipeState.isActive) return;

                    const { dx } = gestureState;
                    const currentTranslateX = translateX._value;

                    // Enhanced left swipe with smooth resistance curve
                    if (dx < 0) {
                        // Smooth resistance curve that feels natural
                        const normalizedDistance = Math.abs(dx) / MAX_SWIPE_DISTANCE;
                        const resistance = 1 - Math.pow(normalizedDistance, 1.5) * 0.7;
                        const adjustedDx = dx * Math.max(0.2, resistance);

                        // Apply translation with bounds
                        const clampedTranslation = Math.max(adjustedDx, -MAX_SWIPE_DISTANCE);
                        translateX.setValue(clampedTranslation);

                        // Calculate smooth progress for visual feedback
                        const progress = Math.min(Math.abs(clampedTranslation) / (MAX_SWIPE_DISTANCE * SWIPE_THRESHOLD), 1);

                        // Enhanced opacity transition with smooth easing
                        const opacityEasing = progress < 0.2 ? 0 : Math.pow((progress - 0.2) / 0.8, 0.8);
                        deleteOpacity.setValue(Math.min(opacityEasing, 1));

                        // Dynamic scale animation for delete icon
                        const scaleEasing = 0.8 + (progress * 0.5);
                        deleteScale.setValue(Math.min(scaleEasing, 1.3));

                    } else if (dx > 0) {
                        // Handle right swipe - different behavior based on current state
                        if (currentTranslateX < -10) {
                            // Card is in delete state - allow right swipe to return to normal
                            const newTranslateX = currentTranslateX + dx * 0.8; // Smooth return movement
                            const clampedTranslation = Math.min(newTranslateX, 0);
                            translateX.setValue(clampedTranslation);

                            // Gradually hide delete button as card returns
                            const returnProgress = Math.abs(clampedTranslation) / DELETE_ZONE_WIDTH;
                            deleteOpacity.setValue(Math.max(returnProgress, 0));

                            // Scale down delete icon as it hides
                            const returnScale = 0.8 + (returnProgress * 0.5);
                            deleteScale.setValue(Math.max(returnScale, 0.8));
                        } else {
                            // Card is in normal state - minimal right swipe resistance
                            const resistedDx = dx * 0.05;
                            translateX.setValue(Math.min(resistedDx, 15));
                        }
                    }
                },
                onPanResponderRelease: (evt, gestureState) => {
                    const { dx, vx } = gestureState;
                    const swipeDistance = Math.abs(dx);
                    const swipeVelocity = Math.abs(vx);
                    const gestureTime = Date.now() - swipeState.startTime;
                    const currentTranslateX = translateX._value;

                    // Reset gesture state
                    swipeState.isActive = false;

                    // Reset card scale with smooth animation
                    Animated.spring(cardScale, {
                        toValue: 1,
                        tension: 300,
                        friction: 25,
                        useNativeDriver: true,
                    }).start();

                    // Handle right swipe when card is in delete state
                    if (dx > 0 && currentTranslateX < -10) {
                        const returnThreshold = DELETE_ZONE_WIDTH * 0.3; // 30% threshold to return to normal
                        const shouldReturnToNormal = swipeDistance > returnThreshold ||
                            (swipeVelocity > 0.5 && swipeDistance > 20);

                        if (shouldReturnToNormal || currentTranslateX > -DELETE_ZONE_WIDTH * 0.5) {
                            // Return to normal state
                            const snapBackConfig = {
                                tension: 220,
                                friction: 22,
                                useNativeDriver: true,
                            };

                            Animated.parallel([
                                Animated.spring(translateX, {
                                    toValue: 0,
                                    ...snapBackConfig,
                                }),
                                Animated.spring(deleteOpacity, {
                                    toValue: 0,
                                    ...snapBackConfig,
                                }),
                                Animated.spring(deleteScale, {
                                    toValue: 0.8,
                                    ...snapBackConfig,
                                })
                            ]).start();
                        } else {
                            // Snap back to delete state
                            Animated.parallel([
                                Animated.spring(translateX, {
                                    toValue: -DELETE_ZONE_WIDTH,
                                    tension: 180,
                                    friction: 20,
                                    useNativeDriver: true,
                                }),
                                Animated.spring(deleteOpacity, {
                                    toValue: 1,
                                    tension: 200,
                                    friction: 18,
                                    useNativeDriver: true,
                                }),
                                Animated.spring(deleteScale, {
                                    toValue: 1,
                                    tension: 200,
                                    friction: 18,
                                    useNativeDriver: true,
                                })
                            ]).start();
                        }
                        return;
                    }

                    // Handle left swipe (original delete logic)
                    if (dx < 0) {
                        const distanceThreshold = MAX_SWIPE_DISTANCE * SWIPE_THRESHOLD;
                        const isDistanceTriggered = swipeDistance > distanceThreshold;
                        const isFastSwipe = swipeVelocity > VELOCITY_THRESHOLD && swipeDistance > 40;
                        const isQuickGesture = gestureTime < 300 && swipeDistance > 60;

                        const shouldDelete = isDistanceTriggered || isFastSwipe || isQuickGesture;

                        if (shouldDelete) {
                            // Smooth delete animation with proper easing
                            Animated.parallel([
                                Animated.spring(translateX, {
                                    toValue: -DELETE_ZONE_WIDTH,
                                    tension: 180,
                                    friction: 20,
                                    useNativeDriver: true,
                                }),
                                Animated.spring(deleteOpacity, {
                                    toValue: 1,
                                    tension: 200,
                                    friction: 18,
                                    useNativeDriver: true,
                                }),
                                Animated.spring(deleteScale, {
                                    toValue: 1,
                                    tension: 200,
                                    friction: 18,
                                    useNativeDriver: true,
                                })
                            ]).start();
                            return;
                        }
                    }

                    // Default: snap back to normal state
                    const snapBackConfig = {
                        tension: 220,
                        friction: 22,
                        useNativeDriver: true,
                    };

                    Animated.parallel([
                        Animated.spring(translateX, {
                            toValue: 0,
                            ...snapBackConfig,
                        }),
                        Animated.spring(deleteOpacity, {
                            toValue: 0,
                            ...snapBackConfig,
                        }),
                        Animated.spring(deleteScale, {
                            toValue: 0.8,
                            ...snapBackConfig,
                        })
                    ]).start();
                },
                onPanResponderTerminate: () => {
                    // Handle interruption gracefully
                    swipeState.isActive = false;
                    resetSwipe();
                },
                // Improve scroll view compatibility
                onPanResponderReject: () => {
                    swipeState.isActive = false;
                },
            })
        ).current;

        const resetSwipe = () => {
            // Reset gesture state
            swipeState.isActive = false;

            const springConfig = {
                tension: 220,
                friction: 22,
                useNativeDriver: true,
            };

            Animated.parallel([
                Animated.spring(translateX, {
                    toValue: 0,
                    ...springConfig,
                }),
                Animated.spring(deleteOpacity, {
                    toValue: 0,
                    ...springConfig,
                }),
                Animated.spring(deleteScale, {
                    toValue: 0.8,
                    ...springConfig,
                }),
                Animated.spring(cardScale, {
                    toValue: 1,
                    ...springConfig,
                })
            ]).start();
        };

        const handleDeletePress = () => {
            // Haptic feedback on delete press
            HapticFeedback.medium();

            // Animate out completely before calling delete
            Animated.parallel([
                Animated.timing(translateX, {
                    toValue: -400,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(deleteOpacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                })
            ]).start(() => {
                onDelete(item._id, item.name || item.day);
            });
        };

        return (
            <View style={styles.swipeContainer}>
                {/* Delete Button Background with animated icon */}
                <Animated.View style={[
                    styles.deleteButtonContainer,
                    { opacity: deleteOpacity }
                ]}>
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={handleDeletePress}
                        activeOpacity={0.8}
                    >
                        <Animated.View style={[
                            styles.deleteIconContainer,
                            { transform: [{ scale: deleteScale }] }
                        ]}>
                            <Feather name="trash-2" size={32} color="#fff" />
                        </Animated.View>
                    </TouchableOpacity>
                </Animated.View>

                <Animated.View
                    style={[
                        styles.cardContainer,
                        {
                            transform: [
                                { translateX },
                                { scale: cardScale }
                            ]
                        }
                    ]}
                    {...panResponder.panHandlers}
                >
                    <TouchableOpacity onPress={() => {
                        resetSwipe();
                        onPress();
                    }}>
                        <View style={styles.card}>
                            {/* Info */}
                            <View style={styles.infoContainer}>
                                <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
                                    {((item.name || item.day || 'Workout')?.length > 15
                                        ? (item.name || item.day || 'Workout').substring(0, 20) + '...'
                                        : (item.name || item.day || 'Workout'))}
                                </Text>
                                <Text style={styles.dateRange} numberOfLines={1} ellipsizeMode="tail">
                                    {(item.detail || 'No details')?.length > 18 ? (item.detail || 'No details').substring(0, 24) + '...' : (item.detail || 'No details')}
                                </Text>
                                {item.workoutType && (
                                    <Text style={styles.workoutType}>
                                        {item.workoutType}
                                    </Text>
                                )}
                            </View>

                            {/* Status Icon */}
                            <View style={{ marginRight: 10 }}>
                                {item.isCompleted ? (
                                    <Feather name="check-circle" size={20} color="#a8ffaaff" />
                                ) : (
                                    <Feather name="x-circle" size={20} color="#ffadadff" />
                                )}
                            </View>

                            {/* Edit Button */}
                            <TouchableOpacity
                                onPress={(e) => {
                                    e.stopPropagation();
                                    if (item._id) {
                                        Logger.log('Editing schedule:', item._id);
                                        router.push(`/AddSchedule?userId=${userId}&scheduleId=${item._id}&mode=edit`);
                                    }
                                }}
                                style={{ marginRight: 10, padding: 4 }}
                            >
                                <Feather name="edit-2" size={18} color="#c6c7c4ff" />
                            </TouchableOpacity>

                            {/* Right Arrow */}
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
                </Animated.View>
            </View>
        );
    };

    // Delete workout function with optimistic update
    const deleteWorkout = async (workoutId, workoutName) => {
        // Optimistic update - remove immediately from UI
        const previousSchedules = schedules;
        setSchedules(prevSchedules =>
            prevSchedules.filter(schedule => schedule._id !== workoutId)
        );

        try {
            Logger.log('Deleting workout:', workoutId);
            const response = await OfflineApiService.deleteWorkoutSchedule(workoutId);

            if (response.success) {
                HapticFeedback.success();
                showAlert('Success', `${workoutName} has been deleted successfully`);
            } else {
                // Revert on failure
                setSchedules(previousSchedules);
                HapticFeedback.error();
                showAlert('Error', 'Failed to delete workout schedule');
            }
        } catch (error) {
            Logger.error('Delete workout error:', error);
            // Revert on error
            setSchedules(previousSchedules);
            HapticFeedback.error();
            showAlert('Error', 'Failed to delete workout schedule');
        }
    };

    // Handle swipe to delete
    const handleSwipeDelete = (workoutId, workoutName) => {
        Alert.alert(
            'Delete Workout',
            `Are you sure you want to delete "${workoutName}"?`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deleteWorkout(workoutId, workoutName),
                },
            ]
        );
    };

    // Only show loading if we're actually loading and don't have preloaded data or existing schedules
    if (loading && schedules.length === 0) {
        return (
            <View style={styles.container}>
                <ListSkeleton count={6} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#000" }}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.text}>
                    {userId
                        ? "This client's workout schedules are displayed below. Click on any schedule to see full details."
                        : "This Client workout will be updated here according to Client schedule that Client receives. Click on that schedule and see the full details. All the information is there."
                    }
                </Text>

                {error && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={loadWorkoutSchedules}>
                            <Text style={styles.retryButtonText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Schedule List */}
                {schedules.length > 0 ? (
                    schedules.map((item, index) => (
                        <SwipeableWorkoutCard
                            key={item._id || index}
                            item={item}
                            index={index}
                            onPress={() => router.push(`/ScheduleDetails?scheduleId=${item._id}&userId=${userId}`)}
                            onDelete={handleSwipeDelete}
                        />
                    ))
                ) : (
                    <View style={styles.noDataContainer}>
                        <Text style={styles.noDataText}>
                            {userId ? "No workout schedules found for this client." : "No workout schedules available."}
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Footer Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.footerBtn}
                    onPress={() => router.push(`/AddSchedule${userId ? `?userId=${userId}` : ''}`)}
                >
                    <Text style={styles.footerBtnText}>Add Schedule</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#000" },
    card: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        marginBottom: 15,
        justifyContent: "space-between",
    },

    text: {
        color: "#777",
        textAlign: "center",
        paddingHorizontal: 20,
        paddingVertical: 10,
        fontFamily: "Poppins_400Regular",
        fontSize: 14,
    },
    infoContainer: { flex: 1 },
    title: {
        fontSize: 19,
        color: "#a6a5a5ff",
        fontFamily: "Poppins_300Light",
    },
    dateRange: { fontSize: 14, color: "#999", fontFamily: "Poppins_300Light" },
    workoutType: {
        fontSize: 12,
        color: "#ddddddff",
        fontFamily: "Poppins_400Regular",
        marginTop: 2
    },
    errorContainer: {
        backgroundColor: "#1c1c1c",
        padding: 20,
        marginBottom: 20,
        alignItems: "center",
    },
    errorText: {
        color: "#ff6b6b",
        textAlign: "center",
        marginBottom: 15,
        fontFamily: "Poppins_400Regular",
    },
    retryButton: {
        backgroundColor: "#d5ff5f",
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    retryButtonText: {
        color: "#000",
        fontFamily: "Poppins_500Medium",
    },
    noDataContainer: {
        backgroundColor: "#1c1c1c",
        padding: 30,
        marginTop: 20,
        alignItems: "center",
    },
    noDataText: {
        color: "#999",
        textAlign: "center",
        fontFamily: "Poppins_400Regular",
        fontSize: 16,
    },

    // Swipe styles
    swipeContainer: {
        position: 'relative',
        marginBottom: 15,
        overflow: 'hidden',
        // Add subtle shadow for depth
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    cardContainer: {
        zIndex: 2,
    },
    deleteButtonContainer: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        left: 0,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        backgroundColor: '#ff4444',
        paddingRight: 20,
        zIndex: 1,
        // Gradient-like effect with multiple backgrounds
        borderWidth: 2,
        borderColor: '#ff6666',
    },
    deleteIconContainer: {
        padding: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },

    footer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: 25,
        paddingVertical: 20,
    },
    footerBtn: {
        backgroundColor: "#d5ff5f",
        paddingVertical: 22,
        borderRadius: 50,
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
    },
    footerBtnText: {
        fontSize: 18,
        color: "#000",
        fontFamily: "Poppins_400Regular",
        textAlign: "center",
    },
});
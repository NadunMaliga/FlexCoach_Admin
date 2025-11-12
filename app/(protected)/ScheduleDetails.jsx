import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import {
    useFonts,
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
} from '@expo-google-fonts/poppins';
import OfflineApiService from '../services/OfflineApiService';
import Logger from '../utils/logger';

export default function ScheduleDetails() {
    const { scheduleId, userId } = useLocalSearchParams();

    const [schedule, setSchedule] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [showExerciseModal, setShowExerciseModal] = useState(false);

    const [fontsLoaded] = useFonts({
        Poppins_300Light,
        Poppins_400Regular,
        Poppins_500Medium,
        Poppins_600SemiBold,
    });

    useEffect(() => {
        if (scheduleId) {
            loadScheduleDetails();
        }
    }, [scheduleId]);

    const loadScheduleDetails = async () => {
        try {
            setLoading(true);
            Logger.log('Loading schedule details for:', scheduleId);

            const response = await OfflineApiService.getWorkoutScheduleDetails(scheduleId);

            if (response.success) {
                // Merge exercises into the schedule object
                const scheduleWithExercises = {
                    ...response.workoutSchedule,
                    exercises: response.exercises || []
                };
                setSchedule(scheduleWithExercises);
                Logger.log('Schedule loaded with exercises:', scheduleWithExercises);
            } else {
                Logger.error('Failed to load schedule');
            }
        } catch (error) {
            Logger.error('Load schedule error:', error);
        } finally {
            setLoading(false);
        }
    };

    const openExerciseModal = (exercise) => {
        setSelectedExercise(exercise);
        setShowExerciseModal(true);
    };

    const closeExerciseModal = () => {
        setShowExerciseModal(false);
        setTimeout(() => setSelectedExercise(null), 300);
    };

    if (!fontsLoaded || loading) {
        return (
            <View style={styles.container}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Title Skeleton */}
                    <View style={[styles.skeletonBox, { width: '60%', height: 50, alignSelf: 'center', marginBottom: 20 }]} />

                    {/* Description Skeleton */}
                    <View style={[styles.skeletonBox, { width: '80%', height: 14, alignSelf: 'center', marginBottom: 10 }]} />
                    <View style={[styles.skeletonBox, { width: '70%', height: 14, alignSelf: 'center', marginBottom: 30 }]} />

                    {/* Exercise Cards Skeleton */}
                    {[1, 2, 3, 4, 5].map((item) => (
                        <View key={item} style={styles.skeletonCard}>
                            <View style={{ flex: 1 }}>
                                <View style={[styles.skeletonBox, { width: '60%', height: 19, marginBottom: 8 }]} />
                                <View style={[styles.skeletonBox, { width: '80%', height: 14 }]} />
                            </View>
                            <View style={[styles.skeletonBox, { width: 20, height: 20 }]} />
                        </View>
                    ))}
                </ScrollView>
            </View>
        );
    }

    if (!schedule) {
        return (
            <View style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Schedule not found</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Schedule Title */}
                <Text style={styles.scheduleTitle} numberOfLines={2} ellipsizeMode="tail">
                    {schedule.name || schedule.day || 'Workout'}
                </Text>

                {/* Schedule Info */}
                <Text style={styles.scheduleDescription}>
                    {schedule.description || `${schedule.workoutType || 'Strength'} workout with ${schedule.exercises?.length || 0} exercises. Click on an exercise to see full details.`}
                </Text>

                {/* Exercises List */}
                <View style={styles.exercisesContainer}>
                    {schedule.exercises && schedule.exercises.length > 0 ? (
                        schedule.exercises.map((exercise, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.exerciseCard}
                                onPress={() => openExerciseModal(exercise)}
                                activeOpacity={0.7}
                            >
                                {/* Exercise Info */}
                                <View style={styles.exerciseInfo}>
                                    <Text style={styles.exerciseName} numberOfLines={1} ellipsizeMode="tail">
                                        {(exercise.name || exercise.exerciseName || 'Exercise').length > 20
                                            ? (exercise.name || exercise.exerciseName || 'Exercise').substring(0, 20) + '...'
                                            : (exercise.name || exercise.exerciseName || 'Exercise')}
                                    </Text>
                                    <Text style={styles.exerciseDetails} numberOfLines={1} ellipsizeMode="tail">
                                        {exercise.detail || `${exercise.sets} sets - ${exercise.reps} reps - ${exercise.weight}kg Weight`}
                                    </Text>
                                </View>

                                {/* Arrow */}
                                <Feather name="chevron-right" size={20} color="#999" />
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={styles.noExercisesContainer}>
                            <Text style={styles.noExercisesText}>No exercises in this schedule</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Exercise Detail Modal */}
            <Modal
                visible={showExerciseModal}
                transparent={true}
                animationType="slide"
                onRequestClose={closeExerciseModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* Close Button */}
                        <TouchableOpacity style={styles.closeButton} onPress={closeExerciseModal}>
                            <Feather name="x" size={28} color="#fff" />
                        </TouchableOpacity>

                        {selectedExercise && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {/* Exercise Name */}
                                <Text style={styles.modalTitle}>
                                    {selectedExercise.name || selectedExercise.exerciseName || 'Exercise'}
                                </Text>
                                <Text style={styles.modalSubtitle}>
                                    {selectedExercise.detail || `${selectedExercise.sets} sets - ${selectedExercise.reps} reps - ${selectedExercise.weight}kg Weight`}
                                </Text>

                                {/* Exercise Details */}
                                <View style={styles.detailsContainer}>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Date</Text>
                                        <Text style={styles.detailValue}>
                                            {schedule.scheduledDate
                                                ? new Date(schedule.scheduledDate).toLocaleDateString()
                                                : 'Not set'}
                                        </Text>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Sets</Text>
                                        <Text style={styles.detailValue}>{selectedExercise.sets}</Text>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Reps</Text>
                                        <Text style={styles.detailValue}>{selectedExercise.reps}</Text>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Weight</Text>
                                        <Text style={styles.detailValue}>{selectedExercise.weight} Kg</Text>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Rest</Text>
                                        <Text style={styles.detailValue}>{selectedExercise.rest || 60} sec</Text>
                                    </View>

                                    {selectedExercise.description && (
                                        <View style={[styles.detailRow, { flexDirection: 'column', alignItems: 'flex-start' }]}>
                                            <Text style={styles.detailLabel}>Description</Text>
                                            <Text style={[styles.detailValue, { marginTop: 8 }]}>
                                                {selectedExercise.description}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    scheduleTitle: {
        fontSize: 32,
        color: '#555',
        fontFamily: 'Poppins_300Light',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 40,
    },
    scheduleDescription: {
        fontSize: 14,
        color: '#777',
        fontFamily: 'Poppins_300Light',
        textAlign: 'center',
        marginBottom: 30,
        paddingHorizontal: 20,
    },
    exercisesContainer: {
        marginTop: 10,
    },
    exerciseCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        marginBottom: 15,
        justifyContent: 'space-between',
    },
    exerciseInfo: {
        flex: 1,
    },
    exerciseName: {
        fontSize: 19,
        color: '#a6a5a5ff',
        fontFamily: 'Poppins_300Light',
        marginBottom: 4,
    },
    exerciseDetails: {
        fontSize: 14,
        color: '#999',
        fontFamily: 'Poppins_300Light',
    },
    noExercisesContainer: {
        padding: 40,
        alignItems: 'center',
    },
    noExercisesText: {
        fontSize: 16,
        color: '#999',
        fontFamily: 'Poppins_300Light',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    errorText: {
        fontSize: 16,
        color: '#ff6b6b',
        fontFamily: 'Poppins_300Light',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1c1c1c',
        paddingHorizontal: 25,
        paddingTop: 20,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        maxHeight: '80%',
    },
    closeButton: {
        alignSelf: 'flex-end',
        padding: 10,
        marginBottom: 10,
    },
    modalTitle: {
        fontSize: 26,
        color: '#fff',
        fontFamily: 'Poppins_300Light',
        marginBottom: 8,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 15,
        color: '#aaa',
        fontFamily: 'Poppins_300Light',
        marginBottom: 20,
        textAlign: 'center',
    },
    detailsContainer: {
        marginTop: 8,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a2a',
    },
    detailLabel: {
        fontSize: 14,
        color: '#999',
        fontFamily: 'Poppins_400Regular',
    },
    detailValue: {
        fontSize: 16,
        color: '#bbbbbbff',
        fontFamily: 'Poppins_300Light',
    },
    // Skeleton styles
    skeletonBox: {
        backgroundColor: '#2a2a2a',
        borderRadius: 8,
    },
    skeletonCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        marginBottom: 15,
        justifyContent: 'space-between',
    },
});
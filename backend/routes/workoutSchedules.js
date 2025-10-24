const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Workout = require('../models/Workout');
const { body, validationResult } = require('express-validator');

// Get workout schedules for a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive, isCompleted, dateFrom, dateTo } = req.query;

    // Convert userId to ObjectId if it's a valid ObjectId string
    let userIdQuery = userId;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      userIdQuery = new mongoose.Types.ObjectId(userId);
    }

    const query = { userId: userIdQuery };
    
    // Filter by isActive - default to true (exclude deleted workouts)
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    } else {
      // Default: only show active workouts (exclude deleted ones)
      query.isActive = { $ne: false };
    }
    
    if (isCompleted !== undefined) {
      query.isCompleted = isCompleted === 'true';
    }



    // Date range filtering
    if (dateFrom || dateTo) {
      query.scheduledDate = {};
      if (dateFrom) query.scheduledDate.$gte = new Date(dateFrom);
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        query.scheduledDate.$lte = endDate;
      }
    }

    const workoutSchedules = await Workout.find(query)
      .populate('createdBy', 'username email')
      .populate('exercises.exercise', 'name category difficulty')
      .sort({ scheduledDate: 1 });

    res.json({
      success: true,
      workoutSchedules
    });
  } catch (error) {
    console.error('Get user workout schedules error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get all workout schedules with filtering
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      workoutType,
      difficulty,
      isCompleted,
      isActive,
      sortBy = 'scheduledDate',
      sortOrder = 'asc'
    } = req.query;

    const query = {};
    if (workoutType) query.workoutType = workoutType;
    if (difficulty) query.difficulty = difficulty;
    if (isCompleted !== undefined) query.isCompleted = isCompleted === 'true';
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    const workoutSchedules = await Workout.find(query)
      .sort(sortOptions)
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .populate('userId', 'firstName lastName email')
      .populate('createdBy', 'username email')
      .select('-__v');

    const total = await Workout.countDocuments(query);

    res.json({
      success: true,
      workoutSchedules,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalWorkoutSchedules: total,
        workoutSchedulesPerPage: limitNum
      }
    });
  } catch (error) {
    console.error('Get workout schedules error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get workout schedule by ID with enhanced exercise data
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid workout schedule ID'
      });
    }

    const workoutSchedule = await Workout.findById(req.params.id)
      .populate('userId', 'firstName lastName email')
      .populate('createdBy', 'username email');

    if (!workoutSchedule) {
      return res.status(404).json({
        success: false,
        error: 'Workout schedule not found'
      });
    }

    // Connect to flexcoach database to get detailed exercise information
    const flexcoachDb = mongoose.connection.useDb('flexcoach');
    const ExercisesCollection = flexcoachDb.collection('exercises');

    // Use embedded exercise data from workout document (no need to fetch from exercises collection)
    const enhancedExercises = [];
    
    for (const exerciseSet of workoutSchedule.exercises) {
      // Create enhanced exercise object using embedded data
      const enhancedExercise = {
        _id: exerciseSet._id,
        exercise: exerciseSet.exercise,
        exerciseName: exerciseSet.exerciseName,
        videoUrl: exerciseSet.videoUrl, // Use embedded video URL
        description: exerciseSet.description, // Use embedded description
        category: exerciseSet.category, // Use embedded category
        difficulty: exerciseSet.difficulty, // Use embedded difficulty
        sets: exerciseSet.sets,
        reps: exerciseSet.reps,
        weight: exerciseSet.weight,
        restTime: exerciseSet.restTime,
        duration: exerciseSet.duration,
        notes: exerciseSet.notes,
        // Keep exerciseDetails for backward compatibility but use embedded data
        exerciseDetails: {
          name: exerciseSet.exerciseName,
          description: exerciseSet.description || '',
          videoUrl: exerciseSet.videoUrl || '',
          category: exerciseSet.category || '',
          difficulty: exerciseSet.difficulty || '',
          equipment: [], // Not embedded yet
          muscleGroups: [], // Not embedded yet
          instructions: [] // Not embedded yet
        }
      };
      
      enhancedExercises.push(enhancedExercise);
    }

    // Return workout schedule with enhanced exercise data
    const enhancedWorkoutSchedule = {
      ...workoutSchedule.toObject(),
      exercises: enhancedExercises
    };

    res.json({
      success: true,
      workoutSchedule: enhancedWorkoutSchedule
    });
  } catch (error) {
    console.error('Get workout schedule error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create new workout schedule (admin only)
router.post('/', [
  body('name').notEmpty().trim().withMessage('Workout schedule name is required'),
  body('userId').isMongoId().withMessage('Valid user ID is required'),
  body('day').isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']).withMessage('Valid day is required'),
  body('dayNumber').optional().isInt({ min: 1, max: 999 }).withMessage('Day number must be between 1 and 999'),
  body('workoutType').isIn(['Strength', 'Cardio', 'HIIT', 'Flexibility', 'Mixed']).withMessage('Valid workout type is required'),
  body('scheduledDate').isISO8601().withMessage('Valid scheduled date is required'),
  body('exercises').isArray().withMessage('Exercises must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    console.log('Creating workout schedule with data:', JSON.stringify(req.body, null, 2));

    // Connect to flexcoach database to get exercise names
    const flexcoachDb = mongoose.connection.useDb('flexcoach');
    const ExercisesCollection = flexcoachDb.collection('exercises');

    // Process exercises and fetch complete details including video URLs from exercise collection
    const processedExercises = [];
    
    for (const exercise of req.body.exercises) {
      let exerciseName = exercise.exerciseName || 'Unknown Exercise';
      let exerciseId = exercise.exercise;
      let videoUrl = null;
      let description = null;
      let category = null;
      let difficulty = null;
      
      console.log('Processing exercise:', exercise);
      
      // If exercise ID is provided and valid, fetch complete details from the exercise collection
      if (exercise.exercise && mongoose.Types.ObjectId.isValid(exercise.exercise)) {
        try {
          const exerciseDoc = await ExercisesCollection.findOne({
            _id: new mongoose.Types.ObjectId(exercise.exercise)
          });
          
          if (exerciseDoc) {
            exerciseName = exerciseDoc.name;
            videoUrl = exerciseDoc.videoUrl;
            description = exerciseDoc.description;
            category = exerciseDoc.category;
            difficulty = exerciseDoc.difficulty;
            console.log('Found exercise details:', {
              name: exerciseName,
              videoUrl: videoUrl,
              category: category,
              difficulty: difficulty
            });
          }
        } catch (exerciseError) {
          console.log('Could not fetch exercise details for ID:', exercise.exercise, exerciseError.message);
        }
      } else if (exercise.exercise && exercise.exercise.startsWith('mock_')) {
        // Handle mock exercises - don't set exercise ID for these
        exerciseId = null;
        // Use a default name mapping for mock exercises with mock video URLs
        const mockExerciseData = {
          'mock_1': { name: 'Push Ups', videoUrl: 'https://www.youtube.com/watch?v=IODxDxX7oi4' },
          'mock_2': { name: 'Squats', videoUrl: 'https://www.youtube.com/watch?v=aclHkVaku9U' },
          'mock_3': { name: 'Bench Press', videoUrl: 'https://www.youtube.com/watch?v=rT7DgCr-3pg' },
          'mock_4': { name: 'Deadlift', videoUrl: 'https://www.youtube.com/watch?v=ytGaGIn3SjE' },
          'mock_5': { name: 'Bicep Curls', videoUrl: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo' },
          'mock_6': { name: 'Plank', videoUrl: 'https://www.youtube.com/watch?v=ASdvN_XEl_c' }
        };
        const mockData = mockExerciseData[exercise.exercise] || { name: 'Unknown Exercise', videoUrl: null };
        exerciseName = mockData.name;
        videoUrl = mockData.videoUrl;
      }
      
      const processedExercise = {
        exercise: exerciseId, // Will be null for mock exercises
        exerciseName: exerciseName,
        videoUrl: videoUrl, // Include video URL directly in workout document
        description: description,
        category: category,
        difficulty: difficulty,
        sets: exercise.sets,
        reps: exercise.reps,
        weight: exercise.weight || 0,
        restTime: exercise.restTime || 60
      };
      
      console.log('Processed exercise with video URL:', processedExercise);
      processedExercises.push(processedExercise);
    }

    // Handle createdBy field - convert to ObjectId if possible, otherwise use a default
    let createdBy = null;
    if (req.user && req.user.userId) {
      if (mongoose.Types.ObjectId.isValid(req.user.userId)) {
        createdBy = new mongoose.Types.ObjectId(req.user.userId);
      } else {
        // For simple admin login, create a default ObjectId
        createdBy = new mongoose.Types.ObjectId();
      }
    }

    const workoutData = {
      name: req.body.name,
      description: req.body.description,
      userId: req.body.userId,
      day: req.body.day,
      dayNumber: req.body.dayNumber, // Use custom day number if provided
      exercises: processedExercises,
      totalDuration: req.body.totalDuration,
      workoutType: req.body.workoutType,
      scheduledDate: req.body.scheduledDate,
      difficulty: req.body.difficulty || 'Beginner',
      createdBy: createdBy
    };

    console.log('Final workout data:', JSON.stringify(workoutData, null, 2));

    const workoutSchedule = new Workout(workoutData);
    await workoutSchedule.save();

    console.log('Workout schedule saved successfully');

    res.status(201).json({
      success: true,
      message: 'Workout schedule created successfully',
      workoutSchedule
    });
  } catch (error) {
    console.error('Create workout schedule error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Update workout schedule (admin only)
router.put('/:id', async (req, res) => {
  try {
    const workoutSchedule = await Workout.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!workoutSchedule) {
      return res.status(404).json({
        success: false,
        error: 'Workout schedule not found'
      });
    }

    res.json({
      success: true,
      message: 'Workout schedule updated successfully',
      workoutSchedule
    });
  } catch (error) {
    console.error('Update workout schedule error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Mark workout as completed
router.patch('/:id/complete', async (req, res) => {
  try {
    const workoutSchedule = await Workout.findByIdAndUpdate(
      req.params.id,
      { 
        isCompleted: true,
        completedAt: new Date()
      },
      { new: true }
    );

    if (!workoutSchedule) {
      return res.status(404).json({
        success: false,
        error: 'Workout schedule not found'
      });
    }

    res.json({
      success: true,
      message: 'Workout marked as completed',
      workoutSchedule
    });
  } catch (error) {
    console.error('Complete workout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete workout schedule (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const workoutSchedule = await Workout.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!workoutSchedule) {
      return res.status(404).json({
        success: false,
        error: 'Workout schedule not found'
      });
    }

    res.json({
      success: true,
      message: 'Workout schedule deleted successfully'
    });
  } catch (error) {
    console.error('Delete workout schedule error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get latest workout schedule for a user (for quick access)
router.get('/user/:userId/latest', async (req, res) => {
  try {
    const { userId } = req.params;

    // Convert userId to ObjectId if it's a valid ObjectId string
    let userIdQuery = userId;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      userIdQuery = new mongoose.Types.ObjectId(userId);
    }

    // Find the most recent workout schedule for the user
    const latestWorkout = await Workout.findOne({ 
      userId: userIdQuery,
      isActive: { $ne: false }
    })
    .sort({ scheduledDate: -1, createdAt: -1 })
    .limit(1);

    if (!latestWorkout) {
      return res.status(404).json({
        success: false,
        error: 'No workout schedules found for user'
      });
    }

    // Redirect to the detailed workout schedule endpoint
    res.json({
      success: true,
      workoutScheduleId: latestWorkout._id,
      redirectUrl: `/api/admin/workout-schedules/${latestWorkout._id}/details`
    });
  } catch (error) {
    console.error('Get latest workout schedule error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get workout schedule details formatted for ProfileSchedules component
router.get('/:id/details', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid workout schedule ID'
      });
    }

    const workoutSchedule = await Workout.findById(req.params.id);

    if (!workoutSchedule) {
      return res.status(404).json({
        success: false,
        error: 'Workout schedule not found'
      });
    }

    // Connect to flexcoach database to get detailed exercise information
    const flexcoachDb = mongoose.connection.useDb('flexcoach');
    const ExercisesCollection = flexcoachDb.collection('exercises');

    // Format exercises for ProfileSchedules component using embedded data
    const formattedExercises = [];
    
    for (const exerciseSet of workoutSchedule.exercises) {
      // Use embedded video URL and details from the workout document
      // No need to fetch from exercises collection anymore since data is embedded
      
      // Format exercise data to match ProfileSchedules component expectations
      const formattedExercise = {
        name: exerciseSet.exerciseName,
        detail: `${exerciseSet.sets} sets - ${exerciseSet.reps} reps - ${exerciseSet.weight}kg Weight`,
        videoUrl: exerciseSet.videoUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Use embedded video URL
        // Additional data for the modal
        sets: exerciseSet.sets,
        reps: exerciseSet.reps,
        weight: exerciseSet.weight,
        rest: exerciseSet.restTime,
        date: workoutSchedule.scheduledDate,
        description: exerciseSet.description || '', // Use embedded description
        category: exerciseSet.category || '', // Use embedded category
        difficulty: exerciseSet.difficulty || '', // Use embedded difficulty
        instructions: [] // Instructions not embedded yet, can be added later if needed
      };
      
      formattedExercises.push(formattedExercise);
    }

    // Use stored dayNumber or convert from day name as fallback
    const dayNumber = workoutSchedule.dayNumber || (() => {
      const dayMap = {
        'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
        'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7
      };
      return dayMap[workoutSchedule.day] || 1;
    })();

    // Format response to match ProfileSchedules component expectations
    const formattedResponse = {
      success: true,
      workoutSchedule: {
        _id: workoutSchedule._id,
        name: workoutSchedule.name,
        day: workoutSchedule.day,
        dayNumber: dayNumber,
        workoutType: workoutSchedule.workoutType,
        totalDuration: workoutSchedule.totalDuration,
        difficulty: workoutSchedule.difficulty,
        scheduledDate: workoutSchedule.scheduledDate,
        isCompleted: workoutSchedule.isCompleted
      },
      exercises: formattedExercises,
      dayTitle: `Day ${dayNumber}`,
      totalExercises: formattedExercises.length
    };

    res.json(formattedResponse);
  } catch (error) {
    console.error('Get workout schedule details error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
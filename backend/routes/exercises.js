const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Exercise = require('../models/Exercise');
const { body, validationResult } = require('express-validator');

// Get all exercises with filtering and pagination from flexcoach database
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      difficulty,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Connect to flexcoach database
    const flexcoachDb = mongoose.connection.useDb('flexcoach');
    const ExercisesCollection = flexcoachDb.collection('exercises');

    const query = { isActive: { $ne: false } }; // Include exercises that are active or don't have isActive field

    // Apply filters
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    const exercises = await ExercisesCollection.find(query)
      .sort(sortOptions)
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .toArray();

    const total = await ExercisesCollection.countDocuments(query);

    res.json({
      success: true,
      exercises,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalExercises: total,
        exercisesPerPage: limitNum
      }
    });
  } catch (error) {
    console.error('Get exercises error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get exercise by ID from flexcoach database
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid exercise ID'
      });
    }

    const flexcoachDb = mongoose.connection.useDb('flexcoach');
    const ExercisesCollection = flexcoachDb.collection('exercises');

    const exercise = await ExercisesCollection.findOne({
      _id: new mongoose.Types.ObjectId(req.params.id)
    });

    if (!exercise) {
      return res.status(404).json({
        success: false,
        error: 'Exercise not found'
      });
    }

    res.json({
      success: true,
      exercise
    });
  } catch (error) {
    console.error('Get exercise error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create new exercise (admin only)
router.post('/', [
  body('name').notEmpty().trim().withMessage('Exercise name is required'),
  body('description').notEmpty().trim().withMessage('Description is required'),
  body('videoUrl').notEmpty().trim().withMessage('Video URL is required')
    .custom((value) => {
      // More flexible URL validation for YouTube and other video URLs
      const urlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com)/i;
      if (!urlPattern.test(value) && !value.startsWith('http')) {
        throw new Error('Please provide a valid video URL (YouTube, Vimeo, etc.)');
      }
      return true;
    }),
  body('category').optional().isIn(['Cardio', 'Strength', 'Flexibility', 'Balance', 'Sports']),
  body('difficulty').optional().isIn(['Beginner', 'Intermediate', 'Advanced'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Exercise validation errors:', errors.array());
      console.error('Request body:', req.body);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // Connect to flexcoach database
    const flexcoachDb = mongoose.connection.useDb('flexcoach');
    const ExercisesCollection = flexcoachDb.collection('exercises');
    
    // Test database connection
    console.log('Database connection state:', mongoose.connection.readyState);
    console.log('Database name:', flexcoachDb.databaseName);

    console.log('User info:', req.user);
    console.log('Request body:', req.body);

    // Handle createdBy field - make it optional for now
    let createdBy = null;
    if (req.user && req.user.userId) {
      try {
        // Try to create ObjectId if userId is valid
        if (mongoose.Types.ObjectId.isValid(req.user.userId)) {
          createdBy = new mongoose.Types.ObjectId(req.user.userId);
        } else {
          // If not valid ObjectId, just store the userId as string
          createdBy = req.user.userId;
        }
      } catch (objectIdError) {
        console.log('Could not create ObjectId from userId, using string instead');
        createdBy = req.user.userId;
      }
    }

    const exerciseData = {
      ...req.body,
      createdBy,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('Exercise data to insert:', exerciseData);

    const result = await ExercisesCollection.insertOne(exerciseData);
    const exercise = await ExercisesCollection.findOne({ _id: result.insertedId });

    res.status(201).json({
      success: true,
      message: 'Exercise created successfully',
      exercise
    });
  } catch (error) {
    console.error('Create exercise error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Update exercise (admin only) in flexcoach database
router.put('/:id', [
  body('name').optional().notEmpty().trim(),
  body('description').optional().notEmpty().trim(),
  body('videoUrl').optional().notEmpty().trim()
    .custom((value) => {
      if (value) {
        const urlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com)/i;
        if (!urlPattern.test(value) && !value.startsWith('http')) {
          throw new Error('Please provide a valid video URL (YouTube, Vimeo, etc.)');
        }
      }
      return true;
    }),
  body('category').optional().isIn(['Cardio', 'Strength', 'Flexibility', 'Balance', 'Sports']),
  body('difficulty').optional().isIn(['Beginner', 'Intermediate', 'Advanced'])
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

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid exercise ID'
      });
    }

    const flexcoachDb = mongoose.connection.useDb('flexcoach');
    const ExercisesCollection = flexcoachDb.collection('exercises');

    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };

    const result = await ExercisesCollection.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(req.params.id) },
      { $set: updateData },
      { returnOriginal: false }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Exercise not found'
      });
    }

    res.json({
      success: true,
      message: 'Exercise updated successfully',
      exercise: result
    });
  } catch (error) {
    console.error('Update exercise error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete exercise (admin only) from flexcoach database
router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid exercise ID'
      });
    }

    const flexcoachDb = mongoose.connection.useDb('flexcoach');
    const ExercisesCollection = flexcoachDb.collection('exercises');

    const result = await ExercisesCollection.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(req.params.id) },
      { 
        $set: { 
          isActive: false,
          updatedAt: new Date()
        }
      },
      { returnOriginal: false }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Exercise not found'
      });
    }

    res.json({
      success: true,
      message: 'Exercise deleted successfully'
    });
  } catch (error) {
    console.error('Delete exercise error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
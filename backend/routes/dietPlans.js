const express = require('express');
const router = express.Router();
const Diet = require('../models/Diet');
const { body, validationResult } = require('express-validator');

// Get diet plans for a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.query;

    console.log('Get user diet plans - userId:', userId);
    console.log('Get user diet plans - isActive:', isActive);

    // Convert userId to ObjectId if it's a valid ObjectId string
    const mongoose = require('mongoose');
    let userIdQuery = userId;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      userIdQuery = new mongoose.Types.ObjectId(userId);
    }

    const query = { userId: userIdQuery };

    // Only add isActive filter if explicitly provided
    if (isActive !== undefined) {
      query.isActive = isActive === 'true' || isActive === true;
    }

    console.log('Query:', query);

    // Check if this is an admin request (has authentication)
    const isAdminRequest = req.user && req.user.userId;

    let dietPlans;
    if (isAdminRequest) {
      // Admin request - use populate
      dietPlans = await Diet.find(query)
        .populate('createdBy', 'username email')
        .populate('meals.foods.food', 'name category')
        .sort({ createdAt: -1 });
    } else {
      // Non-admin request - no populate to avoid authentication issues
      dietPlans = await Diet.find(query)
        .sort({ createdAt: -1 });
    }

    console.log('Found diet plans:', dietPlans.length);

    res.json({
      success: true,
      dietPlans
    });
  } catch (error) {
    console.error('Get user diet plans error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get all diet plans with filtering
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      dietType,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    if (dietType) query.dietType = dietType;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    const dietPlans = await Diet.find(query)
      .sort(sortOptions)
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .populate('userId', 'firstName lastName email')
      .populate('createdBy', 'username email')
      .select('-__v');

    const total = await Diet.countDocuments(query);

    res.json({
      success: true,
      dietPlans,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalDietPlans: total,
        dietPlansPerPage: limitNum
      }
    });
  } catch (error) {
    console.error('Get diet plans error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get diet plan by ID
router.get('/:id', async (req, res) => {
  try {
    const dietPlan = await Diet.findById(req.params.id)
      .populate('userId', 'firstName lastName email')
      .populate('createdBy', 'username email')
      .populate('meals.foods.food', 'name category nutritionPer100g');

    if (!dietPlan) {
      return res.status(404).json({
        success: false,
        error: 'Diet plan not found'
      });
    }

    res.json({
      success: true,
      dietPlan
    });
  } catch (error) {
    console.error('Get diet plan error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create new diet plan (admin only)
router.post('/', [
  body('name').notEmpty().trim().withMessage('Diet plan name is required'),
  body('userId').isMongoId().withMessage('Valid user ID is required'),
  body('dietType').isIn(['Weight Loss', 'Weight Gain', 'Muscle Building', 'Maintenance', 'Athletic Performance']).withMessage('Valid diet type is required'),
  body('meals').isArray().withMessage('Meals must be an array'),
  body('meals.*.name').notEmpty().withMessage('Meal name is required'),
  body('meals.*.time').isIn(['Morning', 'Breakfast', 'Snacks', 'Lunch', 'Post-Workout', 'Dinner', 'Evening']).withMessage('Valid meal time is required')
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

    const dietPlan = new Diet({
      ...req.body,
      createdBy: req.user?.userId || req.body.userId // Use admin userId or fallback to provided userId
    });

    await dietPlan.save();

    res.status(201).json({
      success: true,
      message: 'Diet plan created successfully',
      dietPlan
    });
  } catch (error) {
    console.error('Create diet plan error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update diet plan (admin only)
router.put('/:id', async (req, res) => {
  try {
    const dietPlan = await Diet.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!dietPlan) {
      return res.status(404).json({
        success: false,
        error: 'Diet plan not found'
      });
    }

    res.json({
      success: true,
      message: 'Diet plan updated successfully',
      dietPlan
    });
  } catch (error) {
    console.error('Update diet plan error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid data format',
        details: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete diet plan (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const dietPlan = await Diet.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!dietPlan) {
      return res.status(404).json({
        success: false,
        error: 'Diet plan not found'
      });
    }

    res.json({
      success: true,
      message: 'Diet plan deleted successfully'
    });
  } catch (error) {
    console.error('Delete diet plan error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
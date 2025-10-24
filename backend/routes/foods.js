const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Food = require('../models/Food');
const { body, validationResult } = require('express-validator');

// Get all foods with filtering and pagination from flexcoach database
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      search,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    // Connect to flexcoach database
    const flexcoachDb = mongoose.connection.useDb('flexcoach');
    const FoodsCollection = flexcoachDb.collection('foods');

    const query = { isActive: { $ne: false } }; // Include foods that are active or don't have isActive field

    // Apply filters
    if (category) query.category = category;
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    const foods = await FoodsCollection.find(query)
      .sort(sortOptions)
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .toArray();

    const total = await FoodsCollection.countDocuments(query);

    res.json({
      success: true,
      foods,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalFoods: total,
        foodsPerPage: limitNum
      }
    });
  } catch (error) {
    console.error('Get foods error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get food by ID from flexcoach database
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid food ID'
      });
    }

    const flexcoachDb = mongoose.connection.useDb('flexcoach');
    const FoodsCollection = flexcoachDb.collection('foods');

    const food = await FoodsCollection.findOne({
      _id: new mongoose.Types.ObjectId(req.params.id)
    });

    if (!food) {
      return res.status(404).json({
        success: false,
        error: 'Food not found'
      });
    }

    res.json({
      success: true,
      food
    });
  } catch (error) {
    console.error('Get food error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create new food (admin only)
router.post('/', [
  body('name').notEmpty().trim().withMessage('Food name is required'),
  body('category').isIn(['Protein', 'Carbohydrates', 'Vegetables', 'Fruits', 'Dairy', 'Fats', 'Beverages', 'Snacks']).withMessage('Valid category is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Food validation errors:', errors.array());
      console.error('Request body:', req.body);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // Connect to flexcoach database
    const flexcoachDb = mongoose.connection.useDb('flexcoach');
    const FoodsCollection = flexcoachDb.collection('foods');

    console.log('User info:', req.user);
    console.log('Request body:', req.body);

    // Handle createdBy field - make it optional
    let createdBy = null;
    if (req.user && req.user.userId) {
      try {
        if (mongoose.Types.ObjectId.isValid(req.user.userId)) {
          createdBy = new mongoose.Types.ObjectId(req.user.userId);
        } else {
          createdBy = req.user.userId;
        }
      } catch (objectIdError) {
        console.log('Could not create ObjectId from userId, using string instead');
        createdBy = req.user.userId;
      }
    }

    const foodData = {
      ...req.body,
      createdBy,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('Food data to insert:', foodData);

    const result = await FoodsCollection.insertOne(foodData);
    const food = await FoodsCollection.findOne({ _id: result.insertedId });

    res.status(201).json({
      success: true,
      message: 'Food created successfully',
      food
    });
  } catch (error) {
    console.error('Create food error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Update food (admin only) in flexcoach database
router.put('/:id', [
  body('name').optional().notEmpty().trim(),
  body('category').optional().isIn(['Protein', 'Carbohydrates', 'Vegetables', 'Fruits', 'Dairy', 'Fats', 'Beverages', 'Snacks'])
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
        error: 'Invalid food ID'
      });
    }

    const flexcoachDb = mongoose.connection.useDb('flexcoach');
    const FoodsCollection = flexcoachDb.collection('foods');

    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };

    const result = await FoodsCollection.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(req.params.id) },
      { $set: updateData },
      { returnOriginal: false }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Food not found'
      });
    }

    res.json({
      success: true,
      message: 'Food updated successfully',
      food: result
    });
  } catch (error) {
    console.error('Update food error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete food (admin only) from flexcoach database
router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid food ID'
      });
    }

    const flexcoachDb = mongoose.connection.useDb('flexcoach');
    const FoodsCollection = flexcoachDb.collection('foods');

    const result = await FoodsCollection.findOneAndUpdate(
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
        error: 'Food not found'
      });
    }

    res.json({
      success: true,
      message: 'Food deleted successfully'
    });
  } catch (error) {
    console.error('Delete food error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
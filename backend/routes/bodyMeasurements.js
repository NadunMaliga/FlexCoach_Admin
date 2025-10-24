const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Measurement = require('../models/Measurement');
const { body, validationResult } = require('express-validator');

// Get body measurements for a specific user from flexcoach measurements collection
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { 
      dateFrom, 
      dateTo,
      limit = 100,
      sortOrder = 'desc',
      measurementType
    } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }

    // Connect to flexcoach database to fetch measurements
    const flexcoachDb = mongoose.connection.useDb('flexcoach');
    const MeasurementsCollection = flexcoachDb.collection('measurements');

    // Build query
    const query = { userId: new mongoose.Types.ObjectId(userId) };

    // Add date filtering if provided
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }

    console.log('🔍 Querying measurements with:', query);

    // Get measurement records with sorting and limit
    const sortOptions = { createdAt: sortOrder === 'asc' ? 1 : -1 };
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    const measurementRecords = await MeasurementsCollection.find(query)
      .sort(sortOptions)
      .limit(limitNum)
      .toArray();

    const total = await MeasurementsCollection.countDocuments(query);

    console.log(`📊 Found ${measurementRecords.length} measurement records for user ${userId}`);

    // Transform nested measurements into individual measurement entries
    const measurements = [];
    const groupedMeasurements = {};

    measurementRecords.forEach(record => {
      const measurementsData = record.measurements || {};
      
      Object.keys(measurementsData).forEach(type => {
        const value = measurementsData[type];
        if (value !== null && value !== undefined) {
          // Skip if filtering by specific measurement type and this doesn't match
          if (measurementType && type !== measurementType) {
            return;
          }

          const measurementType = type.charAt(0).toUpperCase() + type.slice(1);
          const measurement = {
            _id: `${record._id}_${type}`,
            userId: record.userId,
            measurementType,
            value,
            unit: getUnitForMeasurementType(type),
            date: record.date || record.createdAt,
            createdAt: record.createdAt,
            recordId: record._id
          };

          measurements.push(measurement);

          // Group by type
          if (!groupedMeasurements[measurementType]) {
            groupedMeasurements[measurementType] = [];
          }
          groupedMeasurements[measurementType].push(measurement);
        }
      });
    });

    res.json({
      success: true,
      measurements,
      groupedMeasurements,
      count: measurements.length,
      total,
      pagination: {
        limit: limitNum,
        totalRecords: total
      }
    });
  } catch (error) {
    console.error('Get user body measurements error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Helper function to determine unit based on measurement type
function getUnitForMeasurementType(type) {
  switch (type.toLowerCase()) {
    case 'weight':
      return 'kg';
    case 'height':
      return 'cm';
    case 'steps':
      return 'steps';
    case 'shoulders':
    case 'chest':
    case 'neck':
    case 'waist':
    case 'hips':
    case 'leftbicep':
    case 'rightbicep':
    case 'leftforearm':
    case 'rightforearm':
    case 'leftthigh':
    case 'rightthigh':
    case 'leftcalf':
    case 'rightcalf':
      return 'cm';
    default:
      return 'cm'; // Default for body measurements
  }
}

// Get latest measurements for a user (one per type) from flexcoach measurements collection
router.get('/user/:userId/latest', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }

    // Connect to flexcoach database to fetch measurements
    const flexcoachDb = mongoose.connection.useDb('flexcoach');
    const MeasurementsCollection = flexcoachDb.collection('measurements');

    // Find all measurement records for this user
    const measurementRecords = await MeasurementsCollection.find({
      userId: new mongoose.Types.ObjectId(userId)
    }).sort({ createdAt: -1 }).toArray();

    if (!measurementRecords || measurementRecords.length === 0) {
      return res.json({
        success: true,
        latestMeasurements: {},
        count: 0
      });
    }

    // Get the latest measurements by extracting from the most recent record
    const latestMeasurements = {};
    const latestRecord = measurementRecords[0]; // Most recent record
    const measurementsData = latestRecord.measurements || {};

    // Transform to expected format
    Object.keys(measurementsData).forEach(type => {
      const value = measurementsData[type];
      if (value !== null && value !== undefined) {
        const measurementType = type.charAt(0).toUpperCase() + type.slice(1);
        latestMeasurements[measurementType] = {
          _id: `${latestRecord._id}_${type}`,
          userId: latestRecord.userId,
          measurementType,
          value,
          unit: getUnitForMeasurementType(type),
          date: latestRecord.date || latestRecord.createdAt,
          createdAt: latestRecord.createdAt,
          recordId: latestRecord._id
        };
      }
    });

    res.json({
      success: true,
      latestMeasurements,
      count: Object.keys(latestMeasurements).length,
      totalRecords: measurementRecords.length,
      latestRecordDate: latestRecord.createdAt
    });
  } catch (error) {
    console.error('Get latest measurements error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch latest measurements'
    });
  }
});

// Get all body measurements with filtering
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      measurementType,
      frequency,
      recordedBy,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    if (measurementType) query.measurementType = measurementType;
    if (frequency) query.frequency = frequency;
    if (recordedBy) query.recordedBy = recordedBy;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    const measurements = await Measurement.find(query)
      .sort(sortOptions)
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .populate('userId', 'firstName lastName email')
      .populate('recordedById', 'username email firstName lastName')
      .select('-__v');

    const total = await Measurement.countDocuments(query);

    res.json({
      success: true,
      measurements,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalMeasurements: total,
        measurementsPerPage: limitNum
      }
    });
  } catch (error) {
    console.error('Get body measurements error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create new body measurement
router.post('/', [
  body('userId').isMongoId().withMessage('Valid user ID is required'),
  body('measurementType').isIn([
    'Weight', 'Height', 'Steps',
    'Shoulders', 'Chest', 'Neck', 'Waist', 'Hips',
    'Left Bicep', 'Right Bicep', 'Left Forearm', 'Right Forearm',
    'Left Thigh', 'Right Thigh', 'Left Calf', 'Right Calf'
  ]).withMessage('Valid measurement type is required'),
  body('value').isNumeric().withMessage('Valid numeric value is required'),
  body('unit').isIn(['kg', 'lbs', 'cm', 'inches', 'steps']).withMessage('Valid unit is required'),
  body('frequency').isIn(['Daily', 'Weekly', 'One-Time']).withMessage('Valid frequency is required')
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

    const measurement = new Measurement({
      ...req.body,
      recordedBy: 'admin',
      recordedById: req.user.userId
    });

    await measurement.save();

    res.status(201).json({
      success: true,
      message: 'Body measurement recorded successfully',
      measurement
    });
  } catch (error) {
    console.error('Create body measurement error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update body measurement
router.put('/:id', [
  body('value').optional().isNumeric(),
  body('unit').optional().isIn(['kg', 'lbs', 'cm', 'inches', 'steps']),
  body('notes').optional().trim()
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

    const measurement = await Measurement.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!measurement) {
      return res.status(404).json({
        success: false,
        error: 'Body measurement not found'
      });
    }

    res.json({
      success: true,
      message: 'Body measurement updated successfully',
      measurement
    });
  } catch (error) {
    console.error('Update body measurement error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete body measurement
router.delete('/:id', async (req, res) => {
  try {
    const measurement = await Measurement.findByIdAndDelete(req.params.id);

    if (!measurement) {
      return res.status(404).json({
        success: false,
        error: 'Body measurement not found'
      });
    }

    res.json({
      success: true,
      message: 'Body measurement deleted successfully'
    });
  } catch (error) {
    console.error('Delete body measurement error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get measurement statistics for a user from userprofiles
router.get('/user/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;
    const { period = '30d' } = req.query;

    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Find user profile with measurement history
    let userProfile = await mongoose.connection.db.collection('userprofiles').findOne({ userId });
    
    if (!userProfile && mongoose.Types.ObjectId.isValid(userId)) {
      // Try finding by ObjectId
      userProfile = await mongoose.connection.db.collection('userprofiles').findOne({ userId: new mongoose.Types.ObjectId(userId) });
    }
    
    if (!userProfile) {
      // Try finding by _id
      userProfile = await mongoose.connection.db.collection('userprofiles').findOne({ _id: new mongoose.Types.ObjectId(userId) });
    }

    if (!userProfile || !userProfile.measurementHistory || userProfile.measurementHistory.length === 0) {
      return res.json({
        success: true,
        period,
        stats: {},
        totalMeasurements: 0
      });
    }

    // Filter measurements by date range
    const filteredHistory = userProfile.measurementHistory.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    if (filteredHistory.length === 0) {
      return res.json({
        success: true,
        period,
        stats: {},
        totalMeasurements: 0
      });
    }

    // Group by measurement type and calculate trends
    const stats = {};
    const measurementTypes = new Set();

    // Collect all measurement types
    filteredHistory.forEach(entry => {
      Object.keys(entry.measurements || {}).forEach(type => {
        if (entry.measurements[type] !== null && entry.measurements[type] !== undefined) {
          measurementTypes.add(type);
        }
      });
    });

    // Calculate stats for each measurement type
    measurementTypes.forEach(type => {
      const typeData = filteredHistory
        .map(entry => ({
          value: entry.measurements[type],
          date: entry.date
        }))
        .filter(item => item.value !== null && item.value !== undefined);

      if (typeData.length > 0) {
        const latest = typeData[typeData.length - 1];
        const earliest = typeData[0];
        
        const measurementType = type.charAt(0).toUpperCase() + type.slice(1);
        stats[measurementType] = {
          latest: latest.value,
          earliest: earliest.value,
          change: latest.value - earliest.value,
          changePercent: earliest.value !== 0 ? ((latest.value - earliest.value) / earliest.value * 100).toFixed(2) : 0,
          unit: getUnitForMeasurementType(type),
          count: typeData.length,
          trend: latest.value > earliest.value ? 'up' : latest.value < earliest.value ? 'down' : 'stable'
        };
      }
    });

    res.json({
      success: true,
      period,
      stats,
      totalMeasurements: filteredHistory.length,
      userProfile: {
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        email: userProfile.email
      }
    });
  } catch (error) {
    console.error('Get measurement stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
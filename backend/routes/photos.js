const express = require('express');
const router = express.Router();
const Photo = require('../models/Photo');
const User = require('../models/User');
const mongoose = require('mongoose');

// Get all photos for a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format'
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get all photos for the user, sorted by date (newest first)
    const photos = await Photo.find({ userId })
      .sort({ date: -1 })
      .select('-__v');

    res.json({
      success: true,
      photos,
      count: photos.length
    });
  } catch (error) {
    console.error('Get user photos error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Add new photos for a user
router.post('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { photos, notes, date } = req.body;

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format'
      });
    }

    // Validate required fields
    if (!photos || !photos.front || !photos.side || !photos.back) {
      return res.status(400).json({
        success: false,
        error: 'Photos object with front, side, and back properties is required'
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Create new photo entry
    const newPhoto = new Photo({
      userId,
      photos: {
        front: photos.front,
        side: photos.side,
        back: photos.back
      },
      notes: notes || '',
      date: date ? new Date(date) : new Date(),
      isActive: true
    });

    await newPhoto.save();

    res.status(201).json({
      success: true,
      message: 'Photos added successfully',
      photo: newPhoto
    });
  } catch (error) {
    console.error('Add photos error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update photos for a specific photo entry
router.put('/:photoId', async (req, res) => {
  try {
    const { photoId } = req.params;
    const { photos, notes, date } = req.body;

    // Validate photoId format
    if (!mongoose.Types.ObjectId.isValid(photoId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid photo ID format'
      });
    }

    // Find and update the photo
    const photo = await Photo.findById(photoId);
    if (!photo) {
      return res.status(404).json({
        success: false,
        error: 'Photo entry not found'
      });
    }

    // Update fields if provided
    if (photos) {
      if (photos.front) photo.photos.front = photos.front;
      if (photos.side) photo.photos.side = photos.side;
      if (photos.back) photo.photos.back = photos.back;
    }
    if (notes !== undefined) photo.notes = notes;
    if (date) photo.date = new Date(date);

    await photo.save();

    res.json({
      success: true,
      message: 'Photos updated successfully',
      photo
    });
  } catch (error) {
    console.error('Update photos error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete a photo entry
router.delete('/:photoId', async (req, res) => {
  try {
    const { photoId } = req.params;

    // Validate photoId format
    if (!mongoose.Types.ObjectId.isValid(photoId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid photo ID format'
      });
    }

    // Find and delete the photo
    const photo = await Photo.findByIdAndDelete(photoId);
    if (!photo) {
      return res.status(404).json({
        success: false,
        error: 'Photo entry not found'
      });
    }

    res.json({
      success: true,
      message: 'Photos deleted successfully'
    });
  } catch (error) {
    console.error('Delete photos error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get latest photos for a user (most recent entry)
router.get('/user/:userId/latest', async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format'
      });
    }

    // Get the most recent photo entry for the user
    const latestPhoto = await Photo.findOne({ userId })
      .sort({ date: -1 })
      .select('-__v');

    if (!latestPhoto) {
      return res.status(404).json({
        success: false,
        error: 'No photos found for this user'
      });
    }

    res.json({
      success: true,
      photo: latestPhoto
    });
  } catch (error) {
    console.error('Get latest photos error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
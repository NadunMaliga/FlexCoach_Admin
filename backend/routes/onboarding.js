const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Get user onboarding data
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }

    // Connect to the flexcoach database to fetch onboarding data
    const onboardingDb = mongoose.connection.useDb('flexcoach');
    const OnboardingCollection = onboardingDb.collection('onboardings');

    const onboardingData = await OnboardingCollection.findOne({
      userId: new mongoose.Types.ObjectId(userId)
    });

    if (!onboardingData) {
      return res.status(404).json({
        success: false,
        error: 'Onboarding data not found for this user'
      });
    }

    res.json({
      success: true,
      onboarding: onboardingData
    });

  } catch (error) {
    console.error('Get onboarding error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch onboarding data'
    });
  }
});

module.exports = router;
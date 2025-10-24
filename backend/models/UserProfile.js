const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  mobile: {
    type: String,
    required: true
  },
  birthday: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other']
  },
  profilePhoto: {
    type: String,
    default: null
  },
  measurements: {
    weight: { type: Number, default: null },
    height: { type: Number, default: null },
    chest: { type: Number, default: null },
    waist: { type: Number, default: null },
    hips: { type: Number, default: null },
    shoulders: { type: Number, default: null },
    neck: { type: Number, default: null },
    leftBicep: { type: Number, default: null },
    rightBicep: { type: Number, default: null },
    leftForearm: { type: Number, default: null },
    rightForearm: { type: Number, default: null },
    leftThigh: { type: Number, default: null },
    rightThigh: { type: Number, default: null },
    leftCalf: { type: Number, default: null },
    rightCalf: { type: Number, default: null }
  },
  activity: {
    steps: { type: Number, default: 0 },
    stepsGoal: { type: Number, default: 10000 },
    lastStepsUpdate: { type: Date, default: Date.now }
  },
  fitnessGoals: [String],
  fitnessLevel: { type: Number, default: 5 },
  nutritionHabitsRating: { type: Number, default: 5 },
  equipmentAccess: [String],
  stressLevel: { type: Number, default: 5 },
  sleepHours: { type: Number, default: 7 },
  workoutHistory: [mongoose.Schema.Types.Mixed],
  dietPlans: [mongoose.Schema.Types.Mixed],
  measurementHistory: [mongoose.Schema.Types.Mixed],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
userProfileSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient querying by user
userProfileSchema.index({ userId: 1 });

module.exports = mongoose.model('UserProfile', userProfileSchema);
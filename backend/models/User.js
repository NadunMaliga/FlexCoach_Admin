// User Model - Same as client backend to share database
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  mobile: {
    type: String,
    required: true,
    trim: true
  },
  birthday: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Other']
  },
  trainingMode: {
    type: String,
    required: true,
    enum: ['Online', 'Physical Training', 'Both Options', 'Schedule Only']
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  onboardingCompleted: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Profile data
  profilePhoto: {
    type: String,
    default: null
  },
  // Activity data
  activity: {
    steps: {
      type: Number,
      default: 0,
      min: 0
    },
    stepsGoal: {
      type: Number,
      default: 10000,
      min: 1000
    },
    lastActivityUpdate: {
      type: Date,
      default: Date.now
    }
  },
  // Measurements (current/latest)
  measurements: {
    weight: {
      type: Number,
      min: 0,
      max: 1000
    },
    height: {
      type: Number,
      min: 0,
      max: 300
    },
    shoulders: {
      type: Number,
      min: 0,
      max: 200
    },
    chest: {
      type: Number,
      min: 0,
      max: 200
    },
    neck: {
      type: Number,
      min: 0,
      max: 100
    },
    waist: {
      type: Number,
      min: 0,
      max: 200
    },
    hips: {
      type: Number,
      min: 0,
      max: 200
    },
    leftBicep: {
      type: Number,
      min: 0,
      max: 100
    },
    rightBicep: {
      type: Number,
      min: 0,
      max: 100
    },
    leftForearm: {
      type: Number,
      min: 0,
      max: 100
    },
    rightForearm: {
      type: Number,
      min: 0,
      max: 100
    },
    leftThigh: {
      type: Number,
      min: 0,
      max: 200
    },
    rightThigh: {
      type: Number,
      min: 0,
      max: 200
    },
    leftCalf: {
      type: Number,
      min: 0,
      max: 100
    },
    rightCalf: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  // Fitness goals
  fitnessGoals: {
    primaryGoal: {
      type: String,
      enum: ['Weight Loss', 'Weight Gain', 'Muscle Building', 'Endurance', 'General Fitness', 'Sports Performance']
    },
    targetWeight: {
      type: Number,
      min: 0,
      max: 1000
    },
    targetDate: {
      type: Date
    },
    notes: {
      type: String,
      maxlength: 500
    }
  },
  // Status field for approval system
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  approvedAt: {
    type: Date
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  rejectedAt: {
    type: Date
  },
  rejectedReason: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Index for better query performance (email index is already created by unique: true)
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);

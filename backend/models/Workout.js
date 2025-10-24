const mongoose = require('mongoose');

const exerciseSetSchema = new mongoose.Schema({
  exercise: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exercise',
    required: true
  },
  exerciseName: {
    type: String,
    required: true
  },
  videoUrl: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    trim: true
  },
  difficulty: {
    type: String,
    trim: true
  },
  sets: {
    type: Number,
    required: true,
    min: 1
  },
  reps: {
    type: Number,
    min: 1
  },
  duration: {
    type: Number, // in seconds for time-based exercises
    min: 1
  },
  weight: {
    type: Number, // in kg
    min: 0
  },
  restTime: {
    type: Number, // in seconds
    min: 0,
    default: 60
  },
  notes: {
    type: String,
    trim: true
  }
});

const workoutScheduleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  day: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  dayNumber: {
    type: Number,
    min: 1,
    max: 999, // Allow up to 999 days for flexibility
    default: function() {
      // Auto-generate day number based on day name if not provided
      const dayMap = {
        'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
        'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7
      };
      return dayMap[this.day] || 1;
    }
  },
  exercises: [exerciseSetSchema],
  totalDuration: {
    type: Number, // in minutes
    min: 0
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  workoutType: {
    type: String,
    enum: ['Strength', 'Cardio', 'HIIT', 'Flexibility', 'Mixed'],
    required: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  }
}, {
  timestamps: true
});

workoutScheduleSchema.index({ userId: 1 });
workoutScheduleSchema.index({ scheduledDate: 1 });
workoutScheduleSchema.index({ isActive: 1 });
workoutScheduleSchema.index({ isCompleted: 1 });

module.exports = mongoose.model('Workout', workoutScheduleSchema);
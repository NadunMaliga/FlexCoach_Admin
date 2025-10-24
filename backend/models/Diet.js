const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  time: {
    type: String,
    required: true,
    enum: ['Morning', 'Breakfast', 'Snacks', 'Lunch', 'Post-Workout', 'Dinner', 'Evening']
  },
  foods: [{
    food: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Food'
    },
    foodName: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      required: true
    }
  }],
  instructions: {
    type: String,
    trim: true
  },
  totalCalories: {
    type: Number,
    min: 0
  }
});

const dietPlanSchema = new mongoose.Schema({
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
  meals: [mealSchema],
  totalDailyCalories: {
    type: Number,
    min: 0
  },
  dietType: {
    type: String,
    enum: ['Weight Loss', 'Weight Gain', 'Muscle Building', 'Maintenance', 'Athletic Performance'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  }
}, {
  timestamps: true
});

dietPlanSchema.index({ userId: 1 });
dietPlanSchema.index({ isActive: 1 });
dietPlanSchema.index({ dietType: 1 });

module.exports = mongoose.model('Diet', dietPlanSchema);
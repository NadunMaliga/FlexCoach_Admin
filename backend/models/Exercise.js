const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  videoUrl: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['Cardio', 'Strength', 'Flexibility', 'Balance', 'Sports'],
    default: 'Strength'
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  duration: {
    type: Number, // in minutes
    min: 1,
    max: 180
  },
  equipment: [{
    type: String,
    trim: true
  }],
  muscleGroups: [{
    type: String,
    enum: ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Full Body']
  }],
  instructions: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  }
}, {
  timestamps: true
});

exerciseSchema.index({ name: 1 });
exerciseSchema.index({ category: 1 });
exerciseSchema.index({ difficulty: 1 });

module.exports = mongoose.model('Exercise', exerciseSchema);
const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['Protein', 'Carbohydrates', 'Vegetables', 'Fruits', 'Dairy', 'Fats', 'Beverages', 'Snacks'],
    required: true
  },
  nutritionPer100g: {
    calories: {
      type: Number,
      min: 0
    },
    protein: {
      type: Number,
      min: 0
    },
    carbs: {
      type: Number,
      min: 0
    },
    fat: {
      type: Number,
      min: 0
    },
    fiber: {
      type: Number,
      min: 0
    }
  },
  servingSize: {
    amount: {
      type: Number,
      min: 0
    },
    unit: {
      type: String,
      enum: ['g', 'ml', 'cup', 'piece', 'slice', 'tbsp', 'tsp']
    }
  },
  allergens: [{
    type: String,
    enum: ['Gluten', 'Dairy', 'Nuts', 'Soy', 'Eggs', 'Fish', 'Shellfish']
  }],
  dietaryRestrictions: [{
    type: String,
    enum: ['Vegetarian', 'Vegan', 'Keto', 'Paleo', 'Low-Carb', 'High-Protein']
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

foodSchema.index({ name: 1 });
foodSchema.index({ category: 1 });

module.exports = mongoose.model('Food', foodSchema);
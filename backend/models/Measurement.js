
const mongoose = require('mongoose');

const bodyMeasurementSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  measurementType: {
    type: String,
    required: true,
    enum: [
      'Weight', 'Height', 'Steps',
      'Shoulders', 'Chest', 'Neck', 'Waist', 'Hips',
      'Left Bicep', 'Right Bicep', 'Left Forearm', 'Right Forearm',
      'Left Thigh', 'Right Thigh', 'Left Calf', 'Right Calf'
    ]
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    enum: ['kg', 'lbs', 'cm', 'inches', 'steps']
  },
  frequency: {
    type: String,
    enum: ['Daily', 'Weekly', 'One-Time'],
    required: true
  },
  notes: {
    type: String,
    trim: true
  },
  recordedBy: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  recordedById: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'recordedBy === "admin" ? "Admin" : "User"'
  }
}, {
  timestamps: true
});

bodyMeasurementSchema.index({ userId: 1 });
bodyMeasurementSchema.index({ measurementType: 1 });
bodyMeasurementSchema.index({ createdAt: -1 });
bodyMeasurementSchema.index({ userId: 1, measurementType: 1, createdAt: -1 });

module.exports = mongoose.model('Measurement', bodyMeasurementSchema);

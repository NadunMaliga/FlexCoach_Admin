# Exercise Plan System - Client App Implementation Guide

## Overview

The Exercise Plan system in FlexCoach allows admins to create, manage, and assign workout schedules to clients. This document explains how the exercise plan functionality works from both the admin and client perspectives.

## System Architecture

### 1. Data Models

#### Exercise Model (`backend/models/Exercise.js`)
```javascript
{
  name: String,           // Exercise name (e.g., "Push Ups")
  description: String,    // Detailed description
  videoUrl: String,       // YouTube or video URL for demonstration
  category: String,       // 'Cardio', 'Strength', 'Flexibility', 'Balance', 'Sports'
  difficulty: String,     // 'Beginner', 'Intermediate', 'Advanced'
  duration: Number,       // Duration in minutes
  equipment: [String],    // Required equipment
  muscleGroups: [String], // Target muscle groups
  instructions: [String], // Step-by-step instructions
  isActive: Boolean,      // Active status
  createdBy: ObjectId     // Admin who created it
}
```

#### Workout Schedule Model (`backend/models/Workout.js`)
```javascript
{
  name: String,           // Workout name (e.g., "Upper Body Strength")
  description: String,    // Workout description
  userId: ObjectId,       // Client assigned to this workout
  day: String,           // Day of week ('Monday', 'Tuesday', etc.)
  dayNumber: Number,     // Custom day number (1-999)
  exercises: [{           // Array of exercise sets
    exercise: ObjectId,   // Reference to Exercise
    exerciseName: String, // Exercise name for quick access
    sets: Number,         // Number of sets
    reps: Number,         // Repetitions per set
    weight: Number,       // Weight in kg
    duration: Number,     // Duration in seconds (for time-based)
    restTime: Number,     // Rest time between sets
    notes: String         // Additional notes
  }],
  totalDuration: Number,  // Total workout duration in minutes
  difficulty: String,     // Workout difficulty level
  workoutType: String,    // 'Strength', 'Cardio', 'HIIT', 'Flexibility', 'Mixed'
  isCompleted: Boolean,   // Completion status
  completedAt: Date,      // Completion timestamp
  isActive: Boolean,      // Active status (for soft delete)
  scheduledDate: Date,    // When workout is scheduled
  createdBy: ObjectId     // Admin who created it
}
```

### 2. API Endpoints

#### Workout Schedule Endpoints (`backend/routes/workoutSchedules.js`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/workout-schedules/user/:userId` | Get all workout schedules for a specific client |
| GET | `/api/admin/workout-schedules/:id` | Get specific workout schedule details |
| GET | `/api/admin/workout-schedules/:id/details` | Get formatted workout details for client app |
| POST | `/api/admin/workout-schedules` | Create new workout schedule |
| PUT | `/api/admin/workout-schedules/:id` | Update workout schedule |
| PATCH | `/api/admin/workout-schedules/:id/complete` | Mark workout as completed |
| DELETE | `/api/admin/workout-schedules/:id` | Soft delete workout schedule |

#### Exercise Endpoints (`backend/routes/exercises.js`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/exercises` | Get all available exercises |
| GET | `/api/admin/exercises/:id` | Get specific exercise details |
| POST | `/api/admin/exercises` | Create new exercise |

## Client App Components

### 1. ExercisePlan Component (`app/(protected)/ExercisePlan.jsx`)

**Purpose**: Main view showing all workout schedules assigned to a client

**Key Features**:
- Displays list of workout schedules for a specific client
- Shows completion status (completed/not completed)
- Swipe-to-delete functionality with smooth animations
- Real-time data loading from API
- Fallback to mock data if API fails

**Data Flow**:
```
1. Component loads with userId parameter
2. Calls ApiService.getUserWorkoutSchedules(userId)
3. Transforms API data to display format
4. Renders swipeable cards with workout information
5. Handles navigation to detailed view
```

**Card Information Displayed**:
- Workout name or day (e.g., "Day 1", "Upper Body Strength")
- Exercise count and estimated duration
- Workout type (Strength, Cardio, etc.)
- Completion status with visual indicators
- Swipe-to-delete functionality

### 2. ProfileSchedules Component (`app/(protected)/ProfileSchedules.jsx`)

**Purpose**: Detailed view of a specific workout schedule showing all exercises

**Key Features**:
- Displays detailed exercise list for a workout
- Shows exercise parameters (sets, reps, weight, rest time)
- Video integration for exercise demonstrations
- Modal popup with exercise details
- Real-time data from workout schedule API

**Data Flow**:
```
1. Receives workoutId parameter
2. Calls ApiService.getWorkoutScheduleDetails(workoutId)
3. Displays workout metadata (name, day, type, duration)
4. Lists all exercises with detailed parameters
5. Provides video links and instructions
```

**Exercise Information Displayed**:
- Exercise name
- Sets × Reps format (e.g., "3 sets - 12 reps")
- Weight and rest time
- Video demonstration link
- Detailed instructions in modal

### 3. AddSchedule Component (`app/(protected)/AddSchedule.jsx`)

**Purpose**: Admin interface for creating new workout schedules

**Key Features**:
- Multi-step workout creation wizard
- Exercise selection from database
- Parameter configuration (sets, reps, weight, rest)
- Workout metadata setup (name, type, day, duration)
- Real-time validation and error handling

**Creation Process**:
```
Step 1: Basic Information
- Workout name
- Day of week
- Workout type selection

Step 2: Exercise Selection
- Browse available exercises
- Add exercises to workout
- Configure sets, reps, weight, rest time

Step 3: Review & Save
- Review all workout details
- Set total duration
- Save to database
```

## API Service Integration

### Frontend API Methods (`app/services/api.js`)

```javascript
// Get workout schedules for a user
async getUserWorkoutSchedules(userId, options = {})

// Get detailed workout schedule
async getWorkoutScheduleDetails(workoutId)

// Create new workout schedule
async createWorkoutSchedule(workoutData)

// Update workout schedule
async updateWorkoutSchedule(workoutId, updateData)

// Delete workout schedule
async deleteWorkoutSchedule(workoutId)

// Mark workout as completed
async completeWorkoutSchedule(workoutId)

// Get available exercises
async getExercises(options = {})
```

## User Experience Flow

### For Clients (Mobile App)

1. **View Assigned Workouts**
   - Open ExercisePlan screen
   - See list of assigned workout schedules
   - View completion status and basic info

2. **Access Workout Details**
   - Tap on any workout card
   - Navigate to ProfileSchedules screen
   - View detailed exercise list

3. **Exercise Execution**
   - See exercise parameters (sets, reps, weight)
   - Watch demonstration videos
   - Follow step-by-step instructions
   - Track completion status

4. **Progress Tracking**
   - Mark workouts as completed
   - View workout history
   - Track performance over time

### For Admins (Admin Panel)

1. **Create Workout Schedule**
   - Navigate to AddSchedule screen
   - Enter workout basic information
   - Select exercises from database
   - Configure exercise parameters
   - Assign to specific client
   - Set schedule date

2. **Manage Existing Workouts**
   - View all client workout schedules
   - Edit workout parameters
   - Update exercise configurations
   - Delete outdated schedules

3. **Monitor Client Progress**
   - View completion status
   - Track client engagement
   - Adjust workouts based on progress

## Technical Implementation Details

### Data Synchronization

1. **Real-time Updates**
   - API calls refresh data automatically
   - Error handling with fallback to cached data
   - Loading states for better UX

2. **Offline Support**
   - Mock data fallback when API unavailable
   - Local state management
   - Graceful error handling

### Performance Optimizations

1. **Lazy Loading**
   - Exercises loaded on demand
   - Pagination for large datasets
   - Efficient data caching

2. **Smooth Animations**
   - Swipe gestures with PanResponder
   - Smooth transitions between screens
   - Visual feedback for user actions

### Error Handling

1. **API Failures**
   - Fallback to mock data
   - User-friendly error messages
   - Retry mechanisms

2. **Validation**
   - Input validation on forms
   - Required field checking
   - Data format validation

## Database Relationships

```
Admin (1) ──creates──> (N) Exercise
Admin (1) ──creates──> (N) Workout Schedule
User (1) ──assigned──> (N) Workout Schedule
Workout Schedule (1) ──contains──> (N) Exercise Sets
Exercise Set (1) ──references──> (1) Exercise
```

## Security Considerations

1. **Authentication**
   - JWT token-based authentication
   - Admin-only workout creation
   - User-specific data access

2. **Data Validation**
   - Server-side input validation
   - MongoDB schema validation
   - XSS protection

3. **Access Control**
   - Users can only view their assigned workouts
   - Admins can manage all workouts
   - Soft delete for data integrity

## Future Enhancements

1. **Advanced Features**
   - Workout templates
   - Progress photos
   - Performance analytics
   - Social sharing

2. **Integration Possibilities**
   - Wearable device sync
   - Nutrition plan integration
   - Calendar synchronization
   - Push notifications

## Troubleshooting Common Issues

1. **Workouts Not Loading**
   - Check API connectivity
   - Verify user authentication
   - Check userId parameter

2. **Exercise Videos Not Playing**
   - Verify video URL format
   - Check internet connection
   - Ensure video platform compatibility

3. **Swipe Gestures Not Working**
   - Check PanResponder configuration
   - Verify gesture thresholds
   - Test on different devices

This comprehensive system provides a complete workout management solution for fitness coaching applications, with robust data handling, smooth user experience, and scalable architecture.
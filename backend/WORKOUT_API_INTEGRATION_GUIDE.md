# Workout API Integration Guide

## 🎯 Overview
This guide explains how to replace mock data in workout-related components with real backend APIs.

## 📋 Available APIs

### 1. **User Workout Schedules API**
**Endpoint:** `GET /api/admin/workout-schedules/user/:userId`
**Frontend Method:** `ApiService.getUserWorkoutSchedules(userId, params)`
**Used by:** ExercisePlan component

**Response Format:**
```json
{
  "success": true,
  "workoutSchedules": [
    {
      "_id": "68e8c961e2d97b8b23095123",
      "name": "Test Upper Body Workout",
      "day": "Monday",
      "workoutType": "Strength",
      "totalDuration": 45,
      "isCompleted": false,
      "exercises": [...],
      "scheduledDate": "2025-10-10T08:52:49.364Z"
    }
  ]
}
```

### 2. **Workout Schedule Details API**
**Endpoint:** `GET /api/admin/workout-schedules/:id`
**Frontend Method:** `ApiService.getWorkoutScheduleById(id)`
**Used by:** General workout schedule details

**Features:**
- Populates exercise data from exercises collection
- Includes detailed exercise information (description, video URL, etc.)
- Enhanced exercise objects with full metadata

### 3. **ProfileSchedules Formatted API** ⭐
**Endpoint:** `GET /api/admin/workout-schedules/:id/details`
**Frontend Method:** `ApiService.getWorkoutScheduleDetails(id)`
**Used by:** ProfileSchedules component

**Response Format (matches ProfileSchedules component expectations):**
```json
{
  "success": true,
  "workoutSchedule": {
    "_id": "68e8c961e2d97b8b23095123",
    "name": "Test Upper Body Workout",
    "day": "Monday",
    "workoutType": "Strength",
    "totalDuration": 45
  },
  "exercises": [
    {
      "name": "Pull ups",
      "detail": "3 sets - 12 reps - 0kg Weight",
      "videoUrl": "https://www.youtube.com/watch?v=IODxDxX7oi4",
      "sets": 3,
      "reps": 12,
      "weight": 0,
      "rest": 60,
      "date": "2025-10-10T08:52:49.364Z",
      "description": "Upper body exercise targeting back muscles"
    }
  ],
  "dayTitle": "Monday",
  "totalExercises": 2
}
```

### 4. **Latest Workout Schedule API**
**Endpoint:** `GET /api/admin/workout-schedules/user/:userId/latest`
**Frontend Method:** `ApiService.getLatestWorkoutSchedule(userId)`
**Used by:** Quick navigation to user's most recent workout

## 🔄 Frontend Integration Instructions

### ExercisePlan Component
**Current:** Uses mock data array
**Replace with:**
```javascript
// Instead of mock schedules array, use:
const response = await ApiService.getUserWorkoutSchedules(userId, { 
  limit: 50,
  sortBy: 'scheduledDate',
  sortOrder: 'asc'
});

if (response.success) {
  setSchedules(response.workoutSchedules.map(schedule => ({
    _id: schedule._id,
    day: schedule.day,
    detail: `${schedule.exercises?.length || 0} exercises - Duration ${schedule.totalDuration || 'N/A'} min`,
    status: schedule.isCompleted ? "Completed" : "Not Completed",
    isCompleted: schedule.isCompleted,
    name: schedule.name,
    workoutType: schedule.workoutType
  })));
}
```

### ProfileSchedules Component
**Current:** Uses hardcoded exercises array
**Replace with:**
```javascript
// Instead of mock exercises array, use:
const [workoutData, setWorkoutData] = useState(null);
const [exercises, setExercises] = useState([]);

useEffect(() => {
  const loadWorkoutDetails = async () => {
    try {
      const workoutId = route.params?.workoutId; // Get from navigation
      const response = await ApiService.getWorkoutScheduleDetails(workoutId);
      
      if (response.success) {
        setWorkoutData(response.workoutSchedule);
        setExercises(response.exercises);
      }
    } catch (error) {
      console.error('Load workout details error:', error);
    }
  };
  
  loadWorkoutDetails();
}, []);

// Use exercises state instead of hardcoded array
// Use workoutData.day for dayTitle instead of "Day 1"
```

## 📊 Data Flow

1. **ExercisePlan Component:**
   - Receives `userId` from ClientProfile navigation
   - Calls `getUserWorkoutSchedules(userId)` to get list of workouts
   - Displays workout schedules with real data
   - Passes `workoutId` when navigating to ProfileSchedules

2. **ProfileSchedules Component:**
   - Receives `workoutId` from ExercisePlan navigation
   - Calls `getWorkoutScheduleDetails(workoutId)` to get detailed workout data
   - Displays exercises with real sets, reps, weight, rest time
   - Shows real video URLs from exercises collection
   - Modal displays real exercise data instead of hardcoded values

## ✅ Features Implemented

### Real Data Integration
- ✅ Exercise names automatically retrieved from exercises collection
- ✅ Sets, reps, weight, rest time from actual workout schedules
- ✅ Video URLs from real exercise database
- ✅ Exercise descriptions and categories
- ✅ Proper workout schedule metadata (day, type, duration)

### Enhanced Exercise Information
- ✅ Exercise descriptions from exercises collection
- ✅ Video URLs for exercise demonstrations
- ✅ Exercise categories and difficulty levels
- ✅ Muscle groups and equipment information
- ✅ Step-by-step instructions

### Navigation Support
- ✅ Proper userId parameter passing
- ✅ WorkoutId parameter for detailed views
- ✅ Latest workout quick access
- ✅ Error handling and fallbacks

## 🧪 Testing

All APIs have been tested and verified:
- ✅ User workout schedules retrieval
- ✅ Detailed workout schedule data
- ✅ ProfileSchedules formatted data
- ✅ Exercise data population from exercises collection
- ✅ Video URLs and exercise metadata
- ✅ Navigation parameter support

## 🚀 Ready for Production

The backend APIs are production-ready and can completely replace all mock data in the workout-related components. The data structure matches the frontend component expectations, ensuring seamless integration without breaking existing functionality.
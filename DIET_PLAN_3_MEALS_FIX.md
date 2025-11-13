# Diet Plan - 3 Meal Slots System

## Overview
The Diet Plan system now works with exactly 3 meal slots: **Meal 1**, **Meal 2**, and **Meal 3**. When you add or edit a meal, it replaces the existing meal in that slot instead of creating a new one.

## How It Works

### 3 Fixed Meal Slots
- **Meal 1** - Muscle Building
- **Meal 2** - Maintenance  
- **Meal 3** - Weight Loss

### Replace, Not Create
When you select a meal slot and save:
- If the meal slot is **empty** → Creates a new meal plan
- If the meal slot **already exists** → Replaces the existing meal plan with your new one

## User Experience Improvements

### 1. Clear Instructions
Step 1 now shows: *"Select one of the 3 meal slots. If a meal already exists, it will be replaced with your new plan."*

### 2. Visual Indicators
In the meal selection modal:
- Existing meals show a **green checkmark** with "Exists" label
- Existing meal rows have a subtle green background tint
- Bottom text reminds: *"Selecting an existing meal will replace it"*

### 3. Edit Mode
- Click the edit icon on any meal in the Diet Plan screen
- The form loads with existing data
- Saving updates the meal in place

## Technical Implementation

### Backend Logic (Already Working)
The `saveDietPlan` function in `AddDiet.jsx`:

```javascript
// Check if this specific meal plan already exists for this user
const existingPlansResponse = await OfflineApiService.getUserDietPlans(validUserId);
let existingPlan = null;

if (existingPlansResponse.success && existingPlansResponse.dietPlans) {
  existingPlan = existingPlansResponse.dietPlans.find(
    plan => plan.name === selectedMealPlan
  );
}

if (existingPlan) {
  // Update existing diet plan (found by name)
  response = await OfflineApiService.updateDietPlan(existingPlan._id, dietPlanData);
  actionMessage = `${selectedMealPlan} updated successfully!`;
} else {
  // Create new diet plan
  response = await OfflineApiService.createDietPlan(dietPlanData);
  actionMessage = `${selectedMealPlan} created successfully!`;
}
```

### Frontend Changes
1. Updated Step 1 description text
2. Enhanced meal selection modal with:
   - Header title "Select Meal Slot"
   - Visual indicators for existing meals
   - Helper text at bottom
3. Loads existing meal plans on component mount

## Files Modified
- `FlexCoach_Admin/app/(protected)/AddDiet.jsx`

## Usage Flow

### Creating a New Meal
1. Navigate to Diet Plan
2. Click the **+** button
3. Select a meal slot (e.g., "Meal 1")
4. Add foods for different meal times
5. Preview and confirm
6. ✅ Meal 1 is created

### Replacing an Existing Meal
1. Navigate to Diet Plan
2. Click the **+** button
3. Select a meal slot that already exists (shows green checkmark)
4. Add new foods
5. Preview and confirm
6. ✅ The existing meal is replaced with your new plan

### Editing an Existing Meal
1. Navigate to Diet Plan
2. Click the **edit icon** on any meal card
3. Modify the foods
4. Save
5. ✅ The meal is updated in place

## Benefits
- ✅ No duplicate meals
- ✅ Clear 3-slot structure
- ✅ Easy to understand which slots are filled
- ✅ Simple replace workflow
- ✅ Consistent meal naming

## Deployment
```bash
scp -P 2222 FlexCoach_Admin/app/\(protected\)/AddDiet.jsx chenura@173.212.220.154:/var/www/FlexCoach2.0/FlexCoach_Admin/app/\(protected\)/
```

## Status
✅ **IMPLEMENTED AND DEPLOYED** - The 3-meal slot system is now active with visual indicators.

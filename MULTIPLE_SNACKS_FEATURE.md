# Multiple Snacks & Pre-Workout Feature - Add Diet

## What Changed

Added the ability for admins to add multiple snack and pre-workout entries when creating or editing diet plans.

## Features

### Dynamic Snack Addition
- Users start with "Snacks 1" by default
- Click the "+ Add Snack" button to add more snacks (Snacks 2, Snacks 3, etc.)
- Each snack can have its own set of foods with quantities

### Dynamic Pre-Workout Addition
- Users start with "Pre-Workout 1" by default
- Click the "+ Add Pre-Workout" button to add more pre-workout meals (Pre-Workout 2, 3, etc.)
- Each pre-workout can have its own set of foods with quantities

### Meal Management
- Remove individual snacks/pre-workouts using the X button (only if they have no foods)
- Must remove all foods from a meal before deleting it
- Meals are numbered sequentially (Snacks 1, 2, 3... / Pre-Workout 1, 2, 3...)

### Edit Mode Support
- When editing existing diet plans, the app automatically loads all snacks and pre-workouts
- Preserves the correct number of each meal type from the saved diet plan

## UI Changes

### Step 2 - Add Foods
- Horizontal scrollable meal type selector now includes:
  - Morning
  - Breakfast
  - Snacks 1 (default)
  - Lunch
  - Pre-Workout 1 (default)
  - Post-Workout
  - Dinner
  - "+ Add Snack" button (green border - adds Snacks 2, 3, etc.)
  - "+ Add Pre-Workout" button (orange border - adds Pre-Workout 2, 3, etc.)

- Each snack/pre-workout (except when only 1 exists) has a small X button to remove it
- The "+ Add Snack" button has a green border (#d5ff5f) and icon
- The "+ Add Pre-Workout" button has an orange border (#ff9f43) and icon

## How to Use

### Adding Snacks
1. Navigate to Step 2 in the Add Diet flow
2. Select "Snacks 1" from the meal types
3. Add foods to Snacks 1
4. Click "+ Add Snack" to create Snacks 2
5. Add foods to Snacks 2
6. Repeat as needed
7. To remove a snack, first delete all its foods, then click the X button

### Adding Pre-Workouts
1. Navigate to Step 2 in the Add Diet flow
2. Select "Pre-Workout 1" from the meal types
3. Add foods to Pre-Workout 1
4. Click "+ Add Pre-Workout" to create Pre-Workout 2
5. Add foods to Pre-Workout 2
6. Repeat as needed
7. To remove a pre-workout, first delete all its foods, then click the X button

## Technical Details

- Snacks are stored with their number in the meal name (e.g., "Snacks 1", "Snacks 2")
- Pre-workouts are stored with their number (e.g., "Pre-Workout 1", "Pre-Workout 2")
- Backend receives them as separate meal entries
- Edit mode reconstructs both snack and pre-workout counts from loaded data
- Haptic feedback on add/remove actions
- Color-coded buttons for easy distinction (green for snacks, orange for pre-workouts)

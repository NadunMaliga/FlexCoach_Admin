# Diet Validation Fix - Multiple Snacks & Pre-Workouts

## Issue
When updating diet plans with multiple snacks (e.g., "Snacks 1", "Snacks 2") or pre-workouts (e.g., "Pre-Workout 1", "Pre-Workout 2"), the backend was returning "Verification failed" error.

## Root Cause
The Diet model had a strict `enum` validation on the `time` field that only accepted:
- Morning
- Breakfast
- Snacks (single)
- Lunch
- Post-Workout (single)
- Dinner
- Evening

This didn't allow numbered variations like "Snacks 1", "Snacks 2", "Pre-Workout 1", etc.

## Solution

### 1. Updated Diet Model (`backend/models/Diet.js`)
Replaced the strict `enum` validation with a flexible regex-based validator that accepts:
- Base meal types: Morning, Breakfast, Lunch, Post-Workout, Dinner, Evening
- Numbered snacks: Snacks, Snacks 1, Snacks 2, Snacks 3, etc.
- Numbered pre-workouts: Pre-Workout, Pre-Workout 1, Pre-Workout 2, etc.

### 2. Updated POST Route Validation (`backend/routes/dietPlans.js`)
Updated the express-validator rules to use custom validation with the same regex patterns, allowing dynamic meal names.

## Validation Patterns
The following patterns are now accepted:
- `^Morning$` - Morning
- `^Breakfast$` - Breakfast
- `^Snacks( \d+)?$` - Snacks, Snacks 1, Snacks 2, etc.
- `^Lunch$` - Lunch
- `^Pre-Workout( \d+)?$` - Pre-Workout, Pre-Workout 1, Pre-Workout 2, etc.
- `^Post-Workout$` - Post-Workout
- `^Dinner$` - Dinner
- `^Evening$` - Evening

## Testing
After this fix, you should be able to:
1. Create diet plans with multiple snacks and pre-workouts
2. Update existing diet plans with numbered meal variations
3. Edit diet plans and preserve all numbered meals

## Files Changed
- `FlexCoach_Admin/backend/models/Diet.js` - Updated meal time validation
- `FlexCoach_Admin/backend/routes/dietPlans.js` - Updated POST route validation

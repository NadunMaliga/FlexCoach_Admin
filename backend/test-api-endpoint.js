const express = require('express');
const mongoose = require('mongoose');
const Diet = require('./models/Diet');
const Food = require('./models/Food');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/fitnessapp');

async function testAPIEndpoint() {
    try {
        console.log('Testing API endpoint logic...');
        
        const testUserId = '68e8fd08e8d1859ebd9edd05';
        console.log('Testing with userId:', testUserId);
        
        // Simulate the API endpoint logic
        const query = { userId: testUserId, isActive: true };
        
        const dietPlans = await Diet.find(query)
            .sort({ createdAt: -1 });
        
        console.log('Query result:', {
            success: true,
            dietPlans: dietPlans,
            count: dietPlans.length
        });
        
        // Test the exact format the frontend expects
        if (dietPlans.length > 0) {
            console.log('\nTransformed data preview:');
            const transformedPlans = [];
            
            dietPlans.forEach(dietPlan => {
                dietPlan.meals.forEach(meal => {
                    const totalCalories = meal.totalCalories || 
                        meal.foods.reduce((sum, food) => sum + (food.calories || 0), 0);
                    
                    const foodNames = meal.foods.map(food => food.foodName).join(', ');
                    const detail = foodNames ? `${foodNames} - ${totalCalories} calories` : `${totalCalories} calories`;
                    
                    transformedPlans.push({
                        _id: `${dietPlan._id}_${meal._id}`,
                        name: meal.name,
                        detail: detail,
                        time: meal.time,
                        dietPlanId: dietPlan._id,
                        dietPlanName: dietPlan.name,
                        dietType: dietPlan.dietType,
                        mealData: meal
                    });
                });
            });
            
            console.log('Transformed plans:', transformedPlans.length);
            transformedPlans.forEach((plan, index) => {
                console.log(`${index + 1}. ${plan.name} - ${plan.detail} (${plan.time})`);
            });
        }
        
    } catch (error) {
        console.error('Error testing API endpoint:', error);
    } finally {
        mongoose.connection.close();
    }
}

testAPIEndpoint();
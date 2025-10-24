const express = require('express');
const router = express.Router();
const Diet = require('../models/Diet');
const mongoose = require('mongoose');

// Get diet history for a specific user with date grouping
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const {
            startDate,
            endDate,
            limit = 50,
            page = 1,
            groupBy = 'date' // 'date', 'week', 'month'
        } = req.query;

        console.log('Get diet history - userId:', userId);
        console.log('Get diet history - params:', { startDate, endDate, limit, page, groupBy });

        // Convert userId to ObjectId if it's a valid ObjectId string
        let userIdQuery = userId;
        if (mongoose.Types.ObjectId.isValid(userId)) {
            userIdQuery = new mongoose.Types.ObjectId(userId);
        }

        // Build date filter
        const dateFilter = {};
        if (startDate) {
            dateFilter.$gte = new Date(startDate);
        }
        if (endDate) {
            dateFilter.$lte = new Date(endDate);
        }

        // Build query
        const query = {
            userId: userIdQuery,
            isActive: true
        };

        if (Object.keys(dateFilter).length > 0) {
            query.createdAt = dateFilter;
        }

        console.log('History query:', query);

        // Get diet plans sorted by creation date (newest first)
        const dietPlans = await Diet.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        console.log('Found diet plans for history:', dietPlans.length);

        // Group diet plans by date/week/month
        const groupedHistory = {};

        dietPlans.forEach(dietPlan => {
            let groupKey;
            const createdDate = new Date(dietPlan.createdAt);

            switch (groupBy) {
                case 'week':
                    // Get start of week (Monday)
                    const startOfWeek = new Date(createdDate);
                    startOfWeek.setDate(createdDate.getDate() - createdDate.getDay() + 1);
                    groupKey = startOfWeek.toISOString().split('T')[0];
                    break;
                case 'month':
                    // Get year-month
                    groupKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;
                    break;
                case 'date':
                default:
                    // Group by date (default)
                    groupKey = createdDate.toISOString().split('T')[0];
                    break;
            }

            if (!groupedHistory[groupKey]) {
                groupedHistory[groupKey] = {
                    date: groupKey,
                    groupType: groupBy,
                    meals: [],
                    totalPlans: 0,
                    totalCalories: 0
                };
            }

            // Transform meal data for frontend
            const mealDetails = {};
            let planTotalCalories = 0;

            dietPlan.meals.forEach(meal => {
                const foodList = meal.foods.map(food =>
                    `${food.foodName} ${food.quantity}${food.unit}`
                ).join('\n');

                mealDetails[meal.time] = foodList || meal.instructions || `${meal.name} - ${meal.totalCalories} calories`;
                planTotalCalories += meal.totalCalories || 0;
            });

            groupedHistory[groupKey].meals.push({
                id: dietPlan._id,
                name: dietPlan.name,
                description: dietPlan.description,
                dietType: dietPlan.dietType,
                details: mealDetails,
                totalCalories: dietPlan.totalDailyCalories || planTotalCalories,
                createdAt: dietPlan.createdAt,
                updatedAt: dietPlan.updatedAt
            });

            groupedHistory[groupKey].totalPlans += 1;
            groupedHistory[groupKey].totalCalories += dietPlan.totalDailyCalories || planTotalCalories;
        });

        // Convert to array and sort by date (newest first)
        const historyArray = Object.values(groupedHistory).sort((a, b) =>
            new Date(b.date) - new Date(a.date)
        );

        // Get total count for pagination
        const totalCount = await Diet.countDocuments(query);

        res.json({
            success: true,
            history: historyArray,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalItems: totalCount,
                itemsPerPage: parseInt(limit)
            },
            summary: {
                totalDays: historyArray.length,
                totalPlans: dietPlans.length,
                dateRange: {
                    from: dietPlans.length > 0 ? dietPlans[dietPlans.length - 1].createdAt : null,
                    to: dietPlans.length > 0 ? dietPlans[0].createdAt : null
                }
            }
        });

    } catch (error) {
        console.error('Get diet history error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Get diet history statistics for a user
router.get('/stats/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { period = '30' } = req.query; // days

        console.log('Get diet history stats - userId:', userId, 'period:', period);

        // Convert userId to ObjectId if it's a valid ObjectId string
        let userIdQuery = userId;
        if (mongoose.Types.ObjectId.isValid(userId)) {
            userIdQuery = new mongoose.Types.ObjectId(userId);
        }

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - parseInt(period));

        const query = {
            userId: userIdQuery,
            isActive: true,
            createdAt: {
                $gte: startDate,
                $lte: endDate
            }
        };

        // Get diet plans in the period
        const dietPlans = await Diet.find(query);

        // Calculate statistics
        const stats = {
            totalPlans: dietPlans.length,
            totalDays: new Set(dietPlans.map(plan =>
                plan.createdAt.toISOString().split('T')[0]
            )).size,
            averageCaloriesPerDay: 0,
            dietTypeBreakdown: {},
            mostActiveDay: null,
            totalCalories: 0
        };

        // Calculate diet type breakdown and total calories
        dietPlans.forEach(plan => {
            const dietType = plan.dietType || 'Unknown';
            stats.dietTypeBreakdown[dietType] = (stats.dietTypeBreakdown[dietType] || 0) + 1;
            stats.totalCalories += plan.totalDailyCalories || 0;
        });

        // Calculate average calories per day
        if (stats.totalDays > 0) {
            stats.averageCaloriesPerDay = Math.round(stats.totalCalories / stats.totalDays);
        }

        // Find most active day (day with most diet plans)
        const dayCount = {};
        dietPlans.forEach(plan => {
            const dayName = plan.createdAt.toLocaleDateString('en-US', { weekday: 'long' });
            dayCount[dayName] = (dayCount[dayName] || 0) + 1;
        });

        if (Object.keys(dayCount).length > 0) {
            stats.mostActiveDay = Object.keys(dayCount).reduce((a, b) =>
                dayCount[a] > dayCount[b] ? a : b
            );
        }

        res.json({
            success: true,
            stats,
            period: {
                days: parseInt(period),
                startDate,
                endDate
            }
        });

    } catch (error) {
        console.error('Get diet history stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Delete a diet plan from history (soft delete)
router.delete('/:planId', async (req, res) => {
    try {
        const { planId } = req.params;
        const { userId } = req.query;

        console.log('Delete from history - planId:', planId, 'userId:', userId);

        // Verify the diet plan belongs to the user
        const query = { _id: planId };
        if (userId) {
            let userIdQuery = userId;
            if (mongoose.Types.ObjectId.isValid(userId)) {
                userIdQuery = new mongoose.Types.ObjectId(userId);
            }
            query.userId = userIdQuery;
        }

        const dietPlan = await Diet.findOneAndUpdate(
            query,
            { isActive: false },
            { new: true }
        );

        if (!dietPlan) {
            return res.status(404).json({
                success: false,
                error: 'Diet plan not found'
            });
        }

        res.json({
            success: true,
            message: 'Diet plan removed from history',
            dietPlan: {
                id: dietPlan._id,
                name: dietPlan.name,
                isActive: dietPlan.isActive
            }
        });

    } catch (error) {
        console.error('Delete from history error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

module.exports = router;
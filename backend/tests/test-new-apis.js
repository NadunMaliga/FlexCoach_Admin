const mongoose = require('mongoose');
const config = require('./config');

// Import models
const Exercise = require('./models/Exercise');
const Food = require('./models/Food');
const Diet = require('./models/Diet');
const Workout = require('./models/Workout');
const Chat = require('./models/Chat');
const Measurement = require('./models/Measurement');
const Admin = require('./models/Admin');
const User = require('./models/User');

async function testNewAPIs() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find or create an admin for testing
    let admin = await Admin.findOne({ email: 'admin@flexcoach.com' });
    if (!admin) {
      console.log('❌ No admin found. Please create an admin first.');
      return;
    }

    // Find a user for testing
    let user = await User.findOne();
    if (!user) {
      console.log('❌ No users found. Please create a user first.');
      return;
    }

    console.log(`📋 Testing with Admin: ${admin.email}`);
    console.log(`👤 Testing with User: ${user.firstName} ${user.lastName}`);

    // Test Exercise creation
    console.log('\n🏋️ Testing Exercise model...');
    const exercise = new Exercise({
      name: 'Push Ups',
      description: 'Basic push up exercise for chest and arms',
      videoUrl: 'https://youtube.com/watch?v=example',
      category: 'Strength',
      difficulty: 'Beginner',
      duration: 15,
      equipment: ['None'],
      muscleGroups: ['Chest', 'Arms'],
      instructions: ['Start in plank position', 'Lower body to ground', 'Push back up'],
      createdBy: admin._id
    });
    await exercise.save();
    console.log('✅ Exercise created successfully');

    // Test Food creation
    console.log('\n🍎 Testing Food model...');
    const food = new Food({
      name: 'Chicken Breast',
      category: 'Protein',
      nutritionPer100g: {
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        fiber: 0
      },
      servingSize: {
        amount: 100,
        unit: 'g'
      },
      allergens: [],
      dietaryRestrictions: ['High-Protein'],
      createdBy: admin._id
    });
    await food.save();
    console.log('✅ Food created successfully');

    // Test Diet Plan creation
    console.log('\n🥗 Testing Diet Plan model...');
    const dietPlan = new Diet({
      name: 'Weight Loss Plan',
      description: 'Basic weight loss diet plan',
      userId: user._id,
      meals: [
        {
          name: 'Breakfast',
          time: 'Breakfast',
          foods: [
            {
              food: food._id,
              foodName: food.name,
              quantity: 150,
              unit: 'g'
            }
          ],
          instructions: 'Grilled chicken breast with vegetables',
          totalCalories: 250
        }
      ],
      totalDailyCalories: 1500,
      dietType: 'Weight Loss',
      createdBy: admin._id
    });
    await dietPlan.save();
    console.log('✅ Diet Plan created successfully');

    // Test Workout Schedule creation
    console.log('\n📅 Testing Workout Schedule model...');
    const workoutSchedule = new Workout({
      name: 'Monday Workout',
      description: 'Upper body strength training',
      userId: user._id,
      day: 'Monday',
      exercises: [
        {
          exercise: exercise._id,
          exerciseName: exercise.name,
          sets: 3,
          reps: 15,
          restTime: 60,
          notes: 'Focus on form'
        }
      ],
      totalDuration: 45,
      difficulty: 'Beginner',
      workoutType: 'Strength',
      scheduledDate: new Date(),
      createdBy: admin._id
    });
    await workoutSchedule.save();
    console.log('✅ Workout Schedule created successfully');

    // Test Chat creation
    console.log('\n💬 Testing Chat model...');
    const chat = new Chat({
      userId: user._id,
      adminId: admin._id,
      messages: [
        {
          sender: 'admin',
          senderId: admin._id,
          text: 'Hello! How can I help you today?',
          messageType: 'text',
          isRead: false
        }
      ],
      lastMessage: {
        text: 'Hello! How can I help you today?',
        timestamp: new Date(),
        sender: 'admin'
      },
      unreadCount: {
        admin: 0,
        user: 1
      }
    });
    await chat.save();
    console.log('✅ Chat created successfully');

    // Test Body Measurement creation
    console.log('\n📏 Testing Body Measurement model...');
    const bodyMeasurement = new Measurement({
      userId: user._id,
      measurementType: 'Weight',
      value: 75,
      unit: 'kg',
      frequency: 'Daily',
      notes: 'Morning weight after workout',
      recordedBy: 'admin',
      recordedById: admin._id
    });
    await bodyMeasurement.save();
    console.log('✅ Body Measurement created successfully');

    console.log('\n🎉 All models tested successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Exercises: ${await Exercise.countDocuments()}`);
    console.log(`   Foods: ${await Food.countDocuments()}`);
    console.log(`   Diet Plans: ${await Diet.countDocuments()}`);
    console.log(`   Workout Schedules: ${await Workout.countDocuments()}`);
    console.log(`   Chats: ${await Chat.countDocuments()}`);
    console.log(`   Body Measurements: ${await Measurement.countDocuments()}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testNewAPIs();
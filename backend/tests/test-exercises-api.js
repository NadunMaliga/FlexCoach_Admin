const mongoose = require('mongoose');
const config = require('./config');

// Test the exercises API and add sample data
async function testExercisesAPI() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Connect to flexcoach database
    const flexcoachDb = mongoose.connection.useDb('flexcoach');
    const ExercisesCollection = flexcoachDb.collection('exercises');

    console.log('\n📊 Checking existing exercises...');
    const existingCount = await ExercisesCollection.countDocuments();
    console.log(`Found ${existingCount} existing exercises`);

    // Sample exercises to add if none exist
    const sampleExercises = [
      {
        name: "Push Ups",
        description: "Classic upper body exercise targeting chest, shoulders, and triceps",
        videoUrl: "https://www.youtube.com/watch?v=IODxDxX7oi4",
        category: "Strength",
        difficulty: "Beginner",
        duration: 15,
        equipment: ["None"],
        muscleGroups: ["Chest", "Arms", "Core"],
        instructions: [
          "Start in a plank position with hands shoulder-width apart",
          "Lower your body until chest nearly touches the floor",
          "Push back up to starting position",
          "Keep your core tight throughout the movement"
        ],
        isActive: true,
        createdBy: "admin",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "Squats",
        description: "Fundamental lower body exercise for building leg and glute strength",
        videoUrl: "https://www.youtube.com/watch?v=aclHkVaku9U",
        category: "Strength",
        difficulty: "Beginner",
        duration: 20,
        equipment: ["None"],
        muscleGroups: ["Legs", "Core"],
        instructions: [
          "Stand with feet shoulder-width apart",
          "Lower your body as if sitting back into a chair",
          "Keep your chest up and knees behind toes",
          "Return to standing position"
        ],
        isActive: true,
        createdBy: "admin",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "Bench Press",
        description: "Classic chest exercise using a barbell or dumbbells",
        videoUrl: "https://www.youtube.com/watch?v=rT7DgCr-3pg",
        category: "Strength",
        difficulty: "Intermediate",
        duration: 25,
        equipment: ["Barbell", "Bench"],
        muscleGroups: ["Chest", "Arms", "Shoulders"],
        instructions: [
          "Lie flat on bench with feet on floor",
          "Grip barbell slightly wider than shoulder-width",
          "Lower bar to chest with control",
          "Press bar back to starting position"
        ],
        isActive: true,
        createdBy: "admin",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "Deadlift",
        description: "Compound exercise targeting multiple muscle groups",
        videoUrl: "https://www.youtube.com/watch?v=ytGaGIn3SjE",
        category: "Strength",
        difficulty: "Advanced",
        duration: 30,
        equipment: ["Barbell"],
        muscleGroups: ["Back", "Legs", "Core"],
        instructions: [
          "Stand with feet hip-width apart, bar over mid-foot",
          "Bend at hips and knees to grip the bar",
          "Keep chest up and back straight",
          "Drive through heels to lift the bar"
        ],
        isActive: true,
        createdBy: "admin",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "Bicep Curls",
        description: "Isolation exercise for building bicep strength and size",
        videoUrl: "https://www.youtube.com/watch?v=ykJmrZ5v0Oo",
        category: "Strength",
        difficulty: "Beginner",
        duration: 15,
        equipment: ["Dumbbells"],
        muscleGroups: ["Arms"],
        instructions: [
          "Stand with dumbbells at your sides",
          "Keep elbows close to your body",
          "Curl weights up to shoulder level",
          "Lower with control to starting position"
        ],
        isActive: true,
        createdBy: "admin",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "Plank",
        description: "Core strengthening exercise that builds stability",
        videoUrl: "https://www.youtube.com/watch?v=ASdvN_XEl_c",
        category: "Strength",
        difficulty: "Beginner",
        duration: 10,
        equipment: ["None"],
        muscleGroups: ["Core", "Shoulders"],
        instructions: [
          "Start in push-up position",
          "Lower to forearms, keeping body straight",
          "Hold position while breathing normally",
          "Keep core tight and avoid sagging hips"
        ],
        isActive: true,
        createdBy: "admin",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "Running",
        description: "Cardiovascular exercise for endurance and heart health",
        videoUrl: "https://www.youtube.com/watch?v=kVnyY17VS9Y",
        category: "Cardio",
        difficulty: "Beginner",
        duration: 30,
        equipment: ["None"],
        muscleGroups: ["Legs", "Core"],
        instructions: [
          "Start with a light warm-up walk",
          "Maintain a steady, comfortable pace",
          "Land on the middle of your foot",
          "Keep your posture upright and relaxed"
        ],
        isActive: true,
        createdBy: "admin",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "Yoga Flow",
        description: "Flexibility and balance exercise combining multiple poses",
        videoUrl: "https://www.youtube.com/watch?v=v7AYKMP6rOE",
        category: "Flexibility",
        difficulty: "Beginner",
        duration: 45,
        equipment: ["Yoga Mat"],
        muscleGroups: ["Full Body"],
        instructions: [
          "Start in mountain pose",
          "Flow through sun salutation sequence",
          "Hold each pose for 5-8 breaths",
          "Focus on smooth transitions"
        ],
        isActive: true,
        createdBy: "admin",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    if (existingCount === 0) {
      console.log('\n➕ Adding sample exercises...');
      const result = await ExercisesCollection.insertMany(sampleExercises);
      console.log(`✅ Added ${result.insertedCount} sample exercises`);
    } else {
      console.log('✅ Exercises already exist in database');
    }

    // Test fetching exercises
    console.log('\n🔍 Testing exercise retrieval...');
    const exercises = await ExercisesCollection.find({ isActive: { $ne: false } })
      .limit(10)
      .toArray();
    
    console.log(`✅ Retrieved ${exercises.length} exercises:`);
    exercises.forEach((exercise, index) => {
      console.log(`   ${index + 1}. ${exercise.name} (${exercise.category}, ${exercise.difficulty})`);
    });

    console.log('\n🎯 Exercise API is ready!');
    console.log('📱 Frontend can now fetch exercises from: GET /api/admin/exercises');

  } catch (error) {
    console.error('❌ Error testing exercises API:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the test
testExercisesAPI();
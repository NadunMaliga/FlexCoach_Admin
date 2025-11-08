const mongoose = require('mongoose');
const Food = require('./models/Food');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/flexcoach', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function checkFoodsCollection() {
  console.log('🧪 Checking Foods Collection for Default Quantities...\n');

  try {
    // Get some sample foods to see their structure
    const foods = await Food.find({}).limit(10);
    
    console.log(`Found ${foods.length} foods in collection:`);
    
    foods.forEach(food => {
      console.log(`\n📋 ${food.name}:`);
      console.log(`  ID: ${food._id}`);
      console.log(`  Category: ${food.category || 'N/A'}`);
      console.log(`  Quantity: ${food.quantity || 'N/A'}`);
      console.log(`  Unit: ${food.unit || 'N/A'}`);
      console.log(`  Calories: ${food.calories || 'N/A'}`);
      console.log(`  Protein: ${food.protein || 'N/A'}`);
      console.log(`  Carbs: ${food.carbs || 'N/A'}`);
      console.log(`  Fat: ${food.fat || 'N/A'}`);
    });

    // Check if any foods have default quantities that might be interfering
    const foodsWithQuantities = await Food.find({ quantity: { $exists: true, $ne: null } });
    
    if (foodsWithQuantities.length > 0) {
      console.log(`\n⚠️  Found ${foodsWithQuantities.length} foods with default quantities:`);
      foodsWithQuantities.forEach(food => {
        console.log(`  - ${food.name}: ${food.quantity} ${food.unit || 'units'}`);
      });
    } else {
      console.log('\n✅ No foods have default quantities - this is good!');
    }

  } catch (error) {
    console.error('❌ Error checking foods collection:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkFoodsCollection();
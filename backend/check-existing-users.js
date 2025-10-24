const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/fitnessapp');

async function checkUsers() {
    try {
        console.log('Checking existing users...');
        
        const users = await User.find({}).select('_id firstName lastName email').limit(10);
        
        if (users.length > 0) {
            console.log('Found existing users:');
            users.forEach(user => {
                console.log(`- ${user.firstName} ${user.lastName} (${user.email}) - ID: ${user._id}`);
            });
        } else {
            console.log('No users found in database');
        }
        
    } catch (error) {
        console.error('Error checking users:', error);
    } finally {
        mongoose.connection.close();
    }
}

checkUsers();
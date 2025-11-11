#!/usr/bin/env node
/**
 * Migration Script: Replace ApiService with OfflineApiService
 * Automatically updates API calls to use offline-aware service
 */
const fs = require('fs');
const path = require('path');

const APP_DIR = path.join(__dirname, '../app');

// Files to migrate
const filesToMigrate = [
  'app/(protected)/Dashboard.tsx',
  'app/(protected)/Clients.jsx',
  'app/(protected)/ExercisePlan.jsx',
  'app/(protected)/DietPlan.jsx',
  'app/(protected)/ClientProfile.jsx',
  'app/(protected)/Exercise.tsx',
  'app/(protected)/Foods.tsx',
  'app/(protected)/AddSchedule.jsx',
  'app/(protected)/AddDiet.jsx',
  'app/(protected)/Chat.jsx'
];

function migrateFile(filePath) {
  console.log(`📝 Migrating: ${filePath}`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;

    // Replace ApiService import with OfflineApiService
    if (content.includes("import ApiService from '../services/api'") || 
        content.includes("import ApiService from './services/api'")) {
      content = content.replace(
        /import ApiService from ['"]\.\.?\/services\/api['"];?/g,
        "import OfflineApiService from '../services/OfflineApiService';"
      );
      hasChanges = true;
      console.log('  ✅ Updated import statement');
    }

    // Replace ApiService. with OfflineApiService.
    const apiCallPattern = /ApiService\./g;
    if (apiCallPattern.test(content)) {
      content = content.replace(apiCallPattern, 'OfflineApiService.');
      hasChanges = true;
      console.log('  ✅ Updated API calls');
    }

    // Write back if changes were made
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  ✅ File updated successfully`);
    } else {
      console.log(`  ⏭️  No changes needed`);
    }
  } catch (error) {
    console.error(`  ❌ Error migrating ${filePath}:`, error.message);
  }
}

// Main execution
console.log('🚀 Starting API migration to OfflineApiService...\n');

// Migrate each file
filesToMigrate.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  if (fs.existsSync(fullPath)) {
    migrateFile(fullPath);
  } else {
    console.log(`⚠️  File not found: ${file}`);
  }
});

console.log('\n✅ Migration completed!');
console.log('\n📋 Next steps:');
console.log('1. Install dependencies: npx expo install @react-native-async-storage/async-storage @react-native-community/netinfo');
console.log('2. Test offline functionality');
console.log('3. Review optimistic update implementations');

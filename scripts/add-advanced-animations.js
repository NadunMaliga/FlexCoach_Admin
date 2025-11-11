#!/usr/bin/env node
/**
 * Script to add advanced animations to FlexCoach Admin screens
 * Adds fade-in, slide, bounce, and gesture animations
 */

const fs = require('fs');
const path = require('path');

const updates = [
  {
    file: 'app/(protected)/Dashboard.tsx',
    description: 'Add fade-in and stagger animations to Dashboard',
    changes: [
      {
        find: `import { useRouter } from "expo-router";`,
        replace: `import { useRouter } from "expo-router";
import { fadeIn, staggerAnimation } from '../utils/animations';`
      },
      {
        find: `  const [fadeAnim] = useState(new Animated.Value(1));`,
        replace: `  const [fadeAnim] = useState(new Animated.Value(0));
  const [cardAnims] = useState([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]);`
      },
      {
        find: `    loadDashboardData();`,
        replace: `    loadDashboardData();
    
    // Animate on mount
    fadeIn(fadeAnim, 300).start();
    staggerAnimation(cardAnims, 300, 100).start();`
      }
    ]
  },
  {
    file: 'app/(protected)/Clients.jsx',
    description: 'Add list stagger animation to Clients',
    changes: [
      {
        find: `import { useRouter } from "expo-router";`,
        replace: `import { useRouter } from "expo-router";
import { fadeIn, bounce } from '../utils/animations';`
      }
    ]
  },
  {
    file: 'app/(protected)/ClientProfile.jsx',
    description: 'Add slide-in animation to ClientProfile',
    changes: [
      {
        find: `import { useLocalSearchParams, useRouter } from "expo-router";`,
        replace: `import { useLocalSearchParams, useRouter } from "expo-router";
import { slideInRight, fadeIn } from '../utils/animations';`
      }
    ]
  },
  {
    file: 'app/(protected)/Chat.jsx',
    description: 'Add message animations to Chat',
    changes: [
      {
        find: `import { Ionicons } from "@expo/vector-icons";`,
        replace: `import { Ionicons } from "@expo/vector-icons";
import { fadeIn, slideInBottom } from '../utils/animations';`
      }
    ]
  }
];

console.log('🎨 Adding advanced animations to FlexCoach Admin...\n');

updates.forEach(update => {
  const filePath = path.join(__dirname, '..', update.file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${update.file}`);
    return;
  }

  console.log(`📝 ${update.description}`);
  console.log(`   File: ${update.file}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  update.changes.forEach(change => {
    if (content.includes(change.find)) {
      content = content.replace(change.find, change.replace);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`   ✅ Animations added\n`);
  } else {
    console.log(`   ⏭️  Already has animations or pattern not found\n`);
  }
});

console.log('✅ Animation integration complete!\n');
console.log('📚 Check ADVANCED_ANIMATIONS_GUIDE.md for more examples');

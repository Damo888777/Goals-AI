#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filePath = path.join(
  __dirname,
  '../node_modules/expo-dev-menu/ios/DevMenuViewController.swift'
);

try {
  if (!fs.existsSync(filePath)) {
    console.log('expo-dev-menu file not found, skipping patch');
    process.exit(0);
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Replace TARGET_IPHONE_SIMULATOR with proper Swift check
  const oldCode = 'let isSimulator = TARGET_IPHONE_SIMULATOR > 0';
  const newCode = `#if targetEnvironment(simulator)
    let isSimulator = true
    #else
    let isSimulator = false
    #endif`;

  if (content.includes(oldCode)) {
    content = content.replace(oldCode, newCode);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Patched expo-dev-menu for Xcode 16 compatibility');
  } else if (content.includes('targetEnvironment(simulator)')) {
    console.log('✅ expo-dev-menu already patched');
  } else {
    console.log('⚠️  expo-dev-menu code structure changed, patch may need update');
  }
} catch (error) {
  console.error('Error patching expo-dev-menu:', error.message);
  process.exit(0); // Don't fail the build
}

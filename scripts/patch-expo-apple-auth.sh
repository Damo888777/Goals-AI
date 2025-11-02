#!/bin/bash

# Patch expo-apple-authentication for iOS 18+ compatibility
FILE="node_modules/expo-apple-authentication/ios/AppleAuthenticationExceptions.swift"

if [ -f "$FILE" ]; then
  echo "Patching expo-apple-authentication for iOS 18+ compatibility..."
  
  # Check if already patched correctly
  if grep -q "@unknown default:" "$FILE" && ! grep -A 1 "case \.notInteractive:" "$FILE" | grep -q "@unknown default:"; then
    echo "✅ Already patched"
    exit 0
  fi
  
  # Replace the switch statement with a patched version
  perl -i -pe 's/(case \.notInteractive:\s+return RequestNotInteractiveException\(\))/$1\n  @unknown default:\n    return RequestUnknownException()/g' "$FILE"
  
  echo "✅ Successfully patched expo-apple-authentication"
else
  echo "⚠️  File not found: $FILE"
fi

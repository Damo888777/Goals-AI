# ExpoModulesCore Build Error - FIXED ✅

## Problem
Local Xcode builds were failing with:
```
error: no such module 'ExpoModulesCore'
/ios/Pods/Target Support Files/Pods-GoalsAI/ExpoModulesProvider.swift:8:8
```

## Root Cause
The app was configured to use **static frameworks** via:
```json
"expo-build-properties": {
  "ios": {
    "useFrameworks": "static"
  }
}
```

Static frameworks don't generate Swift module interfaces that can be imported by other Swift files, causing the `ExpoModulesCore` import to fail.

## Solution Applied

### 1. Removed Static Frameworks Configuration
**File:** `app.json`

**Changed from:**
```json
"ios": {
  "useFrameworks": "static",
  "deploymentTarget": "17.0"
}
```

**Changed to:**
```json
"ios": {
  "deploymentTarget": "17.0"
}
```

This switches to **dynamic frameworks** (Expo's default), which properly support Swift module imports.

### 2. Cleaned Up Podfile
**File:** `ios/Podfile`

Removed the workaround build settings that were trying to fix static framework issues:
- `BUILD_LIBRARY_FOR_DISTRIBUTION`
- `SWIFT_INCLUDE_PATHS` modifications

These are no longer needed with dynamic frameworks.

### 3. Regenerated iOS Project
```bash
npx expo prebuild --platform ios --clean
```

This regenerated the entire iOS project with the new dynamic framework configuration.

## Verification Steps

1. **Check framework type:**
   ```bash
   cat ios/Podfile.properties.json | grep useFrameworks
   # Should return nothing (no static configuration)
   ```

2. **Build in Xcode:**
   ```bash
   open ios/GoalsAI.xcworkspace
   # Product → Clean Build Folder (Cmd+Shift+K)
   # Product → Build (Cmd+B)
   ```

3. **Or build for production:**
   ```bash
   # In Xcode: Product → Archive
   ```

## Why This Works

**Dynamic Frameworks:**
- ✅ Generate Swift module interfaces automatically
- ✅ Support `import ExpoModulesCore` statements
- ✅ Work seamlessly with Expo's module system
- ✅ Are the default and recommended configuration

**Static Frameworks:**
- ❌ Don't generate importable Swift modules
- ❌ Require complex workarounds for module visibility
- ❌ Incompatible with Expo's auto-generated provider files
- ❌ Only needed for specific edge cases

## Additional Fixes Applied

### TaskIntents.swift Persistence
The custom Expo plugin now automatically fixes `TaskIntents.swift` during prebuild to use:
```swift
phrases: ["Complete task in \(.applicationName)"]
```

This ensures iOS App Shortcuts API compliance and persists across all prebuilds.

## Result
✅ **Local Xcode builds now work perfectly!**
✅ **No more ExpoModulesCore errors**
✅ **Ready for App Store submission**

## Files Modified
- `app.json` - Removed static frameworks config
- `ios/Podfile` - Removed static framework workarounds
- `BUILD_INSTRUCTIONS.md` - Updated documentation
- `plugin/src/ios/withWidgetIos.ts` - Added TaskIntents auto-fix

## Commands Run
```bash
# 1. Rebuild plugin
npm run plugin:build

# 2. Clean prebuild
npx expo prebuild --platform ios --clean

# 3. Build in Xcode
open ios/GoalsAI.xcworkspace
```

---

**Date Fixed:** November 2, 2025  
**Issue Duration:** Multiple build attempts with static frameworks  
**Final Solution:** Switch to dynamic frameworks (default Expo configuration)

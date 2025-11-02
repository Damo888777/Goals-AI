# Goals AI - Production Build Instructions

## ✅ All Issues Fixed

### 1. OneSignal Extension Removed
- ✅ Removed `onesignal-expo-plugin` from app.json
- ✅ Updated custom plugin to not create OneSignal extension
- ✅ Cleaned Podfile (no OneSignal extension target)
- ✅ OneSignal SDK still works for basic push notifications

### 2. ExpoAppleAuthentication iOS 18+ Fixed
- ✅ Created patch script: `scripts/patch-expo-apple-auth.py`
- ✅ Automatically runs on `npm install` (postinstall hook)
- ✅ Adds `@unknown default` case to handle new iOS error codes

### 3. Widget App Shortcut Fixed
- ✅ Updated `TaskIntents.swift` to use `\(.applicationName)` placeholder
- ✅ Complies with iOS App Shortcuts API requirements

## 🚀 How to Build for Production

### Option 1: Build in Xcode (Recommended)
```bash
# 1. Open workspace in Xcode
open ios/GoalsAI.xcworkspace

# 2. In Xcode:
#    - Select "Any iOS Device" or your connected device
#    - Select "Product" > "Archive"
#    - Wait for build to complete
#    - Upload to App Store Connect
```

**Why Xcode?** The command-line build has a race condition where `ExpoModulesCore` isn't built before files that depend on it. Xcode's build system handles dependencies correctly.

### Option 2: EAS Build (Production)
```bash
# Build for App Store
eas build --platform ios --profile production

# Or build for TestFlight
eas build --platform ios --profile preview
```

## ✅ Fixed: ExpoModulesCore Issue

**Previous Issue:** `error: no such module 'ExpoModulesCore'` when building locally in Xcode.

**Root Cause:** Using `"useFrameworks": "static"` in `app.json` caused Swift module import issues with Expo's module system.

**Solution:** Removed static frameworks configuration from `app.json`. Now using dynamic frameworks (default), which work correctly with Expo modules.

**Result:** Local Xcode builds now work without errors!

## 📦 Project Structure

**Xcode Targets:**
- ✅ GoalsAI (main app)
- ✅ widget (home widget)
- ✅ PomodoroLiveActivity (Live Activity)
- ❌ OneSignalNotificationServiceExtension (removed)

**Push Notifications:**
- ✅ Work via `react-native-onesignal` SDK
- ✅ No extension needed for basic notifications

## 🔧 Maintenance

### After npm install
The patch script runs automatically:
```bash
npm install  # Runs postinstall hook
# → Builds plugin
# → Patches expo-apple-authentication
```

### After expo prebuild
```bash
npx expo prebuild --platform ios --clean
# → Regenerates iOS project
# → Applies custom plugin
# → Creates widget and Live Activity targets
# → Does NOT create OneSignal extension
```

### If Build Fails
1. Clean derived data: `rm -rf ~/Library/Developer/Xcode/DerivedData/GoalsAI-*`
2. Clean pods: `cd ios && rm -rf Pods Podfile.lock && pod install`
3. Build in Xcode (not command line)

## 📝 Summary of Changes

**Files Modified:**
- `app.json` - Removed onesignal-expo-plugin
- `plugin/src/index.ts` - Removed OneSignal extension logic
- `ios/Podfile` - Removed OneSignal extension target
- `package.json` - Added patch script to postinstall
- `scripts/patch-expo-apple-auth.py` - Fixes iOS 18+ compatibility
- `ios/widget/TaskIntents.swift` - Fixed App Shortcut utterance

**Everything is now persistent** - these changes will survive `expo prebuild` and `npm install`.

## 🎉 Ready for Production

Your app is now ready to build and submit to the App Store!

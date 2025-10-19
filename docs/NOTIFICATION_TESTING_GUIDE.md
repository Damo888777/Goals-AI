# OneSignal Push Notifications Testing Guide

## Overview
This guide covers testing the complete OneSignal push notification system implemented for Goals AI, including the three notification types specified in the notifications guide.

## Prerequisites

### 1. OneSignal Setup
- ✅ OneSignal App ID: `bcd988a6-d832-4c7c-83bf-4af40c46bf53`
- ✅ SDK installed: `react-native-onesignal@5.2.13`
- ✅ Plugin configured: `onesignal-expo-plugin@2.0.3`
- ✅ Environment variable: `EXPO_PUBLIC_ONESIGNAL_APP_ID`

### 2. App Configuration
- ✅ iOS entitlements configured for push notifications
- ✅ Background modes enabled: `["remote-notification"]`
- ✅ App group configured: `group.pro.GoalAchieverAI.onesignal`
- ✅ Development mode enabled in plugin configuration

## Testing Scenarios

### 1. Morning Kickstart Notifications (7:00 AM)

#### Scenario A: No Frog Task Set
**Expected Notification:**
- Title: "Good Morning! 🌅"
- Body: "What's the one task that will make today a victory? It's time to set your Frog."

**Test Steps:**
1. Ensure no frog task is set for today
2. Trigger morning notification via OneSignal dashboard
3. Verify notification appears with correct content
4. Tap notification and verify app opens to appropriate screen

#### Scenario B: Frog Task Already Set
**Expected Notification:**
- Title: "Ready to Win the Day? 🎯"
- Body: "Your priority is '[Frog Task Title]'. Let's get it done early."

**Test Steps:**
1. Set a frog task for today (e.g., "Complete project proposal")
2. Trigger morning notification via OneSignal dashboard
3. Verify notification shows the actual frog task title
4. Tap notification and verify navigation to task details

### 2. Evening Check-in Notifications (6:00 PM)

#### Scenario A: Frog Task Completed
**Expected Notification:**
- Title: "Another Day, Another Victory! 🏆"
- Body: "Your 'Eat the Frog' streak is now at [X] days. 🔥 Keep up the incredible work."

**Test Steps:**
1. Set and complete a frog task today
2. Trigger evening notification via OneSignal dashboard
3. Verify streak count is accurate
4. Tap notification and verify navigation to progress view

#### Scenario B: Frog Task Not Completed
**Expected Notification:**
- Title: "Still Time to Win! ⏰"
- Body: "There's still time to tackle '[Frog Task Title]' and keep your [X]-day streak alive!"

**Test Steps:**
1. Set a frog task but don't complete it
2. Trigger evening notification via OneSignal dashboard
3. Verify task title and streak count are shown
4. Tap notification and verify navigation to task

### 3. Re-engagement Notifications

#### Scenario A: 3 Days Inactive
**Expected Notification:**
- Title: "Ready for Your Next Step? 🚀"
- Body: "Every great journey has moments of rest. When you're ready, your vision is waiting. One small step is all it takes to get back on track."

**Test Steps:**
1. Don't open app for 3+ days (or simulate via OneSignal)
2. Trigger re-engagement notification
3. Verify motivational content appears
4. Tap notification and verify app opens to main screen

#### Scenario B: 7 Days Inactive
**Expected Notification:**
- Title: "Your Journey Awaits 🌟"
- Body: "Remember your goal to '[User's Main Goal Title]'? Your victories in the Trophy Room prove you can do it. Let's start the next chapter."

**Test Steps:**
1. Don't open app for 7+ days (or simulate via OneSignal)
2. Ensure user has at least one goal set
3. Trigger re-engagement notification
4. Verify goal title is personalized
5. Tap notification and verify navigation to goals screen

## Testing Methods

### Method 1: OneSignal Dashboard Testing
1. Go to [OneSignal Dashboard](https://app.onesignal.com/)
2. Select your app (Goals AI)
3. Navigate to "Messages" → "Push"
4. Click "New Push"
5. Configure test notification:
   - **Audience**: Test Users or specific device
   - **Message**: Use scenarios above
   - **Additional Data**: Include appropriate notification type and data
6. Send and verify on device

### Method 2: Development Testing
1. Build and install development version on device
2. Enable notifications when prompted
3. Use notification settings screen to verify permissions
4. Test notification event handlers by tapping notifications

### Method 3: API Testing (Advanced)
```bash
# Example OneSignal REST API call
curl -X POST "https://onesignal.com/api/v1/notifications" \
  -H "Content-Type: application/json; charset=utf-8" \
  -H "Authorization: Basic YOUR_REST_API_KEY" \
  -d '{
    "app_id": "bcd988a6-d832-4c7c-83bf-4af40c46bf53",
    "included_segments": ["Test Users"],
    "headings": {"en": "Good Morning! 🌅"},
    "contents": {"en": "What'\''s the one task that will make today a victory? It'\''s time to set your Frog."},
    "data": {
      "type": "morning_kickstart",
      "scenario": "no_frog_task",
      "date": "2025-10-19"
    }
  }'
```

## User Journey Testing

### Complete Flow Test
1. **Fresh Install**:
   - Install app on device
   - Complete onboarding
   - Verify OneSignal initialization

2. **Permission Request**:
   - Navigate to Profile → Notifications
   - Enable notifications
   - Verify permission granted

3. **Create Goal & Tasks**:
   - Create a new goal
   - Set a frog task for today
   - Verify notification tags updated

4. **Task Completion**:
   - Complete the frog task
   - Verify streak tracking updated
   - Check notification service integration

5. **Notification Testing**:
   - Send test notifications via OneSignal
   - Verify all scenarios work correctly
   - Test notification tap handling

## Verification Checklist

### ✅ Setup Verification
- [ ] OneSignal SDK initialized without errors
- [ ] User successfully linked to OneSignal
- [ ] Notification permissions granted
- [ ] Device appears in OneSignal dashboard

### ✅ Notification Content
- [ ] Morning kickstart notifications show correct scenarios
- [ ] Evening check-in notifications show accurate streak data
- [ ] Re-engagement notifications include personalized content
- [ ] All notifications use correct emojis and formatting

### ✅ User Interaction
- [ ] Notification taps navigate to appropriate screens
- [ ] Notification settings screen works correctly
- [ ] Permission requests handled gracefully
- [ ] User can enable/disable notifications

### ✅ Data Integration
- [ ] Frog task completion updates notification system
- [ ] Goal creation updates main goal for personalization
- [ ] Activity tracking works for re-engagement logic
- [ ] Streak counting is accurate

## Troubleshooting

### Common Issues

1. **Notifications Not Appearing**:
   - Check device notification settings
   - Verify OneSignal initialization
   - Check app is in development mode
   - Ensure proper entitlements

2. **Wrong Notification Content**:
   - Verify database queries in notification scheduler
   - Check user tag updates
   - Validate notification generation logic

3. **Navigation Not Working**:
   - Check notification event handlers
   - Verify router navigation paths
   - Test deep linking functionality

### Debug Tools

1. **OneSignal Debug Logs**:
   ```typescript
   OneSignal.Debug.setLogLevel(LogLevel.Verbose);
   ```

2. **Console Logging**:
   - Check notification service logs
   - Monitor notification scheduler output
   - Verify user tag updates

3. **OneSignal Dashboard**:
   - View delivery reports
   - Check user segments
   - Monitor notification analytics

## Production Considerations

### Before App Store Release
1. **Change Plugin Mode**:
   ```json
   {
     "mode": "production"
   }
   ```

2. **Update iOS Entitlements**:
   ```json
   {
     "aps-environment": "production"
   }
   ```

3. **Server-Side Scheduling**:
   - Implement server-side notification scheduling
   - Set up recurring notifications for 7 AM and 6 PM
   - Configure re-engagement logic

4. **Analytics & Monitoring**:
   - Monitor notification delivery rates
   - Track user engagement with notifications
   - A/B test notification content

## Success Metrics

- **Delivery Rate**: >95% of notifications delivered
- **Open Rate**: >20% of notifications opened
- **Engagement**: Users who receive notifications show higher app retention
- **Frog Task Completion**: Increase in daily frog task completion rates
- **Re-engagement**: Reduced churn rate for inactive users

## Next Steps

1. **Complete Development Testing**: Test all scenarios on development build
2. **User Acceptance Testing**: Get feedback from beta users
3. **Performance Optimization**: Monitor notification system performance
4. **Analytics Integration**: Track notification effectiveness
5. **Iteration**: Improve notification content based on user feedback

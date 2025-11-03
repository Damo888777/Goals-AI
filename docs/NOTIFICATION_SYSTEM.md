# Notification System - Complete Implementation

## Overview
The Goals AI app now has a **fully functional notification system** that delivers daily notifications at scheduled times (7 AM, 10 AM, 6 PM) using OneSignal's REST API.

## Architecture

### Components

1. **notificationScheduler.ts** - Core scheduling logic
2. **notificationService.ts** - OneSignal integration & permission management
3. **send-notification+api.ts** - Server-side API endpoint
4. **useNotifications.tsx** - React hook for UI integration

## How It Works

### 1. Initial Setup (When User Enables Notifications)

```typescript
// User toggles notifications ON in settings
await notificationScheduler.enableNotifications()
```

**What happens:**
- ✅ Requests notification permission from iOS
- ✅ Initializes timezone detection and tags user in OneSignal
- ✅ Generates notification content based on current app state
- ✅ Schedules 3 notifications with OneSignal API:
  - Morning Kickstart (7 AM)
  - Vision Board Reminder (10 AM)
  - Evening Check-in (6 PM)
- ✅ Saves configuration to AsyncStorage

### 2. Scheduling with OneSignal

Each notification is scheduled using OneSignal's `send_after` parameter:

```typescript
{
  app_id: "your-app-id",
  include_subscription_ids: ["user-subscription-id"],
  headings: { en: "Morning Kickstart!" },
  contents: { en: "Time to tackle your frog task!" },
  send_after: "2025-11-04T07:00:00.000Z", // Deliver at 7 AM
  data: {
    type: "morning_kickstart",
    scheduled_type: "morning_kickstart",
    scheduled_hour: 7
  }
}
```

### 3. Daily Rescheduling

**Problem:** OneSignal's `send_after` only schedules a single notification, not recurring.

**Solution:** Auto-reschedule on app startup

```typescript
// Called every time app opens (app/_layout.tsx)
await notificationScheduler.checkAndRescheduleNotifications()
```

**Logic:**
- Checks if notifications are enabled
- For each notification type, checks when it was last scheduled
- If more than 12 hours have passed, reschedules all notifications
- This ensures there's always an upcoming notification scheduled

### 4. Dynamic Content Generation

Notifications adapt to user's current state:

#### Morning Kickstart (7 AM)
- **Scenario A:** No frog task set
  - "Set Your Frog Task! 🐸"
  - "Start your day by choosing your most important task."
  
- **Scenario B:** Frog task is set
  - "Time to Eat the Frog! 🐸"
  - "Ready to tackle: [Task Title]? Let's make today count!"

#### Vision Board Reminder (10 AM)
- **With Main Goal:** "Visualize Your Success! 🎯"
  - "Take a moment to connect with your vision for: [Goal Title]"
  
- **Without Main Goal:** "Create Your Vision! ✨"
  - "Set a main goal and visualize your success!"

#### Evening Check-in (6 PM)
- **Frog Completed:** "Amazing Work Today! 🎉"
  - "You crushed your frog task! Current streak: [X] days"
  
- **Frog Not Completed:** "End Your Day Strong! 💪"
  - "Quick check-in: How did today go? There's still time!"

## API Endpoint

### Supabase Edge Function: `api-send-notification`

**Location:** Supabase Edge Functions (deployed to Supabase infrastructure)

**URL:** `https://ptkrjzqjpjcsphisipti.supabase.co/functions/v1/api-send-notification`

**Purpose:** Server-side proxy to OneSignal REST API

**Why Supabase Edge Functions:**
- ✅ Works in production iOS/Android builds (unlike Expo API routes)
- ✅ Keeps OneSignal API key secure (stored in Supabase secrets)
- ✅ Runs on Supabase infrastructure (Deno runtime)
- ✅ Handles authentication with Supabase anon key
- ✅ Provides consistent error handling
- ✅ Supports CORS for cross-origin requests

**Request:**
```typescript
POST /api/send-notification
{
  app_id: string,
  include_subscription_ids: string[],
  headings: { en: string },
  contents: { en: string },
  data: object,
  send_after?: string // ISO 8601 timestamp
}
```

**Response:**
```typescript
{
  success: boolean,
  id?: string,
  recipients?: number,
  error?: string
}
```

## User Flow

### Enabling Notifications

1. User opens Settings → Notifications
2. Toggles "Enable Notifications" switch
3. iOS permission dialog appears
4. If granted:
   - OneSignal tags user with timezone
   - Schedules 3 notifications for next delivery times
   - UI shows "Notifications Enabled"

### Daily Operation

1. **Morning (7 AM):**
   - OneSignal delivers scheduled notification
   - User taps notification → Opens app to frog task

2. **Mid-Morning (10 AM):**
   - OneSignal delivers vision board reminder
   - User taps notification → Opens vision board

3. **Evening (6 PM):**
   - OneSignal delivers check-in notification
   - User taps notification → Opens today's tasks

4. **Next App Open:**
   - App checks if notifications need rescheduling
   - If yes, schedules next day's notifications
   - Cycle continues

## Configuration

### Notification Times

Defined in `notificationScheduler.ts`:

```typescript
private readonly MORNING_HOUR = 7;        // 7:00 AM
private readonly VISION_BOARD_HOUR = 10;  // 10:00 AM
private readonly EVENING_HOUR = 18;       // 6:00 PM
```

### OneSignal Setup

Required environment variables in your app:
```
EXPO_PUBLIC_ONESIGNAL_APP_ID=bcd988a6-d832-4c7c-83bf-4af40c46bf53
EXPO_PUBLIC_SUPABASE_URL=https://ptkrjzqjpjcsphisipti.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Required Supabase Edge Function secrets:
```bash
# Set in Supabase Dashboard > Edge Functions > Secrets
ONESIGNAL_API_KEY=your-onesignal-rest-api-key
EXPO_PUBLIC_ONESIGNAL_APP_ID=bcd988a6-d832-4c7c-83bf-4af40c46bf53
```

## Testing

### Test Notification

```typescript
// Send immediate test notification
await notificationScheduler.sendTestNotification()
```

### Manual Scheduling

```typescript
// Force reschedule all notifications
await notificationScheduler.scheduleDailyNotifications()
```

### Check Status

```typescript
// Check if notifications are enabled
const enabled = await notificationScheduler.areNotificationsEnabled()

// Check if permission is granted
const hasPermission = await notificationService.hasPermission()
```

## Troubleshooting

### Notifications Not Arriving

1. **Check Permission:**
   ```typescript
   const hasPermission = await notificationService.hasPermission()
   ```

2. **Check OneSignal Subscription:**
   ```typescript
   const subscriptionId = await notificationService.getSubscriptionId()
   console.log('Subscription ID:', subscriptionId)
   ```

3. **Check Scheduled Notifications:**
   ```typescript
   const config = await AsyncStorage.getItem('scheduled_notification_morning_kickstart')
   console.log('Morning notification config:', config)
   ```

4. **Check OneSignal Dashboard:**
   - Go to OneSignal dashboard
   - Check "Delivery" tab for scheduled notifications
   - Verify user is subscribed

### Notifications Scheduled But Not Delivered

- **Timezone Issues:** Verify user's timezone is correctly tagged in OneSignal
- **App Not Opened:** Rescheduling only happens when app opens
- **OneSignal API Key:** Verify API key is correct in Supabase

### Duplicate Notifications

- Clear AsyncStorage and reschedule:
  ```typescript
  await notificationScheduler.disableNotifications()
  await notificationScheduler.enableNotifications()
  ```

## Future Enhancements

### Possible Improvements

1. **Server-Side Cron Job:**
   - Run daily cron to reschedule notifications
   - Eliminates need for app to be opened

2. **Smart Timing:**
   - Learn user's optimal notification times
   - Adjust based on engagement patterns

3. **Rich Notifications:**
   - Add images (vision board preview)
   - Add action buttons (Complete Task, Snooze)

4. **Notification History:**
   - Track which notifications were delivered
   - Analytics on engagement rates

5. **A/B Testing:**
   - Test different notification copy
   - Optimize for engagement

## Summary

✅ **What Works:**
- Permission management
- OneSignal integration
- Scheduled delivery at specific times
- Dynamic content based on app state
- Automatic rescheduling
- Timezone support
- Server-side API for security

✅ **What's Complete:**
- Morning kickstart notifications
- Vision board reminders
- Evening check-ins
- Re-engagement notifications (3 & 7 day inactivity)
- Test notification functionality

🎯 **Result:** Users receive timely, personalized notifications that help them stay engaged with their goals!

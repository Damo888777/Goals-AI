/** @type {import('@bacons/apple-targets/app.plugin').Config} */
module.exports = {
  type: "live-activity",
  displayName: "Pomodoro Timer",
  colors: {
    // Pomodoro brand colors matching the screen
    $accent: "#bc4b51",
    $background: "#f5ebe0", 
    $timerBackground: "#fed0bb",
    $focusColor: "#bc4b51",
    $breakColor: "#457b9d",
    $textPrimary: "#364958",
    $textSecondary: "#ffffff"
  },
  // Optional: Add entitlements for data sharing between app and Live Activity
  entitlements: {
    "com.apple.security.application-groups": ["group.pro.GoalAchieverAI"],
    "com.apple.developer.live-activities": true
  },
};

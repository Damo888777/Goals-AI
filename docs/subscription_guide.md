1. Project Goal
Implement a complete, production-ready subscription and paywall system for the "Goals AI" iOS app using React Native, TypeScript, and RevenueCat. The system must handle a 7-day free trial and manage access to features based on three distinct subscription tiers.
2. Subscription Tiers & Entitlements
Tier: Starter
Features:
Active Goals: 3
Spark AI Voice Inputs: 40 / Month
Spark AI Vision Images: 10 / Month
Pomodoro Sessions: Unlimited
Home Screen Widgets: No
Entitlement ID: tier_starter
Product IDs: tier_starter (Monthly), tier_starter_annual (Annual)
Tier: Achiever
Features:
Active Goals: 10
Spark AI Voice Inputs: 150 / Month
Spark AI Vision Images: 20 / Month
Pomodoro Sessions: Unlimited
Home Screen Widgets: Yes
Entitlement ID: tier_achiever
Product IDs: tier_achiever (Monthly), tier_achiever_annual (Annual)
Tier: Visionary
Features:
Active Goals: Unlimited
Spark AI Voice Inputs: 500 / Month
Spark AI Vision Images: 60 / Month
Pomodoro Sessions: Unlimited
Home Screen Widgets: Yes
Entitlement ID: tier_visionary
Product IDs: tier_visionary (Monthly), tier_visionary_annual (Annual)
3. Paywall Design & UI Preferences
The paywall should be clean, professional, and adhere to the app's established design language.
Paywall Background Color: #364958
Text & Card Background Color: #F5EBE0
Font Family: Helvetica Neue (or system default San Francisco)
Font Weights:
Titles: Bold
Descriptions/Body: Light
4. Core Logic & Requirements (Paywall Behavior)
This is the most critical part. The logic must be implemented exactly as described.
Initial Paywall: The main paywall must be displayed immediately after the user's 7-day free trial expires.
No Bypass: It must be impossible to dismiss the initial paywall without successfully purchasing a subscription.
Read-Only Mode (for Lapsed/Cancelled Subscriptions): If a user does not have a valid subscription, the app must enter a "Read-Only" mode.
The user can still view all their existing data (goals, tasks, etc.).
However, any action that creates, modifies, oder interacts with data must be blocked. This includes, but is not limited to:
Creating a new goal, milestone, or task (both manually and with Spark).
Editing an existing goal, milestone, or task.
Marking a task as complete.
Starting a Pomodoro Session.
Generating a new vision image.
Attempting any of these blocked actions must immediately display the paywall.
Full Access with Subscription: A user with a valid subscription must have full read and write access to all features included in their purchased tier.
Upgrade Paywall: If a user on a lower tier attempts to access a feature or exceed a limit of a higher tier (e.g., creating their 4th active goal on the Starter plan), a context-specific upgrade paywall must be displayed. A permanent "Upgrade" button must also be visible in the user's profile (unless they are already on the highest tier).
5. Essential Documentation & Guidelines
Strict adherence to these documents is required.
RevenueCat Documentation (Crucial for Implementation):
Displaying Products: Read this to understand how to fetch and display the subscription packages from RevenueCat.
https://www.revenuecat.com/docs/getting-started/displaying-products
Entitlements: This is the core logic. Read this to understand how to check a user's access level (tier_starter, tier_achiever, etc.).
https://www.revenuecat.com/docs/getting-started/entitlements
Restoring Purchases: A "Restore Purchases" button is mandatory for Apple. Read this to implement it correctly.
https://www.revenuecat.com/docs/getting-started/restoring-purchases
Custom Paywalls: Review this for best practices on building the UI.
https://www.revenuecat.com/docs/paywalls/custom-paywalls-index
Apple Review Guidelines (Mandatory):
Pay special attention to section 3.1.1 regarding In-App Purchases and the user's ability to restore purchases.
https://developer.apple.com/app-store/review/guidelines/
Legal Documents (Links must be included on the paywall):
Terms & Conditions: https://goals-ai.app/terms
Privacy Policy: https://goals-ai.app/privacy
# React Native Goals AI - RevenueCat Subscription System Context

## Project Overview

The Goals AI iOS application requires a comprehensive subscription and paywall implementation using React Native, TypeScript, and RevenueCat. The system manages a 7-day free trial period and controls feature access across three subscription tiers with strict enforcement of subscription status.

## Subscription Architecture

### Available Tiers

**Starter Tier**
- Maximum Active Goals: 3
- Spark AI Voice Inputs: 40 per month
- Spark AI Vision Images: 10 per month
- Pomodoro Sessions: Unlimited
- Home Screen Widgets: Not available

**Achiever Tier**
- Maximum Active Goals: 10
- Spark AI Voice Inputs: 150 per month
- Spark AI Vision Images: 20 per month
- Pomodoro Sessions: Unlimited
- Home Screen Widgets: Available

**Visionary Tier**
- Maximum Active Goals: Unlimited
- Spark AI Voice Inputs: 500 per month
- Spark AI Vision Images: 60 per month
- Pomodoro Sessions: Unlimited
- Home Screen Widgets: Available

## RevenueCat Configuration

### Offering Structure
- Primary Offering ID: `tier_subscriptions`

### Package Identifiers
- `starter_monthly` - Starter tier monthly subscription
- `starter_annual` - Starter tier annual subscription
- `achiever_monthly` - Achiever tier monthly subscription
- `achiever_annual` - Achiever tier annual subscription
- `visionary_monthly` - Visionary tier monthly subscription
- `visionary_annual` - Visionary tier annual subscription

### Product Identifiers
- `tier_starter` - Monthly Starter product
- `tier_starter_annual` - Annual Starter product
- `tier_achiever` - Monthly Achiever product
- `tier_achiever_annual` - Annual Achiever product
- `tier_visionary` - Monthly Visionary product
- `tier_visionary_annual` - Annual Visionary product

### Entitlement Identifiers
- `tier_starter` - Starter tier entitlement
- `tier_achiever` - Achiever tier entitlement
- `tier_visionary` - Visionary tier entitlement

## Paywall Implementation

### Paywall Types

**Default Onboarding Paywall**
- Display Context: Shown as a full screen after user completes onboarding
- Dismissal Policy: Cannot be dismissed without successful subscription purchase
- Title: Your Vision is Worth It.
- Description: You've experienced the clarity of a guided plan. A subscription gives you the complete system to turn your vision into daily, meaningful action.


**Feature Upgrade Paywall**
- Display Context: Presented as a modal when users attempt to access features beyond their current tier or exceed tier limits
- Trigger Examples: Creating a 4th goal on Starter tier, attempting to use Home Screen Widgets on Starter tier
- Title: Ready for the Next Level?
- Description: Our higher tiers are designed for ambitious users who are ready to achieve more. Explore the plans below.

## Access Control System

### Read-Only Mode for Non-Subscribers

Users without valid subscriptions enter a restricted read-only state where they can view existing data but cannot perform any data modifications or interactions.

**Permitted Actions in Read-Only Mode:**
- View existing goals, milestones, and tasks
- Browse historical data and completed items
- Access app settings and profile information
- Delete Authenticated Account

**Blocked Actions Triggering Paywall:**
- Creating new goals, milestones, or tasks (manual or AI-assisted)
- Editing existing goals, milestones, or tasks
- Marking tasks or milestones as complete
- Initiating Pomodoro Sessions
- Generating new vision images through AI
- Uploading custom vision images
- Any data modification or feature interaction attempt

### Full Access for Active Subscribers

Users with valid subscriptions receive complete read, delete and write access to all features within their subscription tier limits. Access automatically adjusts based on the active entitlement level.

### Upgrade Flow Integration

The application maintains persistent upgrade paths through:
- Contextual upgrade paywalls when tier limits are reached
- Permanent upgrade button in user profile (hidden for Visionary tier subscribers)
- Smart detection of feature access attempts beyond current tier capabilities


## Technical Requirements

### Platform Dependencies
- React Native with TypeScript
- EAS Build system for iOS deployment
- RevenueCat SDK for subscription management

### Critical Implementation Notes
- Subscription status must be validated on app launch and resume
- Entitlement checks required before all feature access attempts
- Offline capability considerations for subscription status caching
- Proper handling of subscription restoration flows
- Grace period management for payment failures

### Terms & Privacy of Goals AI
https://goals-ai.app/privacy
https://goals-ai.app/terms

# Goalz AI - Project Context

## Product Vision

**Product Name:** Goalz AI  
**Slogan:** Take Action on Your Tomorrow's Dream

**Core Vision:** An intelligent, motivating system that bridges the gap between long-term life vision and daily intentional actions. The app provides immediate value through a frictionless guest experience with optional account creation.

**Design Authority:** All features and user flows must be implemented according to the comprehensive Figma design system (source of truth).

---

## Target Audience

**Primary Users:** Ambitious individuals, solo-entrepreneurs, and lifelong learners

**Characteristics:**
- Motivated by personal growth
- Struggle with maintaining focus
- Difficulty connecting daily tasks to larger life goals
- Tech-savvy with appreciation for clean, intuitive design

---

## Core Problems Being Solved

1. **Progress Paradox:** "I'm always busy, but I don't feel like I'm making real progress on what's important."
2. **Vision-to-Action Gap:** "I have big dreams, but I don't know how to break them down into actionable steps."
3. **Motivation Loss:** "I lose motivation because I can't see how my small daily tasks contribute to my long-term vision."
4. **Capture Friction:** "Capturing tasks and ideas is often too cumbersome, so I forget them."

---

## Application Structure

**Core Navigation:** Four main tabs + one universal creation tool (FAB)

---

## Feature Specifications

### 1. Spark AI Assistant (Global FAB)

**Location:** Floating Action Button visible on Today, Goals, and Plan tabs

**Interactions:**
- **Primary Action (Tap):** Opens fullscreen voice recording interface ("Spark")
- **Secondary Action (Long-Press):** Opens context menu with manual creation options
  - Create Task
  - Create Goal
  - Create Milestone

---

### 2. Tab 1: Today (The Command Center)

**Purpose:** Provides clear, actionable focus for the current day

**Features:**
- "Eat the Frog" Section
- "Today's Tasks" Section
- Integrated Pomodoro Timer

---

### 3. Tab 2: Goals (The Vision Hub)

**Purpose:** Home for inspiration, long-term vision, and strategic planning

**Features:**

**Vision Board:**
- Prominent button leads to immersive, dark-themed screen
- Displays user's vision images in masonry grid layout
- Image sources: User uploads or AI Image Generation ("Create Vision")

**AI Image Generation Implementation:**
- Uses library of structured JSON prompts
- User text input and selected style dynamically inserted into templates
- Templates sent to API for image generation

---

### 4. Tab 3: Plan (The Strategy Console)

**Purpose:** Stress-free overview for weekly and future planning

**Features:**
- **"This Week" View:** Accordion-style days
- **"Backlog" View:** Split into two sections
  - Ideas
  - Scheduled

---

### 5. Tab 4: Profile (The Progress Hub)

**Purpose:** Personal dashboard for progress tracking, settings, and account management

**Features:**

**"Your Journey" Stats:**
- Eat the Frog Streak
- Goals Achieved
- Total Focus Sessions

**Account Management (Conditional):**
- **Guest Users:** Prominent "Sign In with Apple" button to create permanent account
- **Signed-In Users:** Standard account management options

**Settings Menu:**
- Pomodoro Durations
- Notifications
- Help & Support
- Additional configuration options

---

## Technical Stack

### Frontend
- **Framework:** React Native with TypeScript
- **Build System:** Expo with Expo Router

### Design
- **Design Tool:** Figma (design source of truth, structured as design system)

### Backend & Authentication
- **Platform:** Supabase
- **Authentication Strategy:**
  - Default: Guest/anonymous user session
  - Optional: Permanent account via "Sign In with Apple" (exclusive method)
  - Data Migration: Support for migrating guest session data to permanent account

### AI Services

**Speech-to-Text:**
- OpenAI Whisper API

**Image Generation:**
- Platform: Nano Banana
- Model: gemini-2.5-flash-image-preview
- Implementation: Pre-defined JSON prompt templates
- Storage: `docs/library_prompt_img.md`

---

## Non-Functional Requirements

### Performance
- Fast and responsive app experience
- Smooth animations as defined in Figma prototype

### Offline Capability
- Core functionality works offline
- Automatic sync when connection restored

### Data Security
- Secure and private user data handling
- Compliance with data protection standards

---

## Project Documentation Structure

**Prompt Library Location:** `docs/prompt_library.md`
- Contains structured JSON prompt templates for AI image generation
- Templates populated dynamically with user input and style selections
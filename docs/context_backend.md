# Goalz AI - Database Architecture & Schema

## 1. Overview & Philosophy

The database architecture for Goalz AI is built on an **"Offline-First"** principle. The primary objective is to deliver a lightning-fast, responsive user experience with full offline capabilities.

### Guiding Principles

- The application **always** interacts exclusively with a local database on the user's device.
- Synchronization with the cloud backend is an asynchronous, background process.
- The user should never have to wait for the network.

## 2. Technology Stack

- **Local Database:** WatermelonDB (optimized for React Native, built on SQLite)
- **Cloud Backend:** Supabase (PostgreSQL database, Authentication, Storage, Edge Functions)
- **Authentication:** Anonymous Sign-in (initially), with a planned upgrade path to Sign in with Apple

## 3. Architecture Model: Local vs. Cloud

We employ a two-database model:

### 3.1. The Local Database (The App's Source of Truth)

- **Technology:** WatermelonDB, running on the user's device
- **Role:** This is the **primary database** for all application reads and writes. All UI updates are driven by data from this database, guaranteeing maximum performance and offline functionality
- **Lifecycle:** Created on the first launch of the app

### 3.2. The Cloud Database (The Backup & Sync Backend)

- **Technology:** PostgreSQL database hosted by Supabase
- **Role:** Serves as a secure backup for user data and enables synchronization across multiple devices. It is the "single source of truth" for the user's account
- **Interaction:** The app only communicates with Supabase via an intelligent background synchronization service

## 4. Database Schema (WatermelonDB & PostgreSQL)

The schema is designed to be identical for both the local and cloud databases to ensure seamless synchronization.

### Table: `profiles`

Managed by Supabase Auth and serves as the anchor for all user data. It supports a "Guest-First" approach.

**Columns:**

- `id` (UUID) - Primary Key. Corresponds to `auth.users.id` from Supabase
- `email` (TEXT) - User's email (is NULL for anonymous guest accounts, populated upon linking with Apple Sign-in)

### Table: `goals`

Stores the user's main goals.

**Columns:**

- `id` (TEXT) - Primary Key. WatermelonDB standard
- `user_id` (TEXT) - Foreign Key referencing `profiles.id`. Indexed
- `title` (TEXT) - The title of the goal
- `feelings` (TEXT) - A JSON string array of selected emotion tags, e.g., `["Proud", "Free"]`
- `vision_image_url` (TEXT) - URL of the image from Supabase Storage. Optional (`isOptional: true`)
- `notes` (TEXT) - Detailed notes or description for the goal. Optional (`isOptional: true`)
- `is_completed` (BOOLEAN) - Tracks if the goal has been achieved. Default: `false`
- `completed_at` (INTEGER) - Timestamp (Unix epoch) of when the goal was completed. Optional (`isOptional: true`)

### Table: `milestones`

Stores the milestones (sub-goals) for a main goal.

**Columns:**

- `id` (TEXT) - Primary Key. WatermelonDB standard
- `user_id` (TEXT) - Foreign Key referencing `profiles.id`. Indexed
- `goal_id` (TEXT) - Foreign Key referencing `goals.id`. Indexed
- `title` (TEXT) - The title of the milestone
- `target_date` (TEXT) - The optional target date for completion (ISO 8601). Optional (`isOptional: true`)
- `is_complete` (BOOLEAN) - Tracks if the milestone is complete. Default: `false`

### Table: `tasks`

Stores individual, actionable tasks.

**Columns:**

- `id` (TEXT) - Primary Key. WatermelonDB standard
- `user_id` (TEXT) - Foreign Key referencing `profiles.id`. Indexed
- `goal_id` (TEXT) - Foreign Key referencing `goals.id`. Optional, Indexed
- `milestone_id` (TEXT) - Foreign Key referencing `milestones.id`. Optional, Indexed
- `title` (TEXT) - The title of the task
- `notes` (TEXT) - Detailed notes for the task. Optional (`isOptional: true`)
- `scheduled_date` (TEXT) - Date the task is scheduled for (ISO 8601). Optional (`isOptional: true`)
- `is_frog` (BOOLEAN) - `true` if this is the "Eat the Frog" task for the `scheduled_date`. Default: `false`
- `is_complete` (BOOLEAN) - Tracks if the task is complete. Default: `false`
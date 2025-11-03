# Database Schema Validation Report

## Executive Summary

✅ **Overall Status**: Schemas are compatible with **3 critical issues** that need fixing.

---

## Schema Comparison: WatermelonDB vs Supabase

### ✅ Profiles Table - COMPATIBLE

| Field | WatermelonDB | Supabase | Transform | Status |
|-------|--------------|----------|-----------|--------|
| id | (implicit) | uuid | ✅ Handled | ✅ OK |
| email | string (optional) | text (nullable) | ✅ Direct map | ✅ OK |
| created_at | number (timestamp) | timestamptz | ✅ Converted | ✅ OK |
| updated_at | number (timestamp) | timestamptz | ✅ Converted | ✅ OK |

**Notes**: Profiles work correctly. Anonymous users skip profile sync (RLS policy).

---

### ⚠️ Goals Table - 1 ISSUE

| Field | WatermelonDB | Supabase | Transform | Status |
|-------|--------------|----------|-----------|--------|
| id | string | text | ✅ UUID conversion | ✅ OK |
| user_id | string (indexed) | uuid | ✅ UUID conversion | ✅ OK |
| title | string | text | ✅ Direct map | ✅ OK |
| feelings | string (optional) | text (nullable) | ✅ JSON.stringify | ✅ OK |
| vision_image_url | string (optional) | text (nullable) | ✅ Direct map | ✅ OK |
| notes | string (optional) | text (nullable) | ✅ Direct map | ✅ OK |
| is_completed | boolean | boolean | ✅ Direct map | ✅ OK |
| completed_at | number (optional) | bigint (nullable) | ✅ Unix timestamp | ✅ OK |
| **reflection_answers** | **string (optional)** | **❌ MISSING** | **❌ No field** | **❌ ISSUE #1** |
| creation_source | string | text | ✅ Direct map | ✅ OK |
| created_at | number | timestamptz | ✅ Converted | ✅ OK |
| updated_at | number | timestamptz | ✅ Converted | ✅ OK |

**❌ ISSUE #1**: `reflection_answers` exists in WatermelonDB but NOT in Supabase
- **Impact**: Reflection data won't sync to cloud
- **Fix**: Add column to Supabase OR remove from WatermelonDB

---

### ✅ Milestones Table - COMPATIBLE

| Field | WatermelonDB | Supabase | Transform | Status |
|-------|--------------|----------|-----------|--------|
| id | string | text | ✅ UUID conversion | ✅ OK |
| user_id | string (indexed) | uuid | ✅ UUID conversion | ✅ OK |
| goal_id | string (indexed) | text | ✅ UUID conversion | ✅ OK |
| title | string | text | ✅ Direct map | ✅ OK |
| target_date | string (optional) | text (nullable) | ✅ Direct map | ✅ OK |
| is_complete | boolean | boolean | ✅ Direct map | ✅ OK |
| creation_source | string | text | ✅ Direct map | ✅ OK |
| created_at | number | timestamptz | ✅ Converted | ✅ OK |
| updated_at | number | timestamptz | ✅ Converted | ✅ OK |

**Notes**: All fields match perfectly.

---

### ✅ Tasks Table - COMPATIBLE

| Field | WatermelonDB | Supabase | Transform | Status |
|-------|--------------|----------|-----------|--------|
| id | string | text | ✅ UUID conversion | ✅ OK |
| user_id | string (indexed) | uuid | ✅ UUID conversion | ✅ OK |
| goal_id | string (optional, indexed) | text (nullable) | ✅ UUID conversion | ✅ OK |
| milestone_id | string (optional, indexed) | text (nullable) | ✅ UUID conversion | ✅ OK |
| title | string | text | ✅ Direct map | ✅ OK |
| notes | string (optional) | text (nullable) | ✅ Direct map | ✅ OK |
| scheduled_date | string (optional) | text (nullable) | ✅ Direct map | ✅ OK |
| is_frog | boolean | boolean | ✅ Direct map | ✅ OK |
| is_complete | boolean | boolean | ✅ Direct map | ✅ OK |
| completed_at | number (optional) | bigint (nullable) | ✅ Unix timestamp | ✅ OK |
| creation_source | string | text | ✅ Direct map | ✅ OK |
| created_at | number | timestamptz | ✅ Converted | ✅ OK |
| updated_at | number | timestamptz | ✅ Converted | ✅ OK |

**Notes**: All fields match perfectly.

---

### ⚠️ Vision Images Table - SCHEMA MISMATCH

| Field | WatermelonDB | Supabase | Transform | Status |
|-------|--------------|----------|-----------|--------|
| id | string | **uuid** | ⚠️ Type mismatch | ⚠️ WARNING |
| user_id | string (indexed) | uuid | ✅ UUID conversion | ✅ OK |
| **image_uri** | **string** | **❌ MISSING** | **❌ No field** | **❌ ISSUE #2** |
| **aspect_ratio** | **number** | **❌ MISSING** | **❌ No field** | **❌ ISSUE #2** |
| **source** | **string** | **❌ MISSING** | **❌ No field** | **❌ ISSUE #2** |
| ❌ goal_id | ❌ MISSING | text (nullable) | ❌ Not in local | ⚠️ MISMATCH |
| ❌ image_url | ❌ MISSING | text | ❌ Not in local | ⚠️ MISMATCH |
| ❌ image_type | ❌ MISSING | text (nullable) | ❌ Not in local | ⚠️ MISMATCH |
| ❌ prompt | ❌ MISSING | text (nullable) | ❌ Not in local | ⚠️ MISMATCH |
| ❌ file_size | ❌ MISSING | integer (nullable) | ❌ Not in local | ⚠️ MISMATCH |
| ❌ mime_type | ❌ MISSING | text (nullable) | ❌ Not in local | ⚠️ MISMATCH |
| created_at | number | timestamptz | ✅ Converted | ✅ OK |
| updated_at | number | timestamptz | ✅ Converted | ✅ OK |

**❌ ISSUE #2**: Complete schema mismatch between local and cloud
- **Local has**: `image_uri`, `aspect_ratio`, `source`
- **Cloud has**: `goal_id`, `image_url`, `image_type`, `prompt`, `file_size`, `mime_type`
- **Impact**: Vision images won't sync properly
- **Fix**: Align schemas - decide which is correct and update the other

---

### ⚠️ Pomodoro Sessions Table - TYPE MISMATCH

| Field | WatermelonDB | Supabase | Transform | Status |
|-------|--------------|----------|-----------|--------|
| id | **string** | **uuid** | ⚠️ Type mismatch | ⚠️ WARNING |
| user_id | string (indexed) | uuid | ✅ UUID conversion | ✅ OK |
| task_id | string (indexed) | text (nullable) | ✅ UUID conversion | ✅ OK |
| goal_id | string (optional, indexed) | text (nullable) | ✅ UUID conversion | ✅ OK |
| session_type | string | text (nullable) | ✅ Direct map | ✅ OK |
| duration_minutes | number | integer | ✅ Direct map | ✅ OK |
| is_completed | boolean | boolean | ✅ Direct map | ✅ OK |
| completed_at | number (optional) | **timestamptz** (nullable) | **❌ Type mismatch** | **❌ ISSUE #3** |
| notes | string (optional) | text (nullable) | ✅ Direct map | ✅ OK |
| created_at | number | timestamptz | ✅ Converted | ✅ OK |
| updated_at | number | timestamptz | ✅ Converted | ✅ OK |

**❌ ISSUE #3**: `completed_at` type mismatch
- **Local**: `number` (Unix timestamp in milliseconds)
- **Cloud**: `timestamptz` (PostgreSQL timestamp)
- **Impact**: Completed timestamp won't sync correctly
- **Fix**: Convert number to ISO string in transform OR change Supabase to bigint

---

### ⚠️ Task Time Tracking Table - TYPE MISMATCH

| Field | WatermelonDB | Supabase | Transform | Status |
|-------|--------------|----------|-----------|--------|
| id | **string** | **uuid** | ⚠️ Type mismatch | ⚠️ WARNING |
| user_id | string (indexed) | uuid | ✅ UUID conversion | ✅ OK |
| task_id | string (indexed) | text (nullable) | ✅ UUID conversion | ✅ OK |
| total_pomodoro_sessions | number | integer | ✅ Direct map | ✅ OK |
| total_minutes_focused | number | integer | ✅ Direct map | ✅ OK |
| last_session_at | number (optional) | **timestamptz** (nullable) | **❌ Type mismatch** | **❌ ISSUE #3** |
| created_at | number | timestamptz | ✅ Converted | ✅ OK |
| updated_at | number | timestamptz | ✅ Converted | ✅ OK |

**❌ ISSUE #3**: `last_session_at` type mismatch (same as pomodoro_sessions)

---

### ⚠️ Subscriptions Table - FIELD MISMATCHES

| Field | WatermelonDB | Supabase | Transform | Status |
|-------|--------------|----------|-----------|--------|
| id | **string** | **uuid** | ⚠️ Type mismatch | ⚠️ WARNING |
| user_id | string (indexed) | uuid | ✅ UUID conversion | ✅ OK |
| subscription_tier | string | text | ✅ Direct map | ✅ OK |
| product_id | string | text | ✅ Direct map | ✅ OK |
| transaction_id | string | text | ✅ Direct map | ✅ OK |
| original_transaction_id | string | text | ✅ Direct map | ✅ OK |
| purchased_at | number | **timestamptz** | ⚠️ Needs ISO conversion | ⚠️ WARNING |
| expires_at | number (optional) | **timestamptz** (nullable) | ⚠️ Needs ISO conversion | ⚠️ WARNING |
| is_active | boolean | boolean | ✅ Direct map | ✅ OK |
| is_trial | boolean | boolean | ✅ Direct map | ✅ OK |
| is_cancelled | boolean | boolean | ✅ Direct map | ✅ OK |
| cancelled_at | number (optional) | **timestamptz** (nullable) | ⚠️ Needs ISO conversion | ⚠️ WARNING |
| cancel_reason | string (optional) | text (nullable) | ✅ Direct map | ✅ OK |
| expired_at | number (optional) | **timestamptz** (nullable) | ⚠️ Needs ISO conversion | ⚠️ WARNING |
| has_billing_issue | boolean | boolean | ✅ Direct map | ✅ OK |
| billing_issue_detected_at | number (optional) | **timestamptz** (nullable) | ⚠️ Needs ISO conversion | ⚠️ WARNING |
| environment | string | text | ✅ Direct map | ✅ OK |
| store | string | text | ✅ Direct map | ✅ OK |
| country_code | string (optional) | text (nullable) | ✅ Direct map | ✅ OK |
| currency | string (optional) | text (nullable) | ✅ Direct map | ✅ OK |
| price | number (optional) | numeric (nullable) | ✅ Direct map | ✅ OK |
| entitlement_ids | string (optional) | **ARRAY** (nullable) | ⚠️ JSON vs Array | ⚠️ WARNING |
| ❌ active_entitlements | ❌ MISSING | text (nullable) | ⚠️ Extra in cloud | ⚠️ MISMATCH |
| ❌ current_tier | ❌ MISSING | text (nullable) | ⚠️ Extra in cloud | ⚠️ MISMATCH |
| ❌ revenuecat_customer_id | ❌ MISSING | text (nullable) | ⚠️ Extra in cloud | ⚠️ MISMATCH |
| ❌ last_updated | ❌ MISSING | timestamptz (nullable) | ⚠️ Extra in cloud | ⚠️ MISMATCH |
| created_at | number | timestamptz | ✅ Converted | ✅ OK |
| updated_at | number | timestamptz | ✅ Converted | ✅ OK |

**⚠️ WARNING**: Multiple timestamp fields need ISO string conversion
**⚠️ WARNING**: `entitlement_ids` - JSON string vs PostgreSQL ARRAY type
**⚠️ WARNING**: Cloud has extra fields not in local schema

---

### ✅ Subscription Usage Table - COMPATIBLE

| Field | WatermelonDB | Supabase | Transform | Status |
|-------|--------------|----------|-----------|--------|
| id | **string** | **uuid** | ⚠️ Type mismatch | ⚠️ WARNING |
| user_id | string (indexed) | uuid | ✅ UUID conversion | ✅ OK |
| subscription_tier | string | text | ✅ Direct map | ✅ OK |
| spark_ai_voice_inputs_used | number | integer | ✅ Direct map | ✅ OK |
| spark_ai_vision_images_used | number | integer | ✅ Direct map | ✅ OK |
| active_goals_count | number | integer | ✅ Direct map | ✅ OK |
| period_start | number | **timestamptz** | ⚠️ Needs ISO conversion | ⚠️ WARNING |
| period_end | number (optional) | **timestamptz** (nullable) | ⚠️ Needs ISO conversion | ⚠️ WARNING |
| created_at | number | timestamptz | ✅ Converted | ✅ OK |
| updated_at | number | timestamptz | ✅ Converted | ✅ OK |

**⚠️ WARNING**: Timestamp fields need ISO string conversion

---

## Critical Issues Summary

### ❌ ISSUE #1: Goals - Missing `reflection_answers` in Supabase
**Severity**: Medium
**Impact**: Reflection data won't sync
**Fix Options**:
1. Add `reflection_answers TEXT` column to Supabase `goals` table
2. Remove field from WatermelonDB schema if not needed

### ❌ ISSUE #2: Vision Images - Complete Schema Mismatch
**Severity**: HIGH
**Impact**: Vision images won't sync at all
**Fix Options**:
1. Update WatermelonDB schema to match Supabase (recommended)
2. Update Supabase schema to match WatermelonDB
3. Create migration to transform between schemas

**Recommended Fix**: Update WatermelonDB schema:
```typescript
tableSchema({
  name: 'vision_images',
  columns: [
    { name: 'user_id', type: 'string', isIndexed: true },
    { name: 'goal_id', type: 'string', isOptional: true, isIndexed: true },
    { name: 'image_url', type: 'string' }, // Changed from image_uri
    { name: 'image_type', type: 'string', isOptional: true }, // NEW
    { name: 'prompt', type: 'string', isOptional: true }, // NEW
    { name: 'file_size', type: 'number', isOptional: true }, // NEW
    { name: 'mime_type', type: 'string', isOptional: true }, // NEW
    // Remove: aspect_ratio, source
    { name: 'created_at', type: 'number' },
    { name: 'updated_at', type: 'number' },
  ]
})
```

### ❌ ISSUE #3: Timestamp Type Mismatches
**Severity**: Medium
**Impact**: Pomodoro/tracking timestamps won't sync correctly
**Tables Affected**:
- `pomodoro_sessions.completed_at`
- `task_time_tracking.last_session_at`
- `subscriptions.*_at` fields
- `subscription_usage.period_start/period_end`

**Fix**: Update `transformLocalToSupabase` to convert ALL timestamp fields to ISO strings:
```typescript
// For timestamp fields that are timestamptz in Supabase
purchased_at: record.purchasedAt ? new Date(record.purchasedAt).toISOString() : null
expires_at: record.expiresAt ? new Date(record.expiresAt).toISOString() : null
// etc.
```

---

## Transform Function Issues

### Missing Transformations in `transformLocalToSupabase`

**Not Handled**:
- ❌ `vision_images` table - no transformation logic
- ❌ `pomodoro_sessions` table - no transformation logic
- ❌ `task_time_tracking` table - no transformation logic
- ⚠️ Subscription timestamp fields - using `new Date().toISOString()` instead of actual values

### Missing Transformations in `applyRemoteChanges`

**Not Handled**:
- ❌ `vision_images` table - no apply logic
- ❌ `pomodoro_sessions` table - no apply logic
- ❌ `task_time_tracking` table - no apply logic

---

## Recommendations

### Immediate Fixes (Required for Sync to Work)

1. **Fix Vision Images Schema** (HIGH PRIORITY)
   - Update WatermelonDB schema to match Supabase
   - Add transformation logic in `transformLocalToSupabase`
   - Add apply logic in `applyRemoteChanges`

2. **Fix Timestamp Conversions** (HIGH PRIORITY)
   - Update all timestamp fields to use ISO string conversion
   - Ensure bidirectional conversion works correctly

3. **Add Missing Table Transformations** (HIGH PRIORITY)
   - Add `pomodoro_sessions` transformation
   - Add `task_time_tracking` transformation
   - Add `vision_images` transformation

### Optional Improvements

4. **Add `reflection_answers` to Supabase** (MEDIUM PRIORITY)
   - If reflection data is important, add column to cloud

5. **Standardize ID Types** (LOW PRIORITY)
   - Consider using UUID for all primary keys in WatermelonDB
   - Current UUID conversion works but adds complexity

---

## Sync Service Status

### ✅ Working Correctly
- Anonymous user push-only sync
- Authenticated user bidirectional sync
- Reverse migration on sign-out
- Goals, milestones, tasks sync

### ❌ Not Working
- Vision images sync (schema mismatch)
- Pomodoro sessions sync (no transformation)
- Task time tracking sync (no transformation)
- Subscription timestamp sync (wrong format)

---

## Action Items

1. [ ] Update `vision_images` WatermelonDB schema
2. [ ] Add vision images transformation logic
3. [ ] Fix all timestamp conversions to ISO strings
4. [ ] Add pomodoro_sessions transformation
5. [ ] Add task_time_tracking transformation
6. [ ] Test bidirectional sync for all tables
7. [ ] Add `reflection_answers` to Supabase (optional)

---

## Conclusion

The sync architecture is **fundamentally sound**, but there are **3 critical schema mismatches** that will prevent proper synchronization:

1. Vision images - complete schema mismatch
2. Timestamp fields - type conversion issues
3. Missing transformation logic for 3 tables

These must be fixed before the sync service will work correctly for all data types.

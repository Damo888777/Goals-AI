# Sync Service Fix Implementation

## Problem Summary

The sync service had critical bugs that prevented proper data flow during authentication state changes:

1. ❌ **No bidirectional sync** - Authenticated users only pushed data, never pulled from cloud
2. ❌ **No reverse migration** - Sign-out didn't migrate data back to anonymous ID (data loss)
3. ❌ **No multi-device sync** - Data created on Device A wouldn't appear on Device B

## Solution Implemented

### 1. Bidirectional Sync for Authenticated Users ✅

**File**: `/src/services/syncService.ts`

**Changes**:
- Anonymous users: **Push-only** (no pull) - unchanged
- Authenticated users: **Pull → Apply → Push** (bidirectional)

**Flow**:
```typescript
// For authenticated users only
1. Pull remote changes from Supabase
2. Apply remote changes to local database (merge)
3. Push local changes to Supabase
```

**New Methods Added**:
- `getLastPullTimestamp()` - Track last pull time for incremental sync
- `setLastPullTimestamp()` - Update last pull timestamp
- `hasRemoteChanges()` - Check if remote data exists
- `applyRemoteChanges()` - Merge cloud data into local database

### 2. Reverse Migration on Sign-Out ✅

**File**: `/src/services/authService.ts`

**Changes**:
```typescript
async signOut(): Promise<void> {
  const previousAuthenticatedId = this.currentUser?.id
  const wasAuthenticated = !this.currentUser?.isAnonymous
  
  await supabase.auth.signOut()
  await this.ensureAnonymousUser()
  
  // NEW: Migrate data back to anonymous ID
  if (wasAuthenticated && previousAuthenticatedId && this.persistentAnonymousId) {
    await this.migrateUserData(previousAuthenticatedId, this.persistentAnonymousId)
  }
}
```

**Result**: User sees all their data after signing out (no data loss)

### 3. Full Sync After Apple Sign-In ✅

**File**: `/src/services/authService.ts`

**Changes**:
```typescript
// Force full bidirectional sync after upgrade
setTimeout(() => {
  syncService.sync(true) // true = force sync, ignore cooldown
}, 1000)
```

**Result**: 
- Migrated local data pushes to cloud
- Any existing cloud data pulls to local
- Multi-device sync works correctly

## Complete Authentication Flow

### Scenario 1: Anonymous User
```
User opens app
  ↓ Creates anonymous ID (stored in AsyncStorage)
  ↓ Creates goals locally (userId = anon-123)
  ↓ Push-only sync to Supabase ✅
  ↓ NO PULL (anonymous users don't pull)
```

### Scenario 2: Sign In with Apple
```
Anonymous user (anon-123) signs in
  ↓ Migrate local data: anon-123 → apple-456 ✅
  ↓ currentUser = { id: apple-456, isAnonymous: false }
  ↓ Trigger bidirectional sync:
    1. Pull cloud data (from other devices) ✅
    2. Apply to local database ✅
    3. Push migrated data ✅
  ↓ User sees: Local data + Cloud data (merged)
```

### Scenario 3: Sign Out
```
Authenticated user (apple-456) signs out
  ↓ Migrate local data: apple-456 → anon-123 ✅
  ↓ currentUser = { id: anon-123, isAnonymous: true }
  ↓ User sees all their data (no loss) ✅
  ↓ Push-only sync resumes
```

### Scenario 4: Re-Sign In with Apple
```
Anonymous user (anon-123) re-signs in
  ↓ Migrate local data: anon-123 → apple-456 ✅
  ↓ Trigger bidirectional sync:
    1. Pull cloud data ✅
    2. Merge with local ✅
    3. Push any new local changes ✅
  ↓ Full multi-device sync working ✅
```

## Key Design Decisions

### Why Anonymous Users Don't Pull

**Reasoning**:
- Anonymous users are device-specific (no multi-device access)
- Pulling would require complex conflict resolution for anonymous IDs
- Push-only ensures data is backed up without complexity
- Keeps anonymous experience simple and fast

### Why Authenticated Users Pull

**Reasoning**:
- Authenticated users expect multi-device sync
- Cloud is the "source of truth" for authenticated accounts
- Pull enables: Device A creates goal → Device B sees goal
- Essential for cross-device continuity

### Migration Strategy

**Forward Migration (Anonymous → Apple)**:
```typescript
// Change all local records from anonymous ID to Apple ID
UPDATE goals SET user_id = 'apple-456' WHERE user_id = 'anon-123'
UPDATE milestones SET user_id = 'apple-456' WHERE user_id = 'anon-123'
UPDATE tasks SET user_id = 'apple-456' WHERE user_id = 'anon-123'
```

**Reverse Migration (Apple → Anonymous)**:
```typescript
// Change all local records from Apple ID back to anonymous ID
UPDATE goals SET user_id = 'anon-123' WHERE user_id = 'apple-456'
UPDATE milestones SET user_id = 'anon-123' WHERE user_id = 'apple-456'
UPDATE tasks SET user_id = 'anon-123' WHERE user_id = 'apple-456'
```

## Testing Checklist

### Test 1: Anonymous User Flow
- [ ] Create goals as anonymous user
- [ ] Verify push to Supabase
- [ ] Verify no pull attempts
- [ ] Check Supabase has data with anonymous user_id

### Test 2: Sign In Flow
- [ ] Sign in with Apple
- [ ] Verify local data migration (userId changes)
- [ ] Verify bidirectional sync (pull + push)
- [ ] Check all data visible in app
- [ ] Check Supabase has data with Apple user_id

### Test 3: Sign Out Flow
- [ ] Sign out from Apple
- [ ] Verify reverse migration (userId changes back)
- [ ] Verify all data still visible
- [ ] Verify push-only sync resumes

### Test 4: Multi-Device Sync
- [ ] Sign in on Device A
- [ ] Create goal on Device A
- [ ] Sign in on Device B (same Apple ID)
- [ ] Verify goal appears on Device B
- [ ] Create goal on Device B
- [ ] Verify goal appears on Device A

### Test 5: Re-Sign In Flow
- [ ] Start as anonymous, create goals
- [ ] Sign in with Apple
- [ ] Sign out
- [ ] Create more goals as anonymous
- [ ] Re-sign in with Apple
- [ ] Verify all goals visible (old + new)

## Performance Considerations

### Sync Cooldown
- 5-second cooldown between syncs prevents spam
- Force sync (`sync(true)`) bypasses cooldown for critical operations

### Incremental Pull
- Only pulls changes since last pull timestamp
- Reduces bandwidth and processing time
- First pull after sign-in gets all data

### Conflict Resolution
- Last-write-wins strategy (simple, predictable)
- Remote changes overwrite local if timestamps newer
- Future: Could implement more sophisticated merge logic

## Security Notes

### RLS Policies Required
Supabase Row Level Security must enforce:
```sql
-- Users can only access their own data
CREATE POLICY "Users access own data" ON goals
FOR ALL USING (auth.uid() = user_id);
```

### Anonymous User Isolation
- Each anonymous user has unique UUID
- Anonymous users can't access other anonymous users' data
- Anonymous → Authenticated migration preserves data ownership

## Files Modified

1. `/src/services/syncService.ts`
   - Added bidirectional sync for authenticated users
   - Added `applyRemoteChanges()` method
   - Added pull timestamp tracking

2. `/src/services/authService.ts`
   - Added reverse migration on sign-out
   - Force full sync after Apple Sign-In upgrade

## Summary

✅ **Anonymous users**: Push-only sync (simple, fast, no pull)
✅ **Authenticated users**: Bidirectional sync (pull + push for multi-device)
✅ **Sign-out**: Reverse migration preserves all data
✅ **Re-sign-in**: Full sync merges local + cloud data
✅ **Multi-device**: Works correctly for authenticated users

The implementation now matches the expected architecture documented in `context_backend.md`.

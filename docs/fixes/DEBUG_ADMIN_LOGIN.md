# Debug Admin Login Issue

## Current Status
- Database: `is_active` is TRUE ✅
- Code: Fixed to set super_admin active immediately ✅  
- Issue: Still getting "Unauthorized" error ❌

## Added Debug Logging

I've added comprehensive logging to:
1. `/app/src/lib/actions/admin-auth.ts` - `adminLoginAction` function
2. `/app/src/lib/admin-auth.ts` - `getAdminProfile` function

## Next Steps to Debug

### Step 1: Try logging in again
1. Open browser DevTools (F12)
2. Go to Console tab
3. Try logging in with your credentials
4. Look for log messages starting with `[Admin Login]` and `[getAdminProfile]`

### Step 2: Check the logs
The logs will tell us:
- Did sign in succeed?
- Was the admin profile found?
- What's the exact error?

### Expected Log Flow (Success):
```
[Admin Login] Starting login for: mainfordudew@gmail.com
[Admin Login] Sign in successful, user ID: <uuid>
[getAdminProfile] Fetching profile for user: <uuid>
[getAdminProfile] Profile found: { id: ..., role: 'super_admin', is_active: true }
[Admin Login] Admin profile: { ... }
[Admin Login] Login successful, role: super_admin
```

### Expected Log Flow (Error):
```
[Admin Login] Starting login for: mainfordudew@gmail.com
[Admin Login] Exception caught: <error message>
```

## Possible Issues & Solutions

### Issue 1: RLS Policy Blocking Query
**Symptom**: `[getAdminProfile] Query error: ...`
**Solution**: The RLS policy might not recognize the user's session. We may need to use service role for login.

### Issue 2: Session Not Created Properly
**Symptom**: Sign in succeeds but profile query fails
**Solution**: Check if cookies are being set correctly

### Issue 3: Password Mismatch
**Symptom**: `[Admin Login] Sign in failed: Invalid login credentials`
**Solution**: Password might be different from what you remember

### Issue 4: Multiple Supabase Clients
**Symptom**: Multiple GoTrueClient warnings in console
**Solution**: Not causing the login issue, but can be fixed later

## Test Commands

### Check if user exists in auth.users:
Run this in Supabase SQL Editor:
```sql
SELECT id, email, created_at, confirmed_at 
FROM auth.users 
WHERE email = 'mainfordudew@gmail.com';
```

### Check admin profile:
```sql
SELECT ap.*, au.email 
FROM admin_profiles ap
JOIN auth.users au ON ap.user_id = au.id
WHERE au.email = 'mainfordudew@gmail.com';
```

### Test RLS policy:
```sql
-- This should return the profile
SELECT * FROM admin_profiles 
WHERE user_id = '<your-user-id-from-above>';
```

## Quick Fix Options

### Option A: Use Service Role for Profile Check
Modify `getAdminProfile` to use service role client instead of regular client. This bypasses RLS.

### Option B: Fix RLS Policy
Ensure the policy allows authenticated users to view their own profile.

### Option C: Reset Password
If password is the issue, reset it via Supabase dashboard.

## After Debugging

Once you share the console logs, I'll know exactly what's failing and can provide the precise fix!

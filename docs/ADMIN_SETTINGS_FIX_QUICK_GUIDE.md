# Quick Fix Guide: Admin Settings Constraint Error

## ⚡ TL;DR

**Error:** `new row for relation "admin_settings" violates check constraint "single_row_only"`

**Fix:** Run the migration script to update the constraint.

## 🚀 Quick Fix Steps

### Option 1: Using Supabase Dashboard (Recommended)

1. Open your Supabase project dashboard
2. Go to **SQL Editor** (left sidebar)
3. Click **New query**
4. Copy the contents of `/app/backend-implementation/08-fix-admin-settings-constraint.sql`
5. Paste into the SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. ✅ Done! Check for success messages

### Option 2: Using psql Command Line

```bash
# Navigate to your project directory
cd /app

# Run the migration script
psql -d your_database_url -f backend-implementation/08-fix-admin-settings-constraint.sql
```

### Option 3: Using Node.js/Supabase Client

```typescript
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const sql = fs.readFileSync(
  './backend-implementation/08-fix-admin-settings-constraint.sql',
  'utf-8'
)

const { error } = await supabase.rpc('exec_sql', { sql })
if (error) console.error('Error:', error)
else console.log('✅ Fix applied successfully!')
```

## ✅ Verify the Fix

Run this query to confirm the fix worked:

```sql
SELECT COUNT(*) as row_count FROM admin_settings;
```

**Expected result:** `row_count = 1`

Try inserting a duplicate row (should fail):

```sql
INSERT INTO admin_settings (setup_completed, recovery_key_hash, singleton_guard)
VALUES (FALSE, NULL, TRUE);
```

**Expected:** Error message about duplicate key (this is good! It means the constraint is working)

## 📝 What Changed?

### Before (Broken)
```sql
CONSTRAINT single_row_only CHECK (id = uuid_generate_v4())
-- ❌ This always fails because uuid_generate_v4() 
-- generates a new UUID each time
```

### After (Fixed)
```sql
singleton_guard BOOLEAN DEFAULT TRUE NOT NULL,
CONSTRAINT single_row_only UNIQUE (singleton_guard)
-- ✅ Only one row can have singleton_guard = TRUE
```

## 🆘 Troubleshooting

### Problem: "constraint already exists" error

**Solution:** The migration handles this, but if needed:
```sql
ALTER TABLE admin_settings DROP CONSTRAINT IF EXISTS single_row_only;
-- Then re-run the migration
```

### Problem: Multiple rows exist in admin_settings

**Solution:** Keep only the oldest row:
```sql
DELETE FROM admin_settings 
WHERE id NOT IN (
    SELECT id FROM admin_settings 
    ORDER BY created_at ASC 
    LIMIT 1
);
```

### Problem: Migration seems to hang

**Solution:** Check for active transactions:
```sql
SELECT * FROM pg_stat_activity 
WHERE state = 'active' AND query LIKE '%admin_settings%';
```

## 📞 Need Help?

- See full documentation: `/app/docs/ADMIN_SETTINGS_CONSTRAINT_FIX.md`
- Check the original admin auth setup: `/app/docs/ADMIN_AUTH_SETUP.md`
- Review implementation details: `/app/ADMIN_AUTH_IMPLEMENTATION.md`

## ⚠️ Important Notes

1. **Backup First**: Always backup your database before running migrations
2. **Service Role Key**: The migration may require `SUPABASE_SERVICE_ROLE_KEY`
3. **No Data Loss**: This fix doesn't delete any existing data
4. **Backward Compatible**: Existing code continues to work without changes
5. **TypeScript Updated**: The `AdminSettings` interface now includes `singleton_guard`

---

**Status:** ✅ Ready to apply  
**Risk Level:** Low (adds column and changes constraint only)  
**Downtime Required:** None  
**Rollback Available:** Yes (see main documentation)

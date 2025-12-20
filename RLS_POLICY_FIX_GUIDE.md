# RLS Policy Fix Guide for Categories

## Problem

You're getting an RLS (Row Level Security) policy error when trying to create categories. The error occurs because:

1. Your code uses `supabaseAdmin` which should bypass RLS
2. BUT `supabaseAdmin` needs the `SUPABASE_SERVICE_ROLE_KEY` environment variable
3. This variable is NOT accessible in client-side code (even though it's in .env.local)
4. The CategoryService is being called from a client component

## Root Cause

In Next.js, environment variables without `NEXT_PUBLIC_` prefix are only available on the server-side. Your create category page is a client component (`"use client"`), so it can't access `SUPABASE_SERVICE_ROLE_KEY`.

## Solutions (Pick ONE)

### Solution 1: Update RLS Policies (EASIEST - RECOMMENDED)

This allows authenticated users to create categories without needing service role.

**Steps:**

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/qyvpihdiyuowkyideltd
2. Click "SQL Editor"
3. Run this SQL:

```sql
-- Remove old restrictive policy
DROP POLICY IF EXISTS "Admins have full access to categories" ON categories;

-- Add new policy that allows authenticated users
CREATE POLICY "Authenticated users can manage categories"
    ON categories FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Keep public read access
DROP POLICY IF EXISTS "Public can read categories" ON categories;
CREATE POLICY "Public can read categories"
    ON categories FOR SELECT
    TO anon, authenticated
    USING (true);
```

4. Try creating a category again

**Pros:**
- Simple, immediate fix
- Works with existing code
- No code changes needed

**Cons:**
- Less secure (any authenticated user can create categories)
- Better for development, not production

---

### Solution 2: Use Server Actions (BEST FOR PRODUCTION)

This keeps security tight by running privileged operations on the server.

**Steps:**

1. The server action file has already been created: `/app/src/lib/actions/categories.ts`

2. Update `/app/src/app/admin/categories/create/page.tsx`:

Find this line (around line 10):
```typescript
import { CategoryService } from '@/lib/services/categories'
```

Replace with:
```typescript
import { createCategoryAction } from '@/lib/actions/categories'
```

Then find this line (around line 145):
```typescript
const result = await CategoryService.createCategory(categoryData)
```

Replace with:
```typescript
const result = await createCategoryAction(categoryData)
```

3. For file uploads, update the `handleSubmit` function to use form data since Server Actions can't directly accept File objects. This is more complex - see detailed instructions below.

**Pros:**
- Secure - service role only used on server
- Production-ready
- Follows Next.js best practices

**Cons:**
- Requires code changes
- More complex for file uploads

---

### Solution 3: Set Admin Role for Your User

This makes the existing RLS policy work by giving your user admin privileges.

**Steps:**

1. Go to Supabase Dashboard SQL Editor
2. Find your user ID:

```sql
SELECT id, email, raw_user_meta_data 
FROM auth.users 
WHERE email = 'your-email@example.com';  -- Replace with your email
```

3. Set admin role (replace `YOUR_USER_ID` with the ID from step 2):

```sql
UPDATE auth.users 
SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    '{"role": "admin"}'::jsonb
WHERE id = 'YOUR_USER_ID';
```

4. Verify:

```sql
SELECT email, raw_user_meta_data->>'role' as role
FROM auth.users 
WHERE id = 'YOUR_USER_ID';
```

Should show `role: admin`

5. Log out and log back in to your admin dashboard

**Pros:**
- Keeps existing security model
- Works with current code

**Cons:**
- Still has the service role key issue on client-side
- Might not work if supabaseAdmin isn't configured correctly

---

### Solution 4: Temporarily Disable RLS (TESTING ONLY)

**⚠️ WARNING: This removes all security! Use only for testing!**

```sql
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
```

Test category creation, then immediately re-enable:

```sql
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
```

---

## Recommended Approach

**For immediate fix (Development):**
Use **Solution 1** - Update RLS policies to allow authenticated users

**For production:**
Implement **Solution 2** - Use Server Actions (already created for you)

---

## Detailed: Implementing Server Actions for File Uploads

The server action is already created, but file uploads need special handling. Here's the updated approach:

### Option A: Upload on Client, Create on Server (Simpler)

Keep current file upload logic (uploads directly to storage from client), use server action only for category creation.

This is what's currently implemented and should work fine.

### Option B: Full Server-Side Upload (More Secure)

Convert files to base64, send to server action, upload from server.

**Update `handleSubmit` in create page:**

```typescript
const handleSubmit = async (isDraft = false) => {
  try {
    setIsLoading(true)

    // ... validation ...

    // Convert files to base64 for server action
    let homepage_thumbnail_base64 = ''
    let homepage_video_base64 = ''
    let plp_square_thumbnail_base64 = ''

    if (formData.homepage_thumbnail_file) {
      homepage_thumbnail_base64 = await fileToBase64(formData.homepage_thumbnail_file)
    }

    if (formData.homepage_video_file) {
      homepage_video_base64 = await fileToBase64(formData.homepage_video_file)
    }

    if (formData.plp_square_thumbnail_file) {
      plp_square_thumbnail_base64 = await fileToBase64(formData.plp_square_thumbnail_file)
    }

    const result = await createCategoryAction({
      name: formData.name,
      slug: formData.slug,
      description: formData.description,
      parent_id: formData.parent_id || null,
      homepage_thumbnail_base64,
      homepage_video_base64,
      plp_square_thumbnail_base64,
      // ... other fields
    })

    if (result.success) {
      toast.success('Category created successfully')
      router.push('/admin/categories')
    } else {
      toast.error(result.error || 'Failed to create category')
    }
  } catch (error: any) {
    console.error('Error creating category:', error)
    toast.error(error.message || 'Failed to create category')
  } finally {
    setIsLoading(false)
  }
}

// Helper function
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
  })
}
```

This is more complex but more secure.

---

## Testing the Fix

After applying Solution 1 (RLS update):

1. Go to `/admin/categories/create`
2. Fill in all fields and upload images
3. Click "Create Category"
4. Should see success message
5. Verify in Supabase:

```sql
SELECT * FROM categories ORDER BY created_at DESC LIMIT 1;
```

---

## Troubleshooting

### Still getting RLS error?

Check if policies were applied:
```sql
SELECT policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'categories';
```

### Service role key not working?

Check environment variables are loaded:
```typescript
// Add this temporarily to your page
console.log('Service key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
```

If false on client-side, that's the problem - use Solution 1 or 2.

### Can't log in as admin?

Make sure you're logged in with the account you set admin role for.

---

## Summary

**Quick Fix:** Run Solution 1 SQL in Supabase (allows authenticated users to manage categories)

**Proper Fix:** Implement Solution 2 Server Actions (secure, production-ready)

**Current Status:** Code is ready, just need to update RLS policies in Supabase.

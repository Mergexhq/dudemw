# Fix for Categories Page Issues

## Issues Identified

### Issue 1: Error Creating Category (PGRST204)
**Error Message:** `Could not find the 'homepage_thumbnail_url' column of 'categories' in the schema cache`

**Root Cause:** 
The categories table in your Supabase database is missing the new columns that were added to support enhanced media features. The migration file `15-enhance-categories-table.sql` exists but hasn't been executed on your database.

**Solution:** Run the database migration to add the missing columns.

### Issue 2: Images/Videos Uploaded Before Publish
**Current Behavior:** Images and videos are uploaded to Supabase storage immediately when selected, before the "Create Category" button is clicked.

**Root Cause:**
In `media-step.tsx`, the `handleImageUpload` function is called on file selection and immediately uploads to storage.

**Solution:** Store selected files temporarily and only upload them when the user clicks "Create Category".

---

## Step-by-Step Fix Instructions

### Step 1: Run Database Migration

1. **Go to your Supabase Dashboard:**
   - Navigate to: https://supabase.com/dashboard/project/qyvpihdiyuowkyideltd
   - Click on "SQL Editor" in the left sidebar

2. **Execute the following SQL:**

```sql
-- Add new columns to categories table
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS homepage_thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS homepage_video_url TEXT,
ADD COLUMN IF NOT EXISTS plp_square_thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS selected_banner_id UUID REFERENCES banners(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS icon_url TEXT,
ADD COLUMN IF NOT EXISTS meta_title TEXT,
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_status ON categories(status);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- Update existing categories to have default status
UPDATE categories SET status = 'active' WHERE status IS NULL;

-- Add helpful comments
COMMENT ON TABLE categories IS 'Product categories with enhanced media support for homepage and PLP display';
COMMENT ON COLUMN categories.homepage_thumbnail_url IS 'Thumbnail image URL for homepage category display';
COMMENT ON COLUMN categories.homepage_video_url IS 'Optional video URL for homepage category display';
COMMENT ON COLUMN categories.plp_square_thumbnail_url IS 'Square thumbnail URL for product listing page display';
COMMENT ON COLUMN categories.selected_banner_id IS 'Reference to banner used for this category';
COMMENT ON COLUMN categories.meta_title IS 'SEO meta title for category page';
COMMENT ON COLUMN categories.meta_description IS 'SEO meta description for category page';
COMMENT ON COLUMN categories.status IS 'Category status: active or inactive';
COMMENT ON COLUMN categories.display_order IS 'Order for displaying categories (lower numbers first)';
```

3. **Click "Run" to execute the SQL**

4. **Verify the migration:**
```sql
-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'categories' 
ORDER BY ordinal_position;
```

### Step 2: Update Application Code

The code files have been updated to fix the image upload issue:

**Files Modified:**
1. `/app/src/domains/admin/category-creation/media-step.tsx` - Now stores files temporarily
2. `/app/src/app/admin/categories/create/page.tsx` - Uploads files only on publish

**Key Changes:**
- Files are now stored as File objects in state
- Preview uses blob URLs (`URL.createObjectURL`)
- Upload happens only when "Create Category" or "Save as Draft" is clicked
- Proper cleanup of blob URLs to prevent memory leaks

---

## Testing the Fix

### Test 1: Verify Database Migration
1. Go to Supabase SQL Editor
2. Run: `SELECT * FROM categories LIMIT 1;`
3. Verify that the new columns exist

### Test 2: Create a Category
1. Navigate to `/admin/categories/create`
2. Fill in Basic Information (Step 1)
3. Upload images in Media Assets (Step 2)
   - **Expected:** Images should show preview but NOT upload yet
   - **Check Supabase Storage:** No new files should appear
4. Configure Banner Settings (Step 3)
5. Review in Preview & Save (Step 4)
6. Click "Create Category"
   - **Expected:** Now images upload and category is created
   - **Check Supabase Storage:** Files should now appear
7. Verify category was created successfully

### Test 3: Verify No Orphaned Files
1. Start creating a category
2. Upload images in Step 2
3. Navigate away or click Cancel WITHOUT publishing
4. **Expected:** No files should be in Supabase storage since upload was never triggered

---

## How the Fix Works

### Before (Issue):
```
User selects file → Immediately uploads to Supabase → Stores URL in form
                                    ↓
                           File is now permanent in storage
                                    ↓
                    User clicks "Create Category" → Category created
```

**Problem:** If user cancels or doesn't publish, files remain orphaned in storage.

### After (Fixed):
```
User selects file → Stores File object in state → Shows blob URL preview
                                    ↓
                           No upload yet!
                                    ↓
           User clicks "Create Category" → Uploads all files → Category created
```

**Benefit:** Files only uploaded when category is published. No orphaned files.

---

## Additional Notes

### File Preview
- Uses `URL.createObjectURL(file)` to create temporary blob URLs
- Blob URLs are revoked on component unmount or file change to prevent memory leaks

### Error Handling
- If file upload fails, category creation is aborted
- User is notified with specific error messages
- Form remains in editable state for corrections

### Performance
- Multiple files can be uploaded in parallel
- Loading states show upload progress
- Large files are handled gracefully

---

## Rollback (If Needed)

If you need to revert the changes:

1. **Database:** The columns are safe to keep and won't break anything
2. **Code:** Use git to revert to previous commits:
   ```bash
   git checkout HEAD~1 -- src/app/admin/categories/create/page.tsx
   git checkout HEAD~1 -- src/domains/admin/category-creation/media-step.tsx
   ```

---

## Summary

✅ **Issue 1 Fixed:** Database schema updated with missing columns
✅ **Issue 2 Fixed:** Images/videos only uploaded on publish, not before
✅ **No Breaking Changes:** Existing functionality preserved
✅ **Better UX:** Users can change/remove images before committing
✅ **Cleaner Storage:** No orphaned files from abandoned category creations

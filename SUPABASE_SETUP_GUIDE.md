# Supabase Configuration Guide

## Error: "User not allowed" or Admin Operations Failing

If you're seeing errors like:
- `Error fetching categories for stats: {}`
- `Error fetching low stock alerts: {}`
- `User not allowed`
- `Admin access required`

This means your Supabase Service Role Key is either missing or not properly configured.

## Solution: Configure Supabase Service Role Key

### Step 1: Get Your Service Role Key

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click on **Settings** (gear icon in left sidebar)
4. Click on **API** 
5. Under **Project API keys**, find the **service_role** key (not the anon key!)
6. Click to reveal and copy the key

⚠️ **Important**: The service_role key has admin privileges and should NEVER be exposed to the client/browser. Only use it server-side!

### Step 2: Add to Environment Variables

Create or update your `.env.local` file in the root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Service Role Key (REQUIRED for admin operations)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Example:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: Restart Your Development Server

After adding the environment variables, restart your Next.js development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## What the Service Role Key Does

The Service Role Key (`SUPABASE_SERVICE_ROLE_KEY`) is used for:

- ✅ **Admin Operations**: Accessing auth.admin APIs like listing users
- ✅ **Bypassing RLS**: Row Level Security policies are bypassed
- ✅ **Full Database Access**: Complete read/write access to all tables
- ✅ **Category Statistics**: Fetching category data with product counts
- ✅ **Customer Management**: Listing and managing customer accounts
- ✅ **Inventory Management**: Managing stock levels and alerts
- ✅ **Order Management**: Full access to order data

## Security Best Practices

1. **Never commit** `.env.local` to version control
2. **Never expose** the service role key to the client-side code
3. **Only use** the service role key in:
   - Server-side API routes (`/api/*`)
   - Server Components
   - Server Actions
4. **Add** `.env.local` to your `.gitignore` file

## Troubleshooting

### Still getting errors after adding the key?

1. **Double-check the key**: Make sure you copied the **service_role** key, not the anon key
2. **Check spelling**: The environment variable must be exactly `SUPABASE_SERVICE_ROLE_KEY`
3. **Restart server**: Always restart after changing environment variables
4. **Clear cache**: Try clearing Next.js cache: `rm -rf .next`

### Where is the key being used?

The service role key is used in `/app/src/lib/supabase/supabase.ts`:

```typescript
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey, // Uses service key for admin ops
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
```

## Common Admin Operations

Once configured correctly, these operations will work:

- 📊 **Dashboard Statistics**: Category stats, customer stats, inventory stats
- 👥 **Customer Management**: View and manage all customers
- 📦 **Inventory Management**: Track stock, low stock alerts
- 📋 **Category Management**: CRUD operations on categories
- 🛒 **Order Management**: View and process all orders

## Need More Help?

If you're still experiencing issues:

1. Check your Supabase project is active and not paused
2. Verify your project URL is correct
3. Check Supabase dashboard logs for any errors
4. Ensure your database tables exist and have proper structure

---

**Important**: After fixing the configuration, all admin features should work correctly! 🎉

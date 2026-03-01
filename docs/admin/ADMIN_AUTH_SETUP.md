# Admin Authentication System - Setup Guide

## 📋 Overview

This guide will help you set up the security-first dual-auth system for Dude Men's Wears ecommerce platform. The system separates **store users** (customers) from **admin users** (staff, managers, admins, and super admins).

## 🔑 Key Features

- **Two Separate Auth Flows**: Store users and admin users
- **Role-Based Access Control (RBAC)**: Super Admin → Admin → Manager → Staff
- **No Admin Self-Signup**: Only super admins can create admin accounts
- **First-Time Setup Flow**: Secure super admin creation
- **Recovery System**: Super admin can recover access with recovery key
- **Approval System**: New admins require approval before access
- **Email Notifications**: Automatic invitations via Resend

## 🚀 Initial Setup

### Step 1: Database Setup

Run the SQL script to create necessary tables:

```bash
# Execute the admin auth tables SQL script in your Supabase SQL editor
cat /app/backend-implementation/07-create-admin-auth-tables.sql
```

This creates:
- `admin_profiles` table
- `admin_settings` table
- RLS policies
- Helper functions

### Step 2: Environment Variables

Add these variables to your `.env.local` file:

```env
# Admin Setup Key (used for first-time setup only)
ADMIN_SETUP_KEY=your-secure-random-key-here

# Supabase Service Role Key (required for admin operations)
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Resend API Key (for email notifications)
RESEND_API_KEY=your-resend-api-key

# Existing Supabase Keys
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**Important:** 
- Keep `ADMIN_SETUP_KEY` secure and secret
- Never commit it to version control
- Change it after completing initial setup

### Step 3: First-Time Admin Setup

1. Start your Next.js development server:
```bash
npm run dev
```

2. Navigate to the admin setup page:
```
http://localhost:3000/admin/setup
```

3. Fill in the form:
   - **Setup Key**: Enter the `ADMIN_SETUP_KEY` from your .env file
   - **Email**: Your super admin email
   - **Password**: Create a strong password (min 8 characters)

4. **CRITICAL**: Save your recovery key!
   - The system will generate a 32-character recovery key
   - This key is shown ONLY ONCE
   - Copy it and store it securely (password manager recommended)
   - Download the recovery key file as backup

5. Click "Continue to Login" and sign in with your credentials

## 🔐 Admin Routes

### Public Admin Routes (No Auth Required)

- `/admin/login` - Admin login page
- `/admin/setup` - First-time setup (disabled after completion)
- `/admin/recover` - Super admin recovery flow

### Protected Admin Routes (Auth Required)

- `/admin` - Admin dashboard
- `/admin/settings/users` - Admin user management
- All other `/admin/*` routes

## 👥 User Management

### Creating Admin Users

1. Log in as super admin
2. Navigate to: **Admin Dashboard → Settings → Admin Users**
3. Click "Create Admin User"
4. Fill in:
   - Email address
   - Role (Staff, Manager, or Admin)
   - Temporary password
5. The user will receive an email with login credentials
6. **Important**: New admins require approval before they can access the system

### Approving Admin Users

1. Go to: **Admin Dashboard → Settings → Admin Users**
2. Find users with "Pending Approval" status
3. Click the checkmark icon to approve
4. The user can now log in with their credentials

### Revoking Admin Access

1. Go to: **Admin Dashboard → Settings → Admin Users**
2. Find the active admin user
3. Click the X icon to revoke access
4. The user will be immediately logged out and unable to access admin panel

## 🔄 Recovery Flow

If a super admin forgets their password:

1. Navigate to: `/admin/recover`
2. Enter:
   - Super admin email
   - Recovery key (the one saved during setup)
3. Click "Recover Account"
4. Follow the password reset link provided
5. Create a new password

**Notes:**
- Recovery is only available for super admin accounts
- Recovery key never expires
- All admin sessions are invalidated on recovery

## 🛡️ Security Features

### Authentication
- ✅ Separate auth flows for store and admin
- ✅ Server-side session validation
- ✅ Middleware protection on all admin routes
- ✅ No admin self-signup capability

### Authorization
- ✅ Role-based access control (RBAC)
- ✅ Server-side permission checks
- ✅ RLS policies on database level
- ✅ Active status validation

### Recovery
- ✅ Hashed recovery key storage (SHA-256)
- ✅ Recovery key shown only once
- ✅ Super admin only recovery
- ✅ Session invalidation on recovery

### Audit Trail
- ✅ Admin approval tracking
- ✅ Created by / approved by relationships
- ✅ Timestamps on all operations

## 📊 Admin Role Hierarchy

```
Super Admin (highest)
    ↓
  Admin
    ↓
  Manager
    ↓
  Staff (lowest)
```

**Permissions:**

| Action | Super Admin | Admin | Manager | Staff |
|--------|------------|-------|---------|-------|
| Create Admins | ✅ | ❌ | ❌ | ❌ |
| Approve Admins | ✅ | ❌ | ❌ | ❌ |
| Revoke Access | ✅ | ❌ | ❌ | ❌ |
| Use Recovery | ✅ | ❌ | ❌ | ❌ |
| Access Dashboard | ✅ | ✅ | ✅ | ✅ |
| Manage Products | ✅ | ✅ | ✅ | Limited |
| Manage Orders | ✅ | ✅ | ✅ | Limited |
| Manage Settings | ✅ | ✅ | Limited | ❌ |

## 🔧 Troubleshooting

### Setup Page Shows "Setup Already Completed"

The system has already been initialized. To reset:

1. Run this SQL in Supabase:
```sql
UPDATE admin_settings SET setup_completed = false, recovery_key_hash = null;
DELETE FROM admin_profiles WHERE role = 'super_admin';
```

2. Revisit `/admin/setup`

### Admin Can't Log In

**Check:**
1. Is the admin account approved? (Check admin_profiles.is_active)
2. Does the admin profile exist in database?
3. Is the password correct?

**Fix:**
```sql
-- Approve admin manually
UPDATE admin_profiles 
SET is_active = true, approved_at = NOW() 
WHERE user_id = 'USER_ID_HERE';
```

### Recovery Not Working

**Check:**
1. Is the user a super admin?
2. Is the recovery key correct? (no spaces, correct format)
3. Is setup completed?

**Format:** `XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX`

### Email Not Sending

**Check:**
1. Is RESEND_API_KEY set correctly?
2. Is the from email verified in Resend?
3. Check application logs for errors

## 📝 Important Notes

1. **One Super Admin**: Create only ONE super admin during setup
2. **Recovery Key**: Store securely - cannot be retrieved later
3. **Setup Key**: Change after completing initial setup
4. **Service Role Key**: Required for admin operations - keep secret
5. **Email Domain**: Verify your sending domain in Resend for production

## 🎯 Next Steps

After setup:

1. ✅ Create additional admin users
2. ✅ Configure role-based permissions as needed
3. ✅ Set up email templates in Resend
4. ✅ Test recovery flow
5. ✅ Update admin approval process documentation for your team

## 📚 Related Documentation

- [Database Schema](/backend-implementation/02-create-tables.sql)
- [Admin Auth Tables](/backend-implementation/07-create-admin-auth-tables.sql)
- [Project Structure](/docs/PROJECT_STRUCTURE.md)
- [Middleware Configuration](/middleware.ts)

## 🆘 Support

For issues or questions:
- Check troubleshooting section above
- Review server logs in console
- Check Supabase Auth dashboard
- Verify RLS policies are active

---

**Version:** 1.0.0  
**Last Updated:** January 2025  
**Status:** Production Ready ✅

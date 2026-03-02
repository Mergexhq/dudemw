# 🔧 Supabase Email Authentication Fix Guide

## 🚨 Problem

**Issue**: Not receiving email verification links/OTPs during signup
- **Yesterday**: Was working, receiving verification links
- **Today**: No emails being received at all

## 🎯 Root Causes

This is typically caused by one of these issues:

### 1. **Supabase Email Rate Limits (Most Common)**
- Free tier has very restrictive limits (3 emails per hour)
- Development mode has similar restrictions
- Once limit is hit, emails stop completely

### 2. **Email Provider Not Configured**
- Using Supabase's default email (unreliable for production)
- Custom SMTP not set up properly

### 3. **Email Confirmation Settings**
- Email confirmation might be disabled in Supabase
- Wrong email templates configuration

---

## 🔍 Step 1: Check Supabase Email Settings

### A. Go to Supabase Dashboard

1. Visit: https://app.supabase.com
2. Select your project: `qyvpihdiyuowkyideltd`
3. Go to **Authentication** > **Providers** > **Email**

### B. Verify These Settings:

```yaml
✅ Email Provider: Enabled
✅ Confirm email: Enabled (IMPORTANT!)
✅ Secure email change: Enabled (recommended)

Email Templates:
✅ Confirm signup: Enabled
✅ Magic Link: Enabled (optional)
✅ Change Email Address: Enabled
✅ Reset Password: Enabled
```

### C. Check Email Rate Limits

1. Go to **Project Settings** > **Rate Limits**
2. Check if you've hit the email sending limit
3. If yes, wait an hour or upgrade plan

---

## 🔧 Step 2: Configure Custom Email Provider (Recommended)

You have **Resend** in your .env file. Let's configure it properly:

### A. Get Your Resend API Key

1. Go to: https://resend.com/api-keys
2. Create a new API key if needed
3. Copy the API key

### B. Configure Supabase to Use Resend

1. In Supabase Dashboard: **Project Settings** > **Authentication**
2. Scroll to **SMTP Settings**
3. Enable **Custom SMTP**
4. Enter these settings:

```
SMTP Host: smtp.resend.com
SMTP Port: 587 (or 465 for SSL)
SMTP Username: resend
SMTP Password: [Your Resend API Key]
Sender Email: noreply@yourdomain.com (must be verified in Resend)
Sender Name: Dude Mens Wear
```

### C. Verify Domain in Resend

1. Go to Resend Dashboard > **Domains**
2. Add your domain OR use Resend's test domain for development
3. Verify DNS records

---

## 🔧 Step 3: Fix Email Templates

### A. Update Email Templates in Supabase

1. Go to **Authentication** > **Email Templates**
2. For **Confirm Signup** template:

```html
<h2>Confirm your email</h2>
<p>Follow this link to confirm your email:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm Email</a></p>
<p>Or enter this code: {{ .Token }}</p>
```

3. Make sure the redirect URL is set correctly:
   - Go to **Authentication** > **URL Configuration**
   - Set **Site URL**: `http://localhost:3000` (for dev)
   - Set **Redirect URLs**: 
     ```
     http://localhost:3000/**
     http://localhost:3000/auth/callback
     http://localhost:3000/verify-otp
     ```

---

## 🔧 Step 4: Update Your Code for OTP

### Current Issue:
Your signup code redirects to `/verify-otp`, but Supabase sends a confirmation **link** not an OTP code.

### Two Solutions:

### **Option A: Use Email OTP (Recommended)**

Update your signup code to request OTP instead of link:

```typescript
// src/domains/auth/components/SignupPage.tsx
const { data, error: signUpError } = await supabase.auth.signUp({
  email: formData.email,
  password: formData.password,
  options: {
    data: {
      full_name: formData.name,
      phone: formData.phone,
    },
    emailRedirectTo: undefined, // Don't send link
    shouldCreateUser: true,
  },
})

// After signup, send OTP
if (data.user && !data.user.email_confirmed_at) {
  // Send OTP email
  await supabase.auth.signInWithOtp({
    email: formData.email,
  })
  router.push('/verify-otp?email=' + formData.email)
}
```

### **Option B: Use Magic Link (No Password)**

Replace password-based signup with magic link:

```typescript
const { data, error } = await supabase.auth.signInWithOtp({
  email: formData.email,
  options: {
    emailRedirectTo: 'http://localhost:3000/auth/callback',
    data: {
      full_name: formData.name,
      phone: formData.phone,
    }
  }
})
```

---

## 🔧 Step 5: Immediate Testing Solution

For immediate testing without email:

### A. Disable Email Confirmation (Temporary)

1. Supabase Dashboard > **Authentication** > **Providers** > **Email**
2. **Disable** "Confirm email"
3. Users can now signup without email verification

⚠️ **WARNING**: Only for testing! Re-enable for production.

### B. Manual Email Confirmation

You can manually confirm users in Supabase:

1. Go to **Authentication** > **Users**
2. Find the user
3. Click on them
4. Enable "Email Confirmed"

---

## 🔧 Step 6: Check Email Deliverability

### A. Test Email Sending

Create a test page to verify email is working:

```typescript
// Test at /app/src/app/test-email/page.tsx
const testEmail = async () => {
  const { data, error } = await supabase.auth.signInWithOtp({
    email: 'your-test@email.com'
  })
  
  console.log('Email sent:', data)
  console.log('Error:', error)
}
```

### B. Check Spam Folder

- Supabase default emails often go to spam
- Custom SMTP (Resend) has better deliverability

### C. Check Supabase Logs

1. Go to **Logs** > **Auth Logs**
2. Look for email sending events
3. Check for errors

---

## 📋 Quick Checklist

- [ ] Email confirmation is enabled in Supabase
- [ ] SMTP is configured (Resend or custom)
- [ ] Domain is verified in email provider
- [ ] Redirect URLs are set correctly
- [ ] Email templates are configured
- [ ] Not hitting rate limits
- [ ] Code uses correct auth method (OTP vs Link)
- [ ] Checked spam folder
- [ ] Tested with multiple email addresses

---

## 🚀 Recommended Setup (Production-Ready)

### 1. Use Resend as Email Provider
- Reliable delivery
- 100 emails/day free tier
- Easy to set up

### 2. Email Flow:
- **Signup**: Password + Email OTP verification
- **Login**: Password only (email already verified)
- **Password Reset**: Email OTP

### 3. Supabase Settings:
```yaml
Confirm email: Enabled
Double confirm email: Enabled
Secure email change: Enabled
Minimum password length: 8
```

---

## 🆘 Still Not Working?

### Debug Steps:

1. **Check Browser Console**
   ```javascript
   // Look for errors during signup
   ```

2. **Check Network Tab**
   - Look for auth API calls
   - Check response status

3. **Check Supabase Logs**
   - Auth logs show email events
   - Look for failures

4. **Test with Different Email**
   - Try Gmail, Outlook, etc.
   - Some providers block automated emails

5. **Verify Environment Variables**
   ```bash
   # Make sure .env.local is loaded
   console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
   ```

---

## 📝 Next Steps

1. Follow Step 1 to check current settings
2. Configure Resend (Step 2) for reliable email delivery
3. Update code to use OTP (Step 4)
4. Test thoroughly

Let me know which step you need help with!

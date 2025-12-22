# 🚀 Complete Resend Setup Guide (Free Tier)

## Step 1: Create Resend Account & Get API Key

### A. Sign Up for Resend

1. Go to: **https://resend.com**
2. Click **"Start Building"** or **"Sign Up"**
3. Sign up with your email or GitHub
4. Verify your email

### B. Get Your API Key

1. After login, you'll land on the dashboard
2. Click **"API Keys"** in the left sidebar
3. Click **"Create API Key"**
4. Name it: `Dude Menswear - Development`
5. **Copy the API key** (starts with `re_`)
   - ⚠️ **IMPORTANT**: Save it now! You can't see it again

**Example API Key format:**
```
re_123abc456def789ghi012jkl345mno678pqr
```

---

## Step 2: Verify Your Email Domain (2 Options)

### **Option A: Use Resend's Test Domain** (Fastest - 2 minutes)

✅ **Best for development/testing**
✅ No domain required
✅ Works immediately
⚠️ Can only send to verified emails

**Setup:**
1. In Resend Dashboard, go to **"Domains"**
2. You'll see: `onboarding.resend.dev` (already verified)
3. Click **"Add Email Address"**
4. Enter your test email (the one you'll use for testing)
5. Verify it via email link
6. ✅ Done! You can now send/receive test emails

**For Supabase, use:**
- **Sender Email**: `onboarding@resend.dev`
- **Reply-To**: Your verified email

---

### **Option B: Use Your Own Domain** (Best for production)

✅ Professional emails (noreply@dudemw.com)
✅ Better branding
⚠️ Requires domain access

**If you have a domain (dudemw.com):**

1. In Resend Dashboard, go to **"Domains"**
2. Click **"Add Domain"**
3. Enter your domain: `dudemw.com`
4. Resend will show DNS records to add:

```
Type: TXT
Name: @
Value: [Resend verification code]

Type: MX
Name: @
Value: feedback-smtp.us-east-1.amazonses.com
Priority: 10

Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@resend.dev
```

5. Add these records to your domain DNS settings
6. Wait 24-48 hours for verification
7. ✅ Once verified, use: `noreply@dudemw.com`

**For now, use Option A (Test Domain) to get started quickly!**

---

## Step 3: Configure Supabase to Use Resend

### A. Go to Supabase Dashboard

1. Visit: **https://app.supabase.com**
2. Select project: `qyvpihdiyuowkyideltd`
3. Go to: **Settings** (gear icon) > **Authentication**

### B. Scroll to "SMTP Settings"

Enable **"Enable Custom SMTP"**

### C. Enter Resend SMTP Configuration

```yaml
SMTP Host: smtp.resend.com
SMTP Port: 465
SMTP User: resend
SMTP Password: [Your Resend API Key - starts with re_]
Sender Email: onboarding@resend.dev
Sender Name: Dude Mens Wear
```

**Example Screenshot Structure:**
```
┌─────────────────────────────────────┐
│ ☑️ Enable Custom SMTP              │
├─────────────────────────────────────┤
│ Host:     smtp.resend.com          │
│ Port:     465                       │
│ User:     resend                    │
│ Password: re_123...                 │
│ Email:    onboarding@resend.dev    │
│ Name:     Dude Mens Wear           │
└─────────────────────────────────────┘
```

### D. Click **"Save"**

---

## Step 4: Configure Email Templates in Supabase

### A. Go to Email Templates

1. In Supabase: **Authentication** > **Email Templates**

### B. Update "Confirm Signup" Template

Replace with this OTP-friendly template:

```html
<h2>Welcome to Dude Mens Wear! 👔</h2>

<p>Hi there,</p>

<p>Thank you for signing up! To complete your registration, please verify your email address.</p>

<h3>Your Verification Code:</h3>

<div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
  {{ .Token }}
</div>

<p>This code will expire in <strong>10 minutes</strong>.</p>

<p>If you didn't create an account, please ignore this email.</p>

<hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">

<p style="color: #666; font-size: 12px;">
  Dude Mens Wear - Your Style, Our Pride<br>
  If you have any questions, contact us at support@dudemw.com
</p>
```

### C. Update "Magic Link" Template

```html
<h2>Sign in to Dude Mens Wear 👔</h2>

<p>Hi there,</p>

<p>Click the link below to sign in to your account:</p>

<div style="margin: 30px 0;">
  <a href="{{ .ConfirmationURL }}" 
     style="background: #dc2626; color: white; padding: 15px 30px; 
            text-decoration: none; border-radius: 8px; font-weight: bold;">
    Sign In to Account
  </a>
</div>

<p>Or use this verification code:</p>

<div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
  {{ .Token }}
</div>

<p>This link and code will expire in <strong>10 minutes</strong>.</p>

<p>If you didn't request this, please ignore this email.</p>

<hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">

<p style="color: #666; font-size: 12px;">
  Dude Mens Wear - Your Style, Our Pride<br>
  If you have any questions, contact us at support@dudemw.com
</p>
```

### D. Save All Templates

---

## Step 5: Update Supabase Email Settings

### A. Go to Authentication Providers

1. **Authentication** > **Providers** > **Email**

### B. Enable These Settings:

```yaml
✅ Enable email provider
✅ Confirm email
✅ Secure email change enabled
```

### C. Set Redirect URLs

Scroll down to **"Redirect URLs"** and add:

```
http://localhost:3000/*
http://localhost:3000/auth/callback
http://localhost:3000/verify-otp
https://your-production-domain.com/*
```

### D. Save Settings

---

## Step 6: Test Email Sending

### A. Quick Test in Supabase

1. Go to **Authentication** > **Users**
2. Click **"Invite User"**
3. Enter a test email
4. Check if email arrives

### B. Test OTP Flow

I'll create a test page for you to verify:

```typescript
// Test at: http://localhost:3000/test-email

const testOTP = async () => {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signInWithOtp({
    email: 'your-email@gmail.com'
  })
  
  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Email sent!', data)
  }
}
```

---

## 📋 Complete Setup Checklist

- [ ] Created Resend account
- [ ] Got API key (starts with `re_`)
- [ ] Verified test email in Resend (for testing)
- [ ] Configured SMTP in Supabase
  - [ ] Host: smtp.resend.com
  - [ ] Port: 465
  - [ ] User: resend
  - [ ] Password: [API Key]
- [ ] Updated email templates in Supabase
- [ ] Enabled email provider in Supabase
- [ ] Added redirect URLs
- [ ] Tested email sending

---

## 🎯 Expected Results

After setup:

✅ Signup sends OTP to email
✅ Login sends OTP to email  
✅ Emails arrive in inbox (not spam)
✅ OTP verification works
✅ 100 emails/day limit (plenty for development)

---

## 🆘 Troubleshooting

### "Failed to send email"

**Check:**
1. API key is correct in Supabase SMTP settings
2. Using `smtp.resend.com` (not `api.resend.com`)
3. Port is 465 (or try 587)
4. Email format: `onboarding@resend.dev`

### "Email not received"

**Check:**
1. Spam folder
2. Email is verified in Resend (for test domain)
3. Resend dashboard > Logs (shows sent emails)
4. Supabase logs > Auth logs (shows attempts)

### "Invalid sender email"

**Fix:**
1. Use `onboarding@resend.dev` for test domain
2. OR verify your own domain first
3. Make sure email matches domain in Resend

---

## 💰 Free Tier Limits

**Resend Free Tier:**
- ✅ 3,000 emails/month (~100/day)
- ✅ 1 domain
- ✅ Unlimited verified emails (for testing)
- ✅ All features included

**Perfect for:**
- Development
- Testing
- Small projects
- MVPs

**Upgrade when:**
- Need more than 3,000 emails/month
- Need multiple domains
- Going to production with high traffic

---

## 🚀 What's Next?

Once Resend is configured:

1. ✅ Email delivery will work reliably
2. ✅ I'll update your auth code to use OTP
3. ✅ Test signup and login flows
4. ✅ Deploy to production

**Ready to proceed?** 

Just provide your Resend API key and I'll configure everything!

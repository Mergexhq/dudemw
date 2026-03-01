# ⚡ Quick Start: Resend Setup (5 Minutes)

## 🎯 Goal
Get email authentication working in 5 minutes using Resend (free tier)

---

## 📝 Step-by-Step Checklist

### ✅ Step 1: Get Resend API Key (2 minutes)

1. **Go to:** https://resend.com
2. **Sign up** with email or GitHub
3. **Click:** "API Keys" in sidebar
4. **Click:** "Create API Key"
5. **Name it:** `Dude Menswear Dev`
6. **Copy the key** (starts with `re_`)
7. **Save it somewhere safe!**

Your API key looks like:
```
re_AbCd123EfGh456IjKl789MnOp012QrSt
```

---

### ✅ Step 2: Verify Test Email in Resend (1 minute)

1. In Resend dashboard, **click:** "Domains"
2. You'll see: `onboarding.resend.dev` (already there)
3. **Click:** "Add Email Address"
4. **Enter:** Your email (for testing)
5. **Check email** and click verification link
6. ✅ Done!

---

### ✅ Step 3: Configure Supabase (2 minutes)

1. **Go to:** https://app.supabase.com
2. **Select project:** `qyvpihdiyuowkyideltd`
3. **Click:** Settings (⚙️) > Authentication
4. **Scroll to:** "SMTP Settings"
5. **Enable:** "Enable Custom SMTP"
6. **Fill in:**

```
Host:     smtp.resend.com
Port:     465
User:     resend
Password: [PASTE YOUR RESEND API KEY]
Email:    onboarding@resend.dev
Name:     Dude Mens Wear
```

7. **Click:** Save
8. ✅ Done!

---

## 🧪 Test It Works

### Option A: Use Test Page (Easiest)

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Visit: http://localhost:3000/test-email

3. Enter your verified email

4. Click "Test OTP Email"

5. Check your inbox!

### Option B: Test Signup Flow

1. Go to: http://localhost:3000/signup

2. Fill in the form

3. Submit

4. Check email for verification code

---

## ✅ Success Checklist

You'll know it's working when:

- [ ] Resend API key created
- [ ] Test email verified in Resend
- [ ] SMTP configured in Supabase
- [ ] Test email received in inbox
- [ ] OTP code is visible in email

---

## 🎉 What You Get (Free Tier)

✅ **3,000 emails/month** (100/day)
✅ **Professional email delivery**
✅ **Better than Gmail/spam folders**
✅ **Perfect for development & testing**

---

## 🆘 Quick Troubleshooting

### "Email not received"

**Check:**
1. ✅ Email verified in Resend?
2. ✅ Check spam folder
3. ✅ API key correct in Supabase?
4. ✅ Using `onboarding@resend.dev`?

### "Failed to send"

**Check:**
1. ✅ Port is 465 (not 587)
2. ✅ Host is `smtp.resend.com`
3. ✅ Username is `resend`
4. ✅ Password is your API key

### "Invalid sender"

**Fix:**
1. ✅ Use `onboarding@resend.dev`
2. ✅ OR verify your own domain first

---

## 📞 Ready to Proceed?

Once you complete these 3 steps, reply with:

**"Resend configured! API key is: re_xxxxx"**

Then I'll:
1. ✅ Update your auth code for OTP
2. ✅ Test the full flow
3. ✅ Make sure everything works perfectly!

---

## 💡 Pro Tips

1. **Save API key in .env.local** (I'll help with this)
2. **Use test emails** verified in Resend
3. **Check Resend logs** if issues occur (Dashboard > Logs)
4. **Upgrade later** when you need more than 3,000 emails/month

Let's do this! 🚀

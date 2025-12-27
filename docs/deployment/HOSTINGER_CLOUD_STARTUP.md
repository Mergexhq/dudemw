# 🚀 Hostinger Cloud Startup Deployment Guide

**Deploy Dude Men's Wears to Hostinger Cloud Startup Plan**

---

## 📋 About Hostinger Cloud Startup

Hostinger Cloud Startup uses **automated Node.js Web Apps** deployment:
- ✅ Auto-detects Next.js framework
- ✅ Runs builds automatically (`npm run build`)
- ✅ Handles serving without manual configuration
- ✅ Deploys via GitHub integration or ZIP uploads
- ✅ No PM2, Passenger, or custom server configs needed

---

## ⚡ Quick Deployment Steps

### 1️⃣ Prepare Your Repository

Ensure your repository has:
- `package.json` with proper scripts
- `hostinger.json` configuration file
- `.env.example` as reference for environment variables

### 2️⃣ Connect GitHub Repository

1. Log in to **[Hostinger hPanel](https://hpanel.hostinger.com)**
2. Go to **Websites → Your Website → Advanced → Git**
3. Connect your GitHub repository
4. Select branch: `main`

### 3️⃣ Configure Environment Variables

In hPanel, go to **Websites → Advanced → Environment Variables**

Add these required variables:

```env
# Application
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production

# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_BUCKET=product-images

# Admin Setup (REQUIRED)
ADMIN_SETUP_KEY=your-secure-random-key

# Razorpay (REQUIRED)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key
RAZORPAY_KEY_SECRET=your_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Optional - Caching
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token

# Optional - Email
RESEND_API_KEY=re_your_key

# Contact Info
NEXT_PUBLIC_WHATSAPP_NUMBER=+919876543210
NEXT_PUBLIC_SUPPORT_EMAIL=support@yourdomain.com
```

### 4️⃣ Deploy

**Option A: Auto-Deploy (Recommended)**
- Push changes to your GitHub `main` branch
- Hostinger automatically builds and deploys

**Option B: Manual Deploy**
1. In hPanel, go to **Git** section
2. Click **"Pull and Deploy"**

### 5️⃣ Verify Deployment

Visit your domain:
- Homepage: `https://yourdomain.com`
- Admin Setup: `https://yourdomain.com/admin/setup`

---

## 🔧 Configuration Files

### `hostinger.json`
```json
{
  "framework": "nextjs",
  "buildCommand": "npm install && npm run build",
  "startCommand": "npm start",
  "nodeVersion": "20",
  "port": 3000,
  "env": {
    "NODE_ENV": "production"
  }
}
```

### `package.json` Scripts
```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  }
}
```

---

## 🔐 Post-Deployment Setup

### Configure Supabase Auth

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Your Project → **Authentication → URL Configuration**
3. Set:
   - **Site URL:** `https://yourdomain.com`
   - **Redirect URLs:** `https://yourdomain.com/auth/callback`

### Configure Razorpay Webhooks

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. **Settings → Webhooks → Create New**
3. Configure:
   - **URL:** `https://yourdomain.com/api/webhook/razorpay`
   - **Events:** payment.authorized, payment.captured, payment.failed, order.paid
4. Copy webhook secret to environment variables

### Create Admin Account

1. Visit: `https://yourdomain.com/admin/setup`
2. Enter your `ADMIN_SETUP_KEY`
3. Create admin credentials
4. Login at: `https://yourdomain.com/admin/login`

---

## 🐛 Troubleshooting

### Build Fails

Check build logs in hPanel → Git section. Common issues:
- Missing environment variables
- TypeScript errors (run `npm run lint` locally first)

### Site Shows Error

1. Verify all environment variables are set correctly
2. Check that Supabase credentials are valid
3. Ensure SSL certificate is active

### Auth Not Working

1. Verify Supabase redirect URLs include your domain
2. Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Payments Not Working

1. Verify Razorpay credentials (test vs live keys)
2. Check webhook URL is correct
3. Ensure `RAZORPAY_WEBHOOK_SECRET` matches dashboard

---

## 📚 Related Documentation

- [Supabase Setup Guide](../SUPABASE_SETUP_GUIDE.md)
- [Subdomain Setup](./SUBDOMAIN_SETUP.md)
- [Project Structure](../PROJECT_STRUCTURE.md)

---

## ✅ Deployment Checklist

- [ ] GitHub repository connected
- [ ] All environment variables configured
- [ ] SSL certificate active
- [ ] Supabase auth URLs configured
- [ ] Razorpay webhooks configured
- [ ] Admin account created
- [ ] Test purchase flow verified

---

**Happy Deploying! 🎉**

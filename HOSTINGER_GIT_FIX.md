# 🚀 Hostinger Git Auto-Import - Quick Fix Guide

## ✅ Configuration Files Added

To fix the "Unsupported framework or invalid project structure" error, the following configuration files have been added/updated:

### 1. **next.config.js** (JavaScript version)
- Added alongside `next.config.ts` for better framework detection
- Hostinger's auto-detection works better with `.js` config files

### 2. **Node.js Version Files**
- `.nvmrc` - Specifies Node.js version 20.11.0
- `.node-version` - Alternative Node.js version specification
- These help Hostinger use the correct Node.js version

### 3. **hostinger.json**
- Custom configuration file with framework metadata
- Explicitly declares this as a Next.js project
- Specifies build and start commands

### 4. **.hostingerrc**
- Additional configuration file for Hostinger detection
- Contains environment and build specifications

### 5. **package.json** (Updated)
- Added `engines` field specifying Node.js >= 18.17.0
- Ensures Hostinger uses compatible Node.js version

## 📋 Steps to Deploy on Hostinger

### Step 1: Push Changes to GitHub

```bash
git add .
git commit -m "Add Hostinger configuration files for Git auto-import"
git push origin main
```

### Step 2: Try Git Import Again

1. Go to **Hostinger hPanel**
2. Navigate to **Website Builder** or **Git Deployment** section
3. Click **"Select Git repository to import"**
4. Select your repository: `dudemw`
5. The framework should now be **automatically detected as Next.js**

### Step 3: Configure Environment Variables

After successful import, add these environment variables in Hostinger:

#### **Required Variables:**

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_BUCKET=product-images
NEXT_PUBLIC_APP_URL=https://yourdomain.com
ADMIN_SETUP_KEY=your_secret_admin_key
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
NODE_ENV=production
```

#### **Optional But Recommended:**

```env
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
RESEND_API_KEY=your_resend_key
NEXT_PUBLIC_WHATSAPP_NUMBER=+919876543210
NEXT_PUBLIC_SUPPORT_EMAIL=support@dudemw.com
```

### Step 4: Deploy

1. Hostinger will automatically:
   - Install dependencies (`npm install`)
   - Build the project (`npm run build`)
   - Start the application (`npm start`)

2. Your app will be available at your Hostinger domain

## 🔧 Alternative: Manual Deployment (If Auto-Import Still Fails)

If the Git auto-import still doesn't work, you can deploy manually via SSH:

### 1. Connect via SSH

```bash
ssh username@yourdomain.com -p 65002
```

### 2. Clone Repository

```bash
cd ~/domains/yourdomain.com/public_html
git clone https://github.com/Melvinkheturus/dudemw.git .
```

### 3. Install & Build

```bash
npm install
npm run build
```

### 4. Configure Environment Variables

```bash
nano .env.production
# Paste your environment variables
# Save: CTRL+X, then Y, then ENTER
```

### 5. Start with PM2

```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🐛 Troubleshooting

### Issue: Still showing "Unsupported framework"

**Solution 1:** Ensure all new files are committed and pushed to GitHub
```bash
git status
git add .
git commit -m "Update configuration"
git push
```

**Solution 2:** Try selecting a different branch and then back to `main`

**Solution 3:** Contact Hostinger support with this message:
> "I'm trying to deploy a Next.js 16 application. I've added next.config.js, .nvmrc, and package.json with engines field. The repository is: https://github.com/Melvinkheturus/dudemw"

### Issue: Build fails after import

**Check Node.js version in Hostinger:**
- Should be >= 18.17.0
- Preferably 20.11.0

**Check build logs:**
- Look for missing dependencies
- Ensure environment variables are set

### Issue: App starts but doesn't work

**Verify environment variables:**
- All `NEXT_PUBLIC_*` variables are set
- `NEXT_PUBLIC_APP_URL` points to your actual domain
- Database credentials are correct

## 📚 Additional Resources

- **Hostinger Documentation:** https://www.hostinger.com/support
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Project Structure:** See `docs/PROJECT_STRUCTURE.md`
- **Full Deployment Guide:** See `DEPLOYMENT.md`

## ✅ What Changed

### Files Created:
- ✅ `next.config.js` - JavaScript config for better detection
- ✅ `.nvmrc` - Node.js version specification
- ✅ `.node-version` - Alternative Node version file
- ✅ `hostinger.json` - Framework metadata
- ✅ `.hostingerrc` - Hostinger configuration

### Files Modified:
- ✅ `package.json` - Added engines field

### Why These Changes Work:

1. **Multiple Config Formats:** Some hosting providers detect `.js` configs better than `.ts`
2. **Version Specification:** Ensures correct Node.js version is used
3. **Explicit Framework Declaration:** Removes ambiguity in auto-detection
4. **Standard Files:** `.nvmrc` and `.node-version` are industry-standard

## 🎯 Next Steps

1. ✅ **Commit and push** all changes to GitHub
2. ✅ **Try Git import** again in Hostinger
3. ✅ **Set environment variables** after successful import
4. ✅ **Test your application** once deployed
5. ✅ **Set up custom domain** if needed
6. ✅ **Configure SSL certificate** (free with Hostinger)

---

**Need Help?** Check the full deployment guide in `DEPLOYMENT.md` or contact Hostinger support.

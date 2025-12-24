# 🚀 QUICK START - Fix Admin Subdomain in 5 Minutes

## The Problem
`admin.dudemw.com` shows "Hostinger Parked Domain" instead of admin dashboard.

## The Solution (3 Simple Steps)

### Step 1: Upload/Pull Files to Hostinger (SSH)

```bash
# SSH into your server
ssh your_username@dudemw.com -p 65002
cd ~/domains/dudemw.com/public_html

# Pull latest changes (if using git)
git pull origin main

# If uploading manually, ensure these files are updated:
# - server.js (new file)
# - .env.production (new file)
# - .htaccess (updated)
# - ecosystem.config.js (updated)
```

### Step 2: Check Subdomain Settings in Hostinger hPanel

**CRITICAL:** Go to Hostinger hPanel and verify:

1. **Navigate to:** Websites → Your Site → Advanced → Subdomains

2. **Verify admin.dudemw.com has these settings:**
   ```
   Subdomain: admin
   Domain: dudemw.com
   Document Root: /home/YOUR_USERNAME/domains/dudemw.com/public_html
   ```

3. **If Document Root is different (like /public_html/admin):**
   - Click "Edit" button
   - Change to main domain path: `/home/YOUR_USERNAME/domains/dudemw.com/public_html`
   - Save
   - **Wait 2-3 minutes**

4. **Verify SSL is installed:**
   - Go to: Advanced → SSL
   - admin.dudemw.com should have SSL certificate
   - If not, click "Install SSL" and wait 5-15 minutes

### Step 3: Deploy the Fix

```bash
# Run the deployment script
./deploy-subdomain-fix.sh

# This script will:
# ✅ Stop PM2
# ✅ Install dependencies
# ✅ Build application
# ✅ Start with custom server
# ✅ Show status

# If script doesn't exist or has permission issues, run manually:
pm2 stop dudemw
pm2 delete dudemw
npm install
npm run build
mkdir -p logs
chmod +x server.js
pm2 start ecosystem.config.js
pm2 save
```

## ✅ Testing (2 Minutes)

### Browser Test:
1. Clear browser cache completely
2. Open: `https://admin.dudemw.com`
3. **Expected:** Shows admin login page (NOT parked page)

### Command Line Test:
```bash
# Test locally with Host header
curl -I -H "Host: admin.dudemw.com" http://localhost:3000
# Should return: HTTP/1.1 200 or 302

# Test publicly
curl -I https://admin.dudemw.com
# Should return: HTTP/2 200 or 302
```

### Check Logs:
```bash
pm2 logs dudemw --lines 30

# Should see:
# > Ready on http://0.0.0.0:3000
# > Main domain: dudemw.com
# > Admin subdomain: admin.dudemw.com
# [Server] Admin subdomain request: admin.dudemw.com/
```

## 🐛 Still Not Working?

### Run Diagnostic Script:
```bash
./verify-subdomain.sh

# This will check:
# ✅ Required files exist
# ✅ PM2 is running
# ✅ Port 3000 is listening
# ✅ DNS resolves
# ✅ Configuration is correct
```

### Most Common Issue: Wrong Document Root

**Problem:** Subdomain pointing to different directory

**Fix in Hostinger hPanel:**
1. Go to: Subdomains
2. Click "Edit" on admin.dudemw.com
3. Change Document Root to match main domain exactly:
   ```
   /home/YOUR_USERNAME/domains/dudemw.com/public_html
   ```
4. Save and wait 2-3 minutes

### Second Most Common: Cache Issues

**Fix:**
1. In Hostinger hPanel → Performance → Clear Cache
2. Clear browser cache/cookies completely
3. Test in incognito mode
4. Wait 5-10 minutes for propagation

## 📞 Need Help?

### Option 1: Contact Hostinger Support
Open live chat in hPanel and say:

```
"My admin subdomain (admin.dudemw.com) is showing a parked domain page.

The subdomain should point to the same directory as my main domain:
/home/YOUR_USERNAME/domains/dudemw.com/public_html

My Node.js app is running on port 3000 and .htaccess is configured to proxy requests.

Can you verify the subdomain document root is correct and that .htaccess is being processed?"
```

### Option 2: Detailed Troubleshooting
See `SUBDOMAIN_FIX_GUIDE.md` for complete troubleshooting steps.

## 📋 What Was Fixed?

1. **Custom Server** (`server.js`)
   - Properly handles subdomain detection
   - Reads Host header from multiple sources

2. **Updated .htaccess**
   - Now passes Host header to Node.js app
   - Enables proper subdomain routing

3. **Environment Variables** (`.env.production`)
   - Cookie domain set to `.dudemw.com` for cross-subdomain auth
   - All Supabase credentials included

4. **PM2 Configuration**
   - Uses custom server instead of `npm start`
   - Better logging for debugging

## 🎯 Success Criteria

You'll know it's working when:

✅ `admin.dudemw.com` shows admin login page  
✅ `admin.dudemw.com/setup` shows admin setup form  
✅ PM2 logs show: "Admin subdomain request"  
✅ No more "Parked Domain" page  

## 🔄 After It Works

1. **Create Admin Account:**
   - Go to: `https://admin.dudemw.com/setup`
   - Enter setup key from `.env.production`
   - Create super admin account

2. **Test Authentication:**
   - Login at: `https://admin.dudemw.com/login`
   - Verify dashboard loads
   - Check that cookies work across subdomains

3. **Monitor Logs:**
   ```bash
   pm2 logs dudemw
   ```

---

**That's it!** Your admin subdomain should now be working. If you still see the parked page after following these steps, the issue is most likely in Hostinger's subdomain configuration (document root).

📖 For detailed troubleshooting, see: `SUBDOMAIN_FIX_GUIDE.md`

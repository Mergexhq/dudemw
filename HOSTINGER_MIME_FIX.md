# 🔧 HOSTINGER DEPLOYMENT FIX - MIME Type Issue

## 🚨 Problem Identified

Your Next.js app on Hostinger is failing because JavaScript files are being served with the wrong MIME type:

```
Error: Refused to execute script from 'https://dudemw.com/_next/static/chunks/d328adcbae8cba19.js' 
because its MIME type ('text/plain') is not executable
```

**Root Cause:** Hostinger's Apache server is serving static JavaScript files with `text/plain` instead of `application/javascript` MIME type.

---

## ✅ Solution Implemented

### 1. Updated `next.config.js`
- Added `output: 'standalone'` for better Hostinger compatibility
- This creates a standalone server that better handles static files

### 2. Created Proper `.htaccess` File
The new `.htaccess` file includes:
- ✅ Correct MIME type definitions for JavaScript files
- ✅ Direct serving of `_next/static/*` files with proper types
- ✅ Reverse proxy configuration for dynamic routes
- ✅ Security headers
- ✅ Compression and caching

### 3. Created Deployment Fix Script
- `scripts/hostinger-fix-deployment.sh` - Automated fix script

---

## 🚀 How to Fix Your Deployment

### Option A: Via SSH (Recommended - Fastest Fix)

1. **Connect to your Hostinger server via SSH:**
```bash
ssh username@dudemw.com -p 65002
# (Use your actual SSH port from Hostinger)
```

2. **Navigate to your project directory:**
```bash
cd ~/domains/dudemw.com/public_html
# (Adjust path based on your Hostinger setup)
```

3. **Pull the latest fixes:**
```bash
git pull origin main
```

4. **Run the fix script:**
```bash
chmod +x scripts/hostinger-fix-deployment.sh
./scripts/hostinger-fix-deployment.sh
```

The script will:
- Clean previous build
- Install dependencies
- Rebuild with standalone output
- Apply the fixed .htaccess
- Restart PM2 with the updated configuration

5. **Verify the fix:**
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs dudemw --lines 50

# Test the site
curl -I https://dudemw.com/_next/static/chunks/webpack-c5dd44c751fe34d6.js
# Should show: Content-Type: application/javascript
```

---

### Option B: Via Git Auto-Import (Slower)

If you're using Hostinger's Git auto-import feature:

1. **Push changes to GitHub:**
```bash
git add .
git commit -m "Fix: Add standalone output and proper .htaccess for Hostinger MIME types"
git push origin main
```

2. **Trigger redeploy in Hostinger:**
- Go to Hostinger hPanel
- Navigate to Git section
- Click "Pull" or "Redeploy"

3. **After deployment, SSH into server and restart:**
```bash
ssh username@dudemw.com -p 65002
cd ~/domains/dudemw.com/public_html
pm2 restart dudemw
pm2 logs dudemw
```

---

### Option C: Manual File Upload (If SSH Not Available)

1. **Download the updated `.htaccess` file from your repository**

2. **Upload via Hostinger File Manager or FTP:**
- Navigate to `public_html` directory
- Replace the existing `.htaccess` file
- Ensure file permissions are set to 644

3. **Rebuild the project locally:**
```bash
npm run build
```

4. **Upload the entire `.next` folder to your server**
- This replaces the incorrectly served files

5. **Restart your application via Hostinger hPanel**

---

## 🧪 Verification Steps

After applying the fix, verify:

### 1. Check MIME Types
Open your browser console (F12) and reload https://dudemw.com:
- JavaScript files should load without MIME type errors
- Check Network tab: `.js` files should show `Content-Type: application/javascript`

### 2. Test Static Files
```bash
# From your local machine or SSH
curl -I https://dudemw.com/_next/static/chunks/webpack-c5dd44c751fe34d6.js

# Should return:
# Content-Type: application/javascript  ✅
# Status: 200 OK  ✅
```

### 3. Check Application
- Visit https://dudemw.com
- Homepage should load without errors
- Check browser console - no 404 or MIME type errors
- Login page should display correctly

### 4. Monitor PM2
```bash
pm2 status
# Should show: dudemw | online

pm2 logs dudemw --lines 100
# Should show no critical errors
```

---

## 🔍 Common Issues & Solutions

### Issue 1: `.htaccess` not being read

**Symptoms:** Changes don't take effect

**Solution:**
```bash
# Check if mod_rewrite is enabled
# In Hostinger hPanel → Advanced → .htaccess Editor
# Ensure "Enable .htaccess" is turned ON

# Verify .htaccess exists in correct location
ls -la ~/domains/dudemw.com/public_html/.htaccess

# Check file permissions
chmod 644 ~/domains/dudemw.com/public_html/.htaccess
```

### Issue 2: PM2 not running

**Symptoms:** Site shows 503 error

**Solution:**
```bash
# Check PM2 status
pm2 status

# If not running, start it
pm2 start ecosystem.config.js

# If errors, check logs
pm2 logs dudemw --lines 100

# Restart if needed
pm2 restart dudemw
```

### Issue 3: Still getting MIME type errors

**Symptoms:** JavaScript still served as text/plain

**Solution:**
```bash
# Clear Hostinger cache
# In hPanel → Website → Speed → Clear Cache

# Clear browser cache
# Ctrl+Shift+Delete (Chrome/Firefox)

# Hard reload the page
# Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

# Verify .htaccess is actually being used
# Add a test redirect at the top of .htaccess:
# RewriteRule ^test$ /index.html [R=301,L]
# Then visit: https://dudemw.com/test
# If it redirects, .htaccess is working
```

### Issue 4: 500 Internal Server Error

**Symptoms:** Pages show 500 error

**Solution:**
```bash
# Check PM2 logs for errors
pm2 logs dudemw --lines 100

# Check environment variables
pm2 env dudemw

# Verify all required env vars are set
cat .env.production

# Common missing vars:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - NEXT_PUBLIC_APP_URL

# Restart after fixing env vars
pm2 restart dudemw
```

### Issue 5: Changes not reflecting

**Solution:**
```bash
# Full rebuild and restart
cd ~/domains/dudemw.com/public_html
rm -rf .next
npm run build
pm2 restart dudemw

# Wait 30 seconds, then test
curl -I https://dudemw.com
```

---

## 📋 Key Changes Made

### File: `next.config.js`
```javascript
// Added standalone output
output: 'standalone',  // NEW LINE
```

### File: `.htaccess` (NEW/REPLACED)
Key sections:
1. **MIME Type Definitions:**
```apache
<IfModule mod_mime.c>
  AddType application/javascript .js
  AddType application/javascript .mjs
  ...
</IfModule>
```

2. **Static File Serving:**
```apache
# Serve _next/static files directly
RewriteCond %{REQUEST_URI} ^/_next/static/
RewriteRule ^(.*)$ $1 [L]
```

3. **Content-Type Headers:**
```apache
<FilesMatch "\.(js|mjs)$">
  Header set Content-Type "application/javascript"
</FilesMatch>
```

---

## 🎯 What This Fix Does

1. **MIME Type Fix:**
   - Forces Apache to serve `.js` files with `application/javascript` content type
   - Prevents browser from rejecting scripts

2. **Static File Handling:**
   - Serves `_next/static/*` files directly (faster)
   - Applies correct content types to all static assets

3. **Standalone Mode:**
   - Next.js builds a self-contained server
   - Better compatibility with Hostinger's setup

4. **Reverse Proxy:**
   - Dynamic routes still go through Next.js server
   - Static files bypass the proxy (performance improvement)

---

## 🆘 Still Having Issues?

If the problem persists after trying all solutions:

### Collect Debug Information:

```bash
# 1. Check PM2 status and logs
pm2 status
pm2 logs dudemw --lines 200 > pm2-logs.txt

# 2. Check Apache error logs (if accessible)
tail -n 100 ~/logs/error.log

# 3. Test static file serving
curl -I https://dudemw.com/_next/static/chunks/webpack-c5dd44c751fe34d6.js > curl-test.txt

# 4. Check .htaccess location
ls -la ~/domains/dudemw.com/public_html/.htaccess

# 5. Verify build output
ls -la .next/static/chunks/ | head -20
```

### Contact Information:

Share the debug information with:
1. **Hostinger Support** - They can check Apache configuration
2. **Your Development Team** - For custom fixes

---

## ✅ Success Criteria

Your deployment is fixed when:
- ✅ https://dudemw.com loads without errors
- ✅ No MIME type errors in browser console
- ✅ JavaScript files return `Content-Type: application/javascript`
- ✅ Login page displays correctly
- ✅ All pages are accessible
- ✅ PM2 shows status as "online"

---

## 📚 Additional Resources

- [Next.js Standalone Mode](https://nextjs.org/docs/app/api-reference/next-config-js/output)
- [Apache mod_mime Documentation](https://httpd.apache.org/docs/2.4/mod/mod_mime.html)
- [Hostinger Node.js Hosting Guide](https://support.hostinger.com/en/articles/6242208-how-to-deploy-a-node-js-application)

---

**Last Updated:** Now
**Status:** Ready to deploy
**Estimated Fix Time:** 5-10 minutes via SSH

# 🔧 COMPLETE FIX FOR ADMIN SUBDOMAIN ISSUE

## 🎯 Problem
The admin subdomain (admin.dudemw.com) shows "Hostinger Parked Domain" page instead of the admin dashboard.

## 🔍 Root Causes Identified
1. **Subdomain Document Root**: May be pointing to wrong directory or default public_html
2. **Host Header Not Passed**: Reverse proxy not passing the Host header to Node.js app
3. **Missing Custom Server**: Need custom server to properly handle subdomain requests
4. **Environment Variables**: May not be loaded from hPanel settings

## ✅ Solution Applied

### 1. Created Custom Server (`server.js`)
- Properly handles both main domain and admin subdomain
- Reads Host header from multiple sources (Hostinger compatibility)
- Logs subdomain detection for debugging

### 2. Updated `.htaccess`
- Now passes the original Host header to Node.js app via X-Forwarded-Host
- This allows middleware to properly detect admin subdomain

### 3. Created `.env.production`
- All environment variables now in file (not relying on hPanel alone)
- Includes all Supabase credentials
- Proper cookie domain configuration (.dudemw.com)

### 4. Updated PM2 Configuration
- Now uses custom server.js instead of `npm start`
- Better logging and error handling

---

## 📋 DEPLOYMENT STEPS (YOU NEED TO DO THIS ON HOSTINGER)

### Step 1: SSH into Your Hostinger Server

```bash
ssh your_username@dudemw.com -p 65002
cd ~/domains/dudemw.com/public_html
```

### Step 2: Pull Latest Changes

```bash
# Pull the latest code (with fixes)
git pull origin main

# Or if you're uploading files manually:
# Upload: server.js, .env.production, .htaccess, ecosystem.config.js
```

### Step 3: Verify Subdomain Configuration in Hostinger

1. **Log in to Hostinger hPanel** (https://hpanel.hostinger.com)

2. **Go to: Websites → Your Site → Advanced → Subdomains**

3. **Check admin.dudemw.com exists with these settings:**
   ```
   Subdomain: admin
   Domain: dudemw.com
   Document Root: /home/YOUR_USERNAME/domains/dudemw.com/public_html
   ```
   
   ⚠️ **CRITICAL**: The document root MUST be the SAME as your main domain!
   
4. **If Document Root is different:**
   - Click "Edit" on admin.dudemw.com
   - Change Document Root to: `/home/YOUR_USERNAME/domains/dudemw.com/public_html`
   - Save changes
   - Wait 2-3 minutes for propagation

### Step 4: Verify SSL Certificate

1. **In hPanel → Advanced → SSL**
2. **Ensure SSL is installed for:**
   - dudemw.com ✅
   - admin.dudemw.com ✅
3. **If admin subdomain SSL is missing:**
   - Select admin.dudemw.com
   - Click "Install SSL"
   - Wait 5-15 minutes

### Step 5: Check Node.js Application Settings

1. **In hPanel → Advanced → Node.js**
2. **Verify Application Settings:**
   ```
   Application Mode: Production
   Application Root: /home/YOUR_USERNAME/domains/dudemw.com/public_html
   Application URL: https://dudemw.com
   Node.js Version: 20.x
   ```
3. **Application Startup File**: Can be left empty (PM2 handles this)

### Step 6: Stop PM2 and Rebuild

```bash
# Stop existing PM2 process
pm2 stop dudemw
pm2 delete dudemw

# Install dependencies (if any new ones)
npm install

# Rebuild the application
npm run build

# Verify build succeeded
ls -la .next/standalone/
```

### Step 7: Start with Custom Server

```bash
# Make server.js executable
chmod +x server.js

# Create logs directory if it doesn't exist
mkdir -p logs

# Start application with PM2 using new config
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Enable PM2 to start on server reboot (run the command it provides)
pm2 startup
```

### Step 8: Verify Application is Running

```bash
# Check PM2 status
pm2 status

# Should show:
# ┌─────┬──────────┬─────────┬─────────┬─────────┬──────────┐
# │ id  │ name     │ mode    │ ↺       │ status  │ cpu      │
# ├─────┼──────────┼─────────┼─────────┼─────────┼──────────┤
# │ 0   │ dudemw   │ fork    │ 0       │ online  │ 0%       │
# └─────┴──────────┴─────────┴─────────┴─────────┴──────────┘

# Check logs for subdomain detection
pm2 logs dudemw --lines 30

# You should see:
# > Ready on http://0.0.0.0:3000
# > Environment: production
# > Main domain: dudemw.com
# > Admin subdomain: admin.dudemw.com
```

### Step 9: Test Subdomain Access

```bash
# Test main domain locally
curl -I http://localhost:3000
# Should return: HTTP/1.1 200 OK

# Test admin subdomain locally (with Host header)
curl -I -H "Host: admin.dudemw.com" http://localhost:3000
# Should return: HTTP/1.1 200 OK or 302 (redirect to login)

# Test main domain publicly
curl -I https://dudemw.com
# Should return: HTTP/2 200

# Test admin subdomain publicly
curl -I https://admin.dudemw.com
# Should return: HTTP/2 200 or 302 (redirect to login)
```

### Step 10: Browser Testing

1. **Clear your browser cache and cookies completely**

2. **Test Main Domain:**
   - Open: `https://dudemw.com`
   - Should load the store homepage ✅

3. **Test Admin Subdomain:**
   - Open: `https://admin.dudemw.com`
   - Should redirect to: `https://admin.dudemw.com/login` ✅
   - Should NOT show "Parked Domain" page ❌

4. **Test Admin Setup:**
   - Open: `https://admin.dudemw.com/setup`
   - Should show admin setup page ✅

5. **Test Direct Admin Access on Main Domain:**
   - Open: `https://dudemw.com/admin`
   - Should redirect to: `https://admin.dudemw.com` ✅

---

## 🐛 TROUBLESHOOTING

### Issue 1: Still Shows "Parked Domain" Page

**Symptoms:** admin.dudemw.com still shows Hostinger parked page

**Solutions:**

```bash
# 1. Check subdomain document root in hPanel
# Must be: /home/YOUR_USERNAME/domains/dudemw.com/public_html

# 2. Check .htaccess exists and is correct
cat ~/domains/dudemw.com/public_html/.htaccess | grep "X-Forwarded-Host"
# Should contain: [P,L,H=X-Forwarded-Host:%{HTTP_HOST}]

# 3. Check if subdomain DNS has propagated
nslookup admin.dudemw.com
# Should return an IP address

# 4. Clear Hostinger cache
# In hPanel → Performance → Clear Cache

# 5. Wait 5-10 minutes for DNS/cache propagation

# 6. Test with different browser or incognito mode
```

### Issue 2: Application Not Starting

**Symptoms:** PM2 shows "errored" or "stopped" status

**Solutions:**

```bash
# 1. Check PM2 logs
pm2 logs dudemw --lines 50

# 2. Check for build errors
npm run build

# 3. Check for missing dependencies
npm install

# 4. Check Node.js version
node -v  # Should be v20.x.x or higher

# 5. Verify server.js exists
ls -la server.js

# 6. Test server manually
node server.js
# Should print: > Ready on http://0.0.0.0:3000

# 7. Restart PM2
pm2 restart dudemw
```

### Issue 3: 502 Bad Gateway Error

**Symptoms:** Browser shows "502 Bad Gateway" or "Service Unavailable"

**Solutions:**

```bash
# 1. Check if app is running
pm2 status

# 2. Check if port 3000 is listening
netstat -tuln | grep 3000
# Should show: tcp 0.0.0.0:3000

# 3. Test local connection
curl http://localhost:3000
# Should return HTML

# 4. Check .htaccess proxy settings
cat .htaccess | grep "RewriteRule"
# Should show proxy to 127.0.0.1:3000

# 5. Restart Apache/web server (if you have access)
# Or contact Hostinger support to restart web server
```

### Issue 4: Middleware Not Detecting Subdomain

**Symptoms:** Admin pages return 404 or don't load correctly

**Solutions:**

```bash
# 1. Check PM2 logs for middleware messages
pm2 logs dudemw | grep "Middleware"

# 2. Should see messages like:
# [Middleware] Admin subdomain detected: admin.dudemw.com Path: /
# [Middleware] Rewriting admin subdomain path: / -> /admin/

# 3. If no messages, check .htaccess
cat .htaccess | grep "X-Forwarded-Host"

# 4. Verify environment variables are loaded
pm2 logs dudemw | grep "NEXT_PUBLIC_ADMIN_URL"

# 5. Check server.js is logging host headers
pm2 logs dudemw | grep "Admin subdomain request"

# 6. Restart with verbose logging
pm2 restart dudemw --log-date-format="YYYY-MM-DD HH:mm:ss"
```

### Issue 5: SSL Certificate Issues

**Symptoms:** Browser shows "Not Secure" or SSL warning

**Solutions:**

```bash
# 1. Check SSL certificate in hPanel
# Advanced → SSL → Verify admin.dudemw.com has SSL

# 2. Force SSL reinstall
# In hPanel → SSL → Select admin.dudemw.com → Reinstall SSL

# 3. Check SSL certificate validity
openssl s_client -connect admin.dudemw.com:443 -servername admin.dudemw.com | grep "Verify return code"
# Should show: Verify return code: 0 (ok)

# 4. Check .htaccess HTTPS redirect
cat .htaccess | grep "HTTPS"
# Should have: RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI}

# 5. Wait 15-30 minutes for SSL activation
```

### Issue 6: Authentication Not Working Across Subdomains

**Symptoms:** Logged out when switching between dudemw.com and admin.dudemw.com

**Solutions:**

```bash
# 1. Verify cookie domain in .env.production
cat .env.production | grep COOKIE_DOMAIN
# Should be: NEXT_PUBLIC_COOKIE_DOMAIN=.dudemw.com
# Note the leading dot (.)

# 2. Check browser cookies (DevTools → Application → Cookies)
# Should see cookies with domain ".dudemw.com"

# 3. Restart application to reload env vars
pm2 restart dudemw

# 4. Clear all cookies and test again

# 5. Check middleware cookie settings
cat middleware.ts | grep "cookie"
```

---

## 📊 VERIFICATION CHECKLIST

After deployment, verify all these work:

### Main Domain (dudemw.com)
- [ ] Homepage loads correctly
- [ ] Can browse products
- [ ] Can add items to cart
- [ ] Authentication works

### Admin Subdomain (admin.dudemw.com)
- [ ] `https://admin.dudemw.com` redirects to `/login` (if not authenticated)
- [ ] `https://admin.dudemw.com/setup` shows setup page
- [ ] `https://admin.dudemw.com/login` shows login page
- [ ] Can create admin account via setup
- [ ] Can log in with admin credentials
- [ ] Dashboard loads after login

### Routing
- [ ] `https://dudemw.com/admin` redirects to `https://admin.dudemw.com`
- [ ] Static files (_next/static/*) load correctly
- [ ] Images load correctly
- [ ] API routes work

### SSL
- [ ] Both domains show valid SSL (padlock icon)
- [ ] No mixed content warnings
- [ ] Certificate covers both dudemw.com and admin.dudemw.com

### Authentication
- [ ] Cookies work across subdomains
- [ ] Logging in on admin subdomain maintains session
- [ ] Can access all admin pages after login

---

## 🆘 STILL NOT WORKING?

If admin subdomain still shows parked page after following all steps:

### Contact Hostinger Support

1. **Open Live Chat in hPanel**
2. **Provide this information:**
   ```
   Issue: Admin subdomain (admin.dudemw.com) showing parked domain page
   
   Configuration:
   - Subdomain: admin.dudemw.com
   - Document Root: /home/YOUR_USERNAME/domains/dudemw.com/public_html
   - Same directory as main domain (dudemw.com)
   - SSL installed
   - Node.js app running on port 3000
   - .htaccess configured with proxy
   
   Request:
   - Verify subdomain document root is correct
   - Verify .htaccess is being processed for subdomain
   - Verify web server is proxying requests to port 3000
   - Check if there's a separate public_html for subdomain that needs to be removed
   ```

### Debug Mode

```bash
# Enable detailed logging
pm2 restart dudemw --log-date-format="YYYY-MM-DD HH:mm:ss Z"

# Monitor logs in real-time
pm2 logs dudemw

# In another terminal, test subdomain
curl -v -H "Host: admin.dudemw.com" http://localhost:3000/

# Check Apache/web server logs (if accessible)
tail -f ~/logs/access.log
tail -f ~/logs/error.log
```

---

## 📝 SUMMARY OF CHANGES

### Files Modified/Created:
1. ✅ `server.js` - Custom server for subdomain handling
2. ✅ `.env.production` - Production environment variables
3. ✅ `.htaccess` - Updated to pass Host header
4. ✅ `ecosystem.config.js` - Updated to use custom server

### Hostinger Configuration Required:
1. ✅ Subdomain document root → Same as main domain
2. ✅ SSL certificate → Installed for admin subdomain
3. ✅ Node.js application → Running on port 3000

### Testing:
1. ✅ Main domain works
2. ✅ Admin subdomain accessible
3. ✅ Subdomain routing works
4. ✅ Authentication works across subdomains

---

## 🎉 SUCCESS INDICATORS

You'll know it's working when:

✅ `https://admin.dudemw.com` shows admin login (not parked page)  
✅ `https://admin.dudemw.com/setup` shows admin setup form  
✅ PM2 logs show: "Admin subdomain request: admin.dudemw.com"  
✅ Browser DevTools shows cookies with domain ".dudemw.com"  
✅ Can access all admin pages after login  

---

## 📞 NEED MORE HELP?

If you're still facing issues after following this guide:

1. **Share PM2 logs:**
   ```bash
   pm2 logs dudemw --lines 100 > logs.txt
   ```

2. **Share configuration:**
   ```bash
   cat .env.production | grep -v "SECRET\|KEY" > config.txt
   cat .htaccess > htaccess.txt
   pm2 status > pm2-status.txt
   ```

3. **Share browser console errors:**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Copy any red errors

4. **Share subdomain hPanel settings:**
   - Screenshot of subdomain configuration in hPanel
   - Document root path
   - SSL status

---

*Last Updated: December 2024*  
*Status: Ready for Deployment*

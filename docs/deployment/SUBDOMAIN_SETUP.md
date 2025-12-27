# 🌐 Subdomain Setup Guide for Hostinger Cloud Startup

**Configure admin.dudemw.com subdomain on Hostinger Cloud Startup**

---

## 📋 Overview

Your Dude Men's Wears platform uses subdomain-based routing:

- **Main Store:** `dudemw.com` - Customer-facing e-commerce store
- **Admin Dashboard:** `admin.dudemw.com` - Admin panel and management

This setup provides:
- ✅ Clean URL separation (better security)
- ✅ Independent authentication contexts
- ✅ Better SEO (admin pages not indexed)
- ✅ Professional appearance

---

## 🎯 How It Works

The middleware detects the subdomain from the `host` header:
- Admin subdomain requests are internally rewritten to `/admin/*` routes
- Main domain blocks direct `/admin` access (redirects to subdomain)
- Cookies are shared across subdomains using `.dudemw.com` domain

---

## 🚀 Step-by-Step Setup

### Step 1: Create Subdomain in Hostinger

1. **Log in to Hostinger hPanel** → https://hpanel.hostinger.com

2. **Navigate to Subdomains**
   - Go to **Websites** → Select your website
   - Go to **Advanced** → **Subdomains**

3. **Create Admin Subdomain**
   - Click **"Create Subdomain"**
   - Subdomain: `admin`
   - Domain: `dudemw.com`
   - Document Root: Same as main domain
   - Click **"Create"**

4. **Verify Subdomain Creation**
   ```bash
   # Check DNS propagation (may take 5-30 minutes)
   nslookup admin.dudemw.com
   ```

### Step 2: Configure SSL for Subdomain

1. In hPanel, go to **Advanced → SSL**
2. Select domain: `admin.dudemw.com`
3. Click **"Install SSL"**
4. Wait 5-15 minutes for activation

### Step 3: Configure Environment Variables

In hPanel → **Advanced → Environment Variables**, add:

```env
# Main application URL
NEXT_PUBLIC_APP_URL=https://dudemw.com

# Admin subdomain configuration
NEXT_PUBLIC_ADMIN_URL=https://admin.dudemw.com
NEXT_PUBLIC_MAIN_DOMAIN=dudemw.com
NEXT_PUBLIC_ADMIN_SUBDOMAIN=admin

# Cookie domain (with leading dot for cross-subdomain sharing)
NEXT_PUBLIC_COOKIE_DOMAIN=.dudemw.com
```

### Step 4: Redeploy Application

Push changes to GitHub or trigger manual deploy in hPanel.

---

## ✅ Verification

### Test Main Store (dudemw.com)

- `https://dudemw.com` → Store homepage
- `https://dudemw.com/admin` → Redirects to `https://admin.dudemw.com`

### Test Admin Subdomain (admin.dudemw.com)

- `https://admin.dudemw.com` → Redirects to login (if not authenticated)
- `https://admin.dudemw.com/setup` → Admin setup page
- `https://admin.dudemw.com/login` → Admin login page

---

## 🔧 Troubleshooting

### Subdomain returns 404

1. Check DNS propagation: `nslookup admin.dudemw.com`
2. Verify subdomain in hPanel → Subdomains
3. Ensure document root matches main domain

### SSL certificate invalid

1. In hPanel → SSL → Install SSL for `admin.dudemw.com`
2. Wait 5-15 minutes for activation

### Authentication not working across subdomains

1. Verify `NEXT_PUBLIC_COOKIE_DOMAIN=.dudemw.com` (note the leading dot)
2. Redeploy application

### Admin redirects not working

1. Check environment variables are set correctly
2. Verify middleware.ts has subdomain detection logic
3. Redeploy application

---

## 📝 Environment Variables Summary

```env
NEXT_PUBLIC_APP_URL=https://dudemw.com
NEXT_PUBLIC_ADMIN_URL=https://admin.dudemw.com
NEXT_PUBLIC_MAIN_DOMAIN=dudemw.com
NEXT_PUBLIC_ADMIN_SUBDOMAIN=admin
NEXT_PUBLIC_COOKIE_DOMAIN=.dudemw.com
```

---

## ✅ Success Checklist

- [ ] Subdomain created in Hostinger hPanel
- [ ] SSL certificate installed for subdomain
- [ ] Environment variables configured
- [ ] Application redeployed
- [ ] Main store accessible
- [ ] Admin subdomain accessible
- [ ] Authentication works across subdomains

---

**🎊 Your subdomain is now configured!**

- **Store:** https://dudemw.com
- **Admin:** https://admin.dudemw.com

# ✅ Production Deployment Checklist

**Complete this checklist before going live with Dude Men's Wears**

---

## 🔧 Pre-Deployment Setup

### Hostinger Configuration
- [ ] Hostinger Business Plan active
- [ ] Node.js 20.x enabled in hPanel
- [ ] SSH access enabled and tested
- [ ] Domain configured and pointing to Hostinger
- [ ] SSL certificate installed and active
- [ ] Git integration configured (optional, but recommended)

### External Services Setup
- [ ] **Supabase Account**
  - [ ] Project created
  - [ ] Database tables created (run migrations)
  - [ ] Storage bucket `product-images` created
  - [ ] Storage bucket set to public
  - [ ] API keys noted (URL, Anon Key, Service Role Key)
  - [ ] Row Level Security (RLS) policies enabled

- [ ] **Razorpay Account**
  - [ ] Account created and verified
  - [ ] Test keys obtained
  - [ ] Live keys obtained (for production)
  - [ ] Business details completed

- [ ] **Optional Services**
  - [ ] Upstash Redis account (recommended for caching)
  - [ ] Resend account (for email notifications)
  - [ ] Google Analytics ID (for tracking)

---

## 📦 Code Preparation

### Repository Setup
- [ ] All code pushed to GitHub
- [ ] Repository accessible from Hostinger
- [ ] `.gitignore` properly configured
- [ ] `.env.example` file created with all required variables
- [ ] No sensitive data in repository

### Environment Variables
- [ ] `.env.production` created on server
- [ ] All required variables filled:
  - [ ] `NEXT_PUBLIC_APP_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `SUPABASE_BUCKET`
  - [ ] `NEXT_PUBLIC_RAZORPAY_KEY_ID` (test keys first)
  - [ ] `RAZORPAY_KEY_SECRET` (test keys first)
  - [ ] `ADMIN_SETUP_KEY` (strong, unique key)
- [ ] Optional variables configured:
  - [ ] `UPSTASH_REDIS_REST_URL`
  - [ ] `UPSTASH_REDIS_REST_TOKEN`
  - [ ] `RESEND_API_KEY`
  - [ ] Contact information variables

### Configuration Files
- [ ] `next.config.js` optimized for production
- [ ] `ecosystem.config.js` properly configured for PM2
- [ ] `.hostingerrc` contains correct Node.js version
- [ ] `package.json` has correct build scripts

---

## 🚀 Deployment Steps

### Server Setup
- [ ] SSH access working
- [ ] Node.js 20+ installed and accessible
- [ ] npm version 9+ available
- [ ] PM2 installed globally (`npm install -g pm2`)
- [ ] Repository cloned to correct directory
- [ ] Correct file permissions set

### Build Process
- [ ] Dependencies installed (`npm install --production`)
- [ ] Build completed successfully (`npm run build`)
- [ ] `.next` directory created
- [ ] `.next/standalone` directory exists (if using standalone mode)
- [ ] No build errors or warnings

### PM2 Configuration
- [ ] Logs directory created (`mkdir -p logs`)
- [ ] Application started (`pm2 start ecosystem.config.js`)
- [ ] Application status is "online" (`pm2 status`)
- [ ] PM2 configuration saved (`pm2 save`)
- [ ] PM2 startup configured (`pm2 startup`)
- [ ] Auto-restart on crash enabled

### Network & Access
- [ ] Application responding on localhost:3000
- [ ] Public domain accessible via HTTPS
- [ ] SSL certificate valid and trusted
- [ ] No mixed content warnings
- [ ] `.htaccess` configured (if needed)

---

## ⚙️ Post-Deployment Configuration

### Supabase Configuration
- [ ] Site URL updated to production domain
- [ ] Redirect URLs added:
  - [ ] `https://yourdomain.com/auth/callback`
  - [ ] `https://yourdomain.com/admin/callback`
- [ ] Storage policies configured
- [ ] Database connection tested from production

### Razorpay Configuration
- [ ] Webhook URL configured: `https://yourdomain.com/api/webhook/razorpay`
- [ ] Webhook secret generated and added to `.env.production`
- [ ] Active events selected:
  - [ ] payment.authorized
  - [ ] payment.captured
  - [ ] payment.failed
  - [ ] order.paid
- [ ] Test payment completed successfully
- [ ] Production domain added to Razorpay allowed domains

### Admin Setup
- [ ] Admin setup page accessible: `/admin/setup`
- [ ] Admin account created with strong password
- [ ] Admin login working: `/admin/login`
- [ ] Admin dashboard accessible
- [ ] All admin features tested

---

## 🧪 Testing & Verification

### Functionality Testing
- [ ] **Homepage**
  - [ ] Loads without errors
  - [ ] All sections display correctly
  - [ ] Images load properly
  - [ ] Navigation works

- [ ] **Authentication**
  - [ ] User signup works
  - [ ] Email verification works (if enabled)
  - [ ] Login works
  - [ ] Logout works
  - [ ] Password reset works

- [ ] **Product Catalog**
  - [ ] Products page loads
  - [ ] Product images display
  - [ ] Product details page works
  - [ ] Search functionality works
  - [ ] Filters work correctly
  - [ ] Categories load properly
  - [ ] Collections display correctly

- [ ] **Shopping Cart**
  - [ ] Add to cart works
  - [ ] Update quantity works
  - [ ] Remove item works
  - [ ] Cart persists across pages
  - [ ] Cart syncs for logged-in users

- [ ] **Wishlist**
  - [ ] Add to wishlist works
  - [ ] Remove from wishlist works
  - [ ] Wishlist persists

- [ ] **Checkout Process**
  - [ ] Checkout page loads
  - [ ] Address form works
  - [ ] Validation works correctly
  - [ ] Razorpay payment modal opens
  - [ ] Test payment succeeds
  - [ ] Order confirmation displays
  - [ ] Order saved to database

- [ ] **User Profile**
  - [ ] Profile page accessible
  - [ ] Order history displays
  - [ ] Address management works
  - [ ] Profile updates work

- [ ] **Admin Dashboard**
  - [ ] Dashboard loads with correct data
  - [ ] Product management works (CRUD)
  - [ ] Category management works
  - [ ] Collection management works
  - [ ] Banner management works
  - [ ] Order management works
  - [ ] Customer list displays
  - [ ] Settings can be updated
  - [ ] Image uploads work

### Performance Testing
- [ ] Homepage loads in < 3 seconds
- [ ] Product pages load quickly
- [ ] Images optimized and load fast
- [ ] No JavaScript errors in console
- [ ] No CSS rendering issues
- [ ] Mobile performance good
- [ ] Lighthouse Performance score > 80

### Cross-Browser Testing
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Chrome (Android)
- [ ] Mobile Safari (iOS)

### Mobile Responsiveness
- [ ] Mobile navigation works
- [ ] All pages responsive
- [ ] Touch interactions work
- [ ] Forms usable on mobile
- [ ] Checkout works on mobile
- [ ] Images scale properly

### Security Testing
- [ ] HTTPS enforced (no HTTP access)
- [ ] SSL certificate valid
- [ ] Admin routes protected
- [ ] API endpoints secured
- [ ] Environment variables not exposed
- [ ] No console errors exposing sensitive data
- [ ] XSS protection working
- [ ] CSRF protection enabled

---

## 📊 Monitoring Setup

### Application Monitoring
- [ ] PM2 monitoring active (`pm2 monit`)
- [ ] PM2 logs configured and rotating
- [ ] Error logging working
- [ ] Application uptime tracked

### Performance Monitoring
- [ ] Google Analytics configured (optional)
- [ ] Page load times monitored
- [ ] API response times acceptable
- [ ] Database query performance good

### Error Tracking
- [ ] PM2 error logs accessible
- [ ] Application errors logged
- [ ] Critical errors trigger alerts (optional)

---

## 🔄 Deployment Automation

### Git Auto-Deploy (Recommended)
- [ ] Git integration configured in hPanel
- [ ] Auto-deploy on push enabled
- [ ] `deploy.sh` script tested
- [ ] Deployment notifications set up (optional)

### Deployment Verification
- [ ] `verify-deployment.sh` script works
- [ ] All verification checks pass
- [ ] Deployment process documented

---

## 📝 Content & Data

### Database Content
- [ ] Initial products added
- [ ] Product images uploaded
- [ ] Categories created
- [ ] Collections created
- [ ] Banners created
- [ ] Test data removed (if any)

### Store Configuration
- [ ] Store name and description set
- [ ] Contact information updated
- [ ] Social media links added
- [ ] Payment settings configured
- [ ] Shipping zones configured
- [ ] Tax settings configured
- [ ] Store policies added:
  - [ ] Privacy Policy
  - [ ] Terms of Service
  - [ ] Refund Policy
  - [ ] Shipping Policy

---

## 🎯 SEO & Marketing

### SEO Setup
- [ ] Meta tags configured
- [ ] Open Graph tags set
- [ ] Twitter Card tags set
- [ ] Sitemap accessible (`/sitemap.xml`)
- [ ] robots.txt configured
- [ ] Structured data added
- [ ] Page titles optimized
- [ ] Meta descriptions written

### Marketing Setup
- [ ] Google Analytics tracking (if configured)
- [ ] Facebook Pixel (optional)
- [ ] Google Search Console configured
- [ ] Social media profiles ready
- [ ] Email marketing set up (optional)

---

## 🔐 Security Hardening

### Server Security
- [ ] SSH keys configured (password-less login)
- [ ] Firewall configured
- [ ] Unnecessary ports closed
- [ ] Regular security updates scheduled

### Application Security
- [ ] Strong admin password set
- [ ] `ADMIN_SETUP_KEY` is complex and unique
- [ ] Database RLS policies enabled
- [ ] API rate limiting configured (optional)
- [ ] Security headers configured

---

## 📋 Documentation

### Internal Documentation
- [ ] Deployment process documented
- [ ] Environment variables documented
- [ ] Server access details saved securely
- [ ] Third-party credentials saved securely
- [ ] Troubleshooting guide available

### User Documentation
- [ ] Admin user guide available
- [ ] Store management guide available
- [ ] Customer support information ready

---

## 🚦 Go-Live Decision

### Final Checks
- [ ] All critical tests passing
- [ ] No major bugs or issues
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Backup strategy in place
- [ ] Rollback plan ready
- [ ] Support team ready

### When Ready for Real Payments
- [ ] Switch to Razorpay LIVE keys
- [ ] Update webhook to production
- [ ] Test live payment (small amount)
- [ ] Verify order processing
- [ ] Enable payment notifications
- [ ] Update refund policies

---

## 🎉 Post-Launch

### Immediate Tasks (Day 1)
- [ ] Monitor application logs
- [ ] Check for errors
- [ ] Verify orders processing correctly
- [ ] Monitor payment gateway
- [ ] Check website accessibility
- [ ] Monitor performance

### First Week
- [ ] Review analytics daily
- [ ] Monitor customer feedback
- [ ] Fix any reported issues
- [ ] Optimize performance
- [ ] Back up database

### Ongoing
- [ ] Weekly log reviews
- [ ] Monthly dependency updates
- [ ] Regular backups
- [ ] Performance monitoring
- [ ] Security updates
- [ ] Content updates

---

## 📞 Emergency Contacts

**In Case of Issues:**
- Hostinger Support: Live chat in hPanel
- Supabase Support: https://supabase.com/support
- Razorpay Support: https://razorpay.com/support
- Developer: [Your contact info]

**Key Commands for Emergencies:**
```bash
# Restart application
pm2 restart dudemw

# View logs
pm2 logs dudemw

# Rollback code
git reset --hard <previous-commit>
./deploy.sh

# Stop application
pm2 stop dudemw
```

---

## ✅ Final Sign-Off

**Deployment Completed By:** _________________

**Date:** _________________

**Deployment URL:** _________________

**Notes:** 
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

**🎊 Congratulations! Your Dude Men's Wears e-commerce platform is now live!**

*Keep this checklist for future deployments and updates.*

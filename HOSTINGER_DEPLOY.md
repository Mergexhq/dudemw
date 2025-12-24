# 🚀 Hostinger Production Deployment Guide

**Complete guide for deploying Dude Men's Wears to Hostinger Business Plan with Auto-Git Integration**

---

## 📋 Prerequisites

Before starting, ensure you have:

- ✅ **Hostinger Business Plan** (or higher) with:
  - Node.js 20.x enabled
  - SSH access activated
  - Git integration available
  - SSL certificate (free with Hostinger)

- ✅ **Required Accounts & Credentials:**
  - Supabase account (database + storage)
  - Razorpay account (test keys minimum)
  - Domain name configured with SSL

- ✅ **GitHub Repository:**
  - Code pushed to GitHub
  - Repository accessible from Hostinger

---

## 🎯 Quick Start (5 Minutes)

If you're already familiar with Hostinger deployments:

```bash
# 1. SSH into your Hostinger server
ssh username@yourdomain.com -p 65002

# 2. Navigate to your domain directory
cd ~/domains/yourdomain.com/public_html

# 3. Clone repository (if not using auto-deploy)
git clone https://github.com/Melvinkheturus/dudemw.git .

# 4. Create environment file
cp .env.example .env.production
nano .env.production  # Fill in your credentials

# 5. Install and build
npm install --production
npm run build

# 6. Start with PM2
mkdir -p logs
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# 7. Verify
pm2 status
curl http://localhost:3000
```

✅ **Done! Your app should be running.**

---

## 📖 Detailed Step-by-Step Guide

### Step 1: Configure Hostinger Environment

#### 1.1 Enable Node.js Application

1. Log in to **[Hostinger hPanel](https://hpanel.hostinger.com)**
2. Go to **Advanced → Node.js**
3. Click **"Create Application"**
4. Configure:
   ```
   Application Mode: Production
   Application Root: /home/username/domains/yourdomain.com/public_html
   Application URL: https://yourdomain.com
   Node.js Version: 20.x
   Application Startup File: Leave empty (PM2 will handle this)
   ```
5. Click **"Create"**

#### 1.2 Configure Subdomain for Admin Dashboard

**Important:** This application uses subdomain-based routing:
- Main Store: `dudemw.com`
- Admin Dashboard: `admin.dudemw.com`

1. In hPanel, go to **Advanced → Subdomains**
2. Click **"Create Subdomain"**
3. Configure:
   ```
   Subdomain: admin
   Domain: dudemw.com
   Document Root: /home/username/domains/dudemw.com/public_html
   ```
   ⚠️ **Use the SAME directory as main domain**
4. Click **"Create"**

**📖 See [SUBDOMAIN_SETUP.md](./SUBDOMAIN_SETUP.md) for complete subdomain configuration guide**

#### 1.3 Enable SSH Access

1. In hPanel, go to **Advanced → SSH Access**
2. Click **"Enable SSH"**
3. Note your SSH credentials:
   ```
   Host: yourdomain.com (or IP address)
   Port: 65002 (may vary)
   Username: your_username
   Password: your_password
   ```

#### 1.4 Configure SSL Certificate

1. Go to **Advanced → SSL**
2. Install SSL for **main domain** (`dudemw.com`):
   - Select your domain
   - Click **"Install SSL"** (Free SSL available)
3. Install SSL for **admin subdomain** (`admin.dudemw.com`):
   - Select `admin.dudemw.com`
   - Click **"Install SSL"**
4. Wait 5-15 minutes for activation
5. Verify HTTPS works:
   - Visit `https://dudemw.com`
   - Visit `https://admin.dudemw.com`

---

### Step 2: Set Up Git Auto-Deploy (Recommended)

#### 2.1 Configure Git in hPanel

1. Go to **Advanced → Git**
2. Click **"Create Repository"**
3. Fill in:
   ```
   Repository URL: https://github.com/Melvinkheturus/dudemw.git
   Branch: main
   Target Directory: /home/username/domains/yourdomain.com/public_html
   ```
4. If private repo, add SSH key or access token
5. Click **"Create"**

#### 2.2 Set Up Deployment Script

1. SSH into your server:
   ```bash
   ssh username@yourdomain.com -p 65002
   ```

2. Navigate to your directory:
   ```bash
   cd ~/domains/yourdomain.com/public_html
   ```

3. The `deploy.sh` script is already in your repository. Make it executable:
   ```bash
   chmod +x deploy.sh
   ```

4. Configure Git webhook (optional - for automatic deployments):
   ```bash
   # In hPanel Git section, enable webhook
   # Webhook will run deploy.sh on every push
   ```

---

### Step 3: Configure Environment Variables

#### 3.1 Create Production Environment File

```bash
# SSH into server
cd ~/domains/yourdomain.com/public_html

# Copy example file
cp .env.example .env.production

# Edit with your credentials
nano .env.production
```

#### 3.2 Required Environment Variables

```env
# Application URLs
NEXT_PUBLIC_APP_URL=https://dudemw.com
NODE_ENV=production

# Admin Subdomain Configuration
NEXT_PUBLIC_ADMIN_URL=https://admin.dudemw.com
NEXT_PUBLIC_MAIN_DOMAIN=dudemw.com
NEXT_PUBLIC_ADMIN_SUBDOMAIN=admin
NEXT_PUBLIC_COOKIE_DOMAIN=.dudemw.com

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

# Optional but Recommended
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token
RESEND_API_KEY=re_your_key

# Contact Info
NEXT_PUBLIC_WHATSAPP_NUMBER=+919876543210
NEXT_PUBLIC_SUPPORT_EMAIL=support@dudemw.com
```

⚠️ **Important:** Replace `dudemw.com` with your actual domain name.

**Note on Cookie Domain:** The leading dot (`.dudemw.com`) allows cookies to be shared between `dudemw.com` and `admin.dudemw.com`.

**Save:** `CTRL+X` → `Y` → `ENTER`

---

### Step 4: Install Dependencies & Build

```bash
# Ensure you're in the project directory
cd ~/domains/yourdomain.com/public_html

# Install dependencies (production mode)
npm install --production=false

# Build the application
npm run build

# Verify build success
ls -la .next/
ls -la .next/standalone/
```

**Expected output:**
- `.next/` directory created
- `.next/standalone/` contains optimized build
- No error messages

---

### Step 5: Set Up PM2 Process Manager

PM2 keeps your application running 24/7 and automatically restarts it if it crashes.

```bash
# Install PM2 globally (if not already installed)
npm install -g pm2

# Create logs directory
mkdir -p logs

# Start application using ecosystem config
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Set PM2 to start on server reboot
pm2 startup
# Copy and run the command it provides

# Verify application is running
pm2 status
```

**Expected output:**
```
┌─────┬──────────┬─────────┬─────────┬─────────┬──────────┐
│ id  │ name     │ mode    │ ↺       │ status  │ cpu      │
├─────┼──────────┼─────────┼─────────┼─────────┼──────────┤
│ 0   │ dudemw   │ fork    │ 0       │ online  │ 0%       │
└─────┴──────────┴─────────┴─────────┴─────────┴──────────┘
```

---

### Step 6: Configure Reverse Proxy (If Needed)

Hostinger may require reverse proxy configuration. The `.htaccess` file is already configured.

Verify `.htaccess` exists:
```bash
ls -la .htaccess
cat .htaccess
```

If not present, it will be created automatically. The configuration routes all requests to your Next.js app on port 3000.

---

### Step 7: Verify Deployment

#### 7.1 Check Application Status

```bash
# Check PM2 status
pm2 status

# View application logs
pm2 logs dudemw --lines 50

# Check if port 3000 is listening
netstat -tuln | grep 3000
```

#### 7.2 Test Local Connection

```bash
# Test from server
curl http://localhost:3000

# Should return HTML content
```

#### 7.3 Test Public Access

Open your browser:
- Homepage: `https://yourdomain.com`
- Admin Setup: `https://yourdomain.com/admin/setup`
- Health Check: `https://yourdomain.com/api/health` (if implemented)

---

### Step 8: Post-Deployment Configuration

#### 8.1 Configure Supabase

1. Go to **[Supabase Dashboard](https://supabase.com/dashboard)**
2. Select your project
3. Go to **Authentication → URL Configuration**
4. Add redirect URLs:
   ```
   Site URL: https://yourdomain.com
   Redirect URLs:
   - https://yourdomain.com/auth/callback
   - https://yourdomain.com/admin/callback
   ```

#### 8.2 Configure Razorpay Webhooks

1. Go to **[Razorpay Dashboard](https://dashboard.razorpay.com/)**
2. Go to **Settings → Webhooks**
3. Click **"Create New Webhook"**
4. Configure:
   ```
   Webhook URL: https://yourdomain.com/api/webhook/razorpay
   Active Events:
   ✅ payment.authorized
   ✅ payment.captured
   ✅ payment.failed
   ✅ order.paid
   ```
5. Generate secret and add to `.env.production`:
   ```bash
   nano .env.production
   # Add: RAZORPAY_WEBHOOK_SECRET=your_secret
   pm2 restart dudemw
   ```

#### 8.3 Create Admin Account

1. Visit: `https://yourdomain.com/admin/setup`
2. Enter your `ADMIN_SETUP_KEY`
3. Create admin account with strong password
4. Login at: `https://yourdomain.com/admin/login`

---

## 🔄 Auto-Deploy Setup

Enable automatic deployment when you push to GitHub:

### Option 1: Using Hostinger Git Auto-Deploy

1. In hPanel → **Advanced → Git**
2. Select your repository
3. Enable **"Auto-deploy on push"**
4. Configure deployment script:
   ```bash
   cd ~/domains/yourdomain.com/public_html
   ./deploy.sh
   ```

### Option 2: Using GitHub Actions (Advanced)

Create `.github/workflows/deploy.yml` in your repository:

```yaml
name: Deploy to Hostinger

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USERNAME }}
          password: ${{ secrets.SSH_PASSWORD }}
          port: ${{ secrets.SSH_PORT }}
          script: |
            cd ~/domains/yourdomain.com/public_html
            ./deploy.sh
```

Add secrets in GitHub: **Settings → Secrets → Actions**

---

## 🛠️ Common Commands

### PM2 Management

```bash
# View status
pm2 status

# View logs (live)
pm2 logs dudemw

# View last 100 lines
pm2 logs dudemw --lines 100

# Restart application
pm2 restart dudemw

# Stop application
pm2 stop dudemw

# Delete from PM2
pm2 delete dudemw

# Monitor resources
pm2 monit
```

### Deployment Updates

```bash
# Quick update
./deploy.sh

# Manual update
git pull origin main
npm install --production
npm run build
pm2 restart dudemw
```

### Log Management

```bash
# View PM2 logs
pm2 logs dudemw

# View specific log files
tail -f logs/pm2-error.log
tail -f logs/pm2-out.log

# Clear logs
pm2 flush dudemw
```

---

## 🐛 Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs dudemw --lines 100

# Common issues:

# 1. Build not completed
npm run build

# 2. Port already in use
lsof -i :3000
kill -9 <PID>

# 3. Missing dependencies
npm install --production

# 4. Environment variables missing
cat .env.production
```

### Database Connection Errors

```bash
# Verify Supabase credentials
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Test connection
curl "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"
```

### Build Failures

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build

# Check Node.js version
node -v  # Should be 20.x

# Check disk space
df -h
```

### Site Not Accessible

```bash
# Check if app is running
pm2 status

# Check if port is listening
netstat -tuln | grep 3000

# Test local connection
curl http://localhost:3000

# Check .htaccess
cat .htaccess

# Check SSL certificate
openssl s_client -connect yourdomain.com:443
```

### Performance Issues

```bash
# Monitor resources
pm2 monit

# Increase memory limit (if needed)
pm2 delete dudemw
nano ecosystem.config.js
# Change: max_memory_restart: '2G'
pm2 start ecosystem.config.js

# Enable Redis caching
# Add Upstash credentials to .env.production
pm2 restart dudemw
```

---

## 📊 Monitoring & Maintenance

### Daily Checks

```bash
# Application status
pm2 status

# Recent errors
pm2 logs dudemw --lines 50 --err

# Resource usage
pm2 monit
```

### Weekly Maintenance

```bash
# Clear old logs
pm2 flush dudemw

# Update dependencies (if needed)
npm outdated
npm update
npm run build
pm2 restart dudemw
```

### Monthly Tasks

- Review Supabase usage and costs
- Check Razorpay transaction logs
- Update Node.js if security patches available
- Review and optimize database queries
- Check SSL certificate expiry

---

## 🔐 Security Checklist

- [x] SSL certificate installed and active
- [x] Environment variables secured in `.env.production`
- [x] `.env.production` added to `.gitignore`
- [x] Strong `ADMIN_SETUP_KEY` set
- [x] Supabase RLS (Row Level Security) policies enabled
- [x] Razorpay webhook secret configured
- [x] SSH key-based authentication (recommended)
- [x] Regular security updates (`npm audit`)
- [x] Firewall configured (Hostinger default)

---

## ✅ Production Checklist

Before launching:

- [ ] All environment variables configured
- [ ] SSL certificate active and valid
- [ ] Database migrations completed
- [ ] Admin account created and secured
- [ ] Test products added
- [ ] Payment gateway tested (test mode)
- [ ] Email notifications working
- [ ] All pages load correctly
- [ ] Mobile responsiveness verified
- [ ] Performance optimized (Lighthouse score > 80)
- [ ] Backup strategy in place
- [ ] Monitoring configured
- [ ] Error tracking set up
- [ ] Terms of Service and Privacy Policy added

### When Ready for Real Payments:

- [ ] Switch Razorpay to LIVE keys
- [ ] Update webhook URL to production
- [ ] Test live payment flow
- [ ] Configure refund policies
- [ ] Set up payment notifications

---

## 📞 Support

### Official Documentation
- **Next.js:** https://nextjs.org/docs
- **Hostinger:** https://support.hostinger.com
- **Supabase:** https://supabase.com/docs
- **Razorpay:** https://razorpay.com/docs
- **PM2:** https://pm2.keymetrics.io/docs

### Emergency Contacts
- **Hostinger Support:** Live chat in hPanel
- **Developer:** Check repository issues

---

## 🎉 Success!

Your Dude Men's Wears e-commerce platform is now live on Hostinger!

**Next Steps:**
1. Add products and collections
2. Configure store settings
3. Test complete purchase flow
4. Set up marketing and SEO
5. Monitor performance and optimize

**Happy Selling! 🛍️**

---

*Last Updated: December 2024*
*Version: 1.0 - Production Ready*

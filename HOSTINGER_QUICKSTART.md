# 🚀 Hostinger Quick Start Guide

**Get your Dude Men's Wears e-commerce site live in 10 minutes!**

---

## ⚡ Prerequisites Checklist

Before you begin, have these ready:

- [ ] Hostinger Business Plan with Node.js 20 enabled
- [ ] SSH credentials from Hostinger hPanel
- [ ] Supabase credentials (URL, Anon Key, Service Role Key)
- [ ] Razorpay test keys (or live keys if ready)
- [ ] Your domain name with SSL configured

---

## 📋 Step-by-Step Deployment

### 1️⃣ SSH into Your Server (1 min)

```bash
# Replace with your actual credentials
ssh username@yourdomain.com -p 65002
```

### 2️⃣ Navigate to Your Domain Directory (1 min)

```bash
cd ~/domains/yourdomain.com/public_html
```

### 3️⃣ Clone Repository (1 min)

```bash
# If using auto-deploy, skip this and configure in hPanel
git clone https://github.com/Melvinkheturus/dudemw.git .
```

### 4️⃣ Configure Environment Variables (2 min)

```bash
# Copy example file
cp .env.example .env.production

# Edit with your credentials
nano .env.production
```

**Minimum required variables:**
```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key
RAZORPAY_KEY_SECRET=your_secret
ADMIN_SETUP_KEY=your-secure-random-key
```

Save: `CTRL+X` → `Y` → `ENTER`

### 5️⃣ Install Dependencies (2 min)

```bash
npm install --production
```

### 6️⃣ Build Application (2 min)

```bash
npm run build
```

### 7️⃣ Start with PM2 (1 min)

```bash
# Create logs directory
mkdir -p logs

# Start application
pm2 start ecosystem.config.js

# Save configuration
pm2 save

# Auto-start on reboot
pm2 startup
# Run the command it provides
```

### 8️⃣ Verify Deployment (1 min)

```bash
# Check status
pm2 status

# Test locally
curl http://localhost:3000

# Run verification script
./verify-deployment.sh https://yourdomain.com
```

---

## ✅ Post-Deployment Tasks

### Configure Supabase Redirects

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Your Project → Authentication → URL Configuration
3. Add:
   - Site URL: `https://yourdomain.com`
   - Redirect URLs: `https://yourdomain.com/auth/callback`

### Configure Razorpay Webhooks

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Settings → Webhooks → Create New
3. URL: `https://yourdomain.com/api/webhook/razorpay`
4. Events: payment.authorized, payment.captured, payment.failed
5. Copy webhook secret to `.env.production`

### Create Admin Account

1. Visit: `https://yourdomain.com/admin/setup`
2. Enter your `ADMIN_SETUP_KEY`
3. Create admin account
4. Login at: `https://yourdomain.com/admin/login`

---

## 🔄 Enable Auto-Deploy

### In Hostinger hPanel:

1. Go to **Advanced → Git**
2. Click **Create Repository**
3. Add your GitHub repo URL
4. Set branch: `main`
5. Set target directory: `/home/username/domains/yourdomain.com/public_html`
6. Enable **Auto-deploy on push**
7. Set deployment command:
   ```bash
   ./deploy.sh
   ```

Now every `git push` will automatically deploy!

---

## 🛠️ Common Commands

```bash
# View application status
pm2 status

# View live logs
pm2 logs dudemw

# Restart application
pm2 restart dudemw

# Deploy updates manually
./deploy.sh

# Verify deployment
./verify-deployment.sh https://yourdomain.com

# Stop application
pm2 stop dudemw
```

---

## 🆘 Troubleshooting

### Application won't start?
```bash
pm2 logs dudemw --lines 100
npm run build
pm2 restart dudemw
```

### Port 3000 already in use?
```bash
lsof -i :3000
kill -9 <PID>
pm2 restart dudemw
```

### Database connection errors?
```bash
# Verify environment variables
cat .env.production | grep SUPABASE
```

### Build failures?
```bash
# Clean and rebuild
rm -rf .next node_modules
npm install
npm run build
```

---

## 📚 Full Documentation

For detailed information, see:
- **[Complete Deployment Guide](./HOSTINGER_DEPLOY.md)** - Full documentation
- **[README](./README.md)** - Project overview
- **[Project Structure](./docs/PROJECT_STRUCTURE.md)** - Architecture

---

## 🎉 Success!

Your site should now be live at `https://yourdomain.com`!

**Next Steps:**
1. ✅ Test all functionality
2. ✅ Add products in admin dashboard
3. ✅ Configure store settings
4. ✅ Switch to live Razorpay keys when ready
5. ✅ Set up monitoring and backups

**Happy Selling! 🛍️**

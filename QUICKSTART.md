# Quick Start Guide - Dude Men's Wears

This is a quick reference guide for getting started with the Dude Men's Wears e-commerce platform.

## 🚀 Quick Links

- **Full Deployment Guide:** [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Project Structure:** [docs/PROJECT_STRUCTURE.md](./docs/PROJECT_STRUCTURE.md)
- **Environment Variables:** [.env.example](./.env.example)

## 📝 Prerequisites

1. Node.js 18+ installed
2. npm or yarn package manager
3. Supabase account with project created
4. Razorpay account (for payments)
5. Git installed

## ⚡ Quick Start (Local Development)

### 1. Clone Repository

```bash
git clone https://github.com/Melvinkheturus/dudemw.git
cd dudemw
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

```bash
# Copy example env file
cp .env.example .env.local

# Edit .env.local and add your credentials
nano .env.local
```

Minimum required variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
ADMIN_SETUP_KEY=your_admin_setup_key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Create Admin Account

1. Visit: http://localhost:3000/admin/setup
2. Enter your `ADMIN_SETUP_KEY`
3. Create your admin account
4. Login at: http://localhost:3000/admin/login

## 📦 Production Deployment

### Option 1: Vercel (Recommended - Easiest)

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy!

**Full Guide:** See [DEPLOYMENT.md](./DEPLOYMENT.md#vercel-deployment)

### Option 2: Hostinger (Cost-Effective)

1. Build the application: `npm run build`
2. Upload to Hostinger via SSH/SFTP
3. Set up environment variables
4. Run with PM2: `pm2 start ecosystem.config.js`

**Full Guide:** See [DEPLOYMENT.md](./DEPLOYMENT.md#hostinger-deployment)

## 🔧 Common Commands

### Development

```bash
# Start development server
npm run dev

# Run linter
npm run lint

# Analyze bundle size
npm run analyze
```

### Production

```bash
# Build for production
npm run build

# Start production server
npm start

# Test production build locally
npm run build && npm start
```

### PM2 (Hostinger)

```bash
# Start with PM2
pm2 start ecosystem.config.js

# View logs
pm2 logs dudemw

# Monitor
pm2 monit

# Restart
pm2 restart dudemw

# Stop
pm2 stop dudemw
```

## 🗂️ Project Structure Overview

```
dudemw/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── (auth)/       # Authentication pages
│   │   ├── (store)/      # Customer-facing store
│   │   ├── admin/        # Admin dashboard
│   │   └── api/          # API routes
│   ├── components/       # Reusable components
│   │   ├── ui/           # shadcn/ui components
│   │   └── common/       # Shared components
│   ├── domains/          # Domain-driven features
│   │   ├── auth/         # Auth domain
│   │   ├── cart/         # Shopping cart
│   │   ├── product/      # Product management
│   │   └── ...           # Other domains
│   ├── lib/              # Utilities & services
│   │   ├── supabase/     # Supabase client
│   │   ├── services/     # External services
│   │   └── utils.ts      # Utility functions
│   └── types/            # TypeScript types
├── public/               # Static assets
├── docs/                 # Documentation
└── scripts/              # Deployment scripts
```

## 🔑 Key Features

### Customer Features
- 🛍️ Product browsing & search
- 🛒 Shopping cart
- 💳 Secure checkout with Razorpay
- 👤 User authentication
- ❤️ Wishlist
- 📦 Order tracking
- 📱 Mobile responsive

### Admin Features
- 📊 Dashboard with analytics
- 📦 Product management (CRUD)
- 🏷️ Category & collection management
- 🎨 Banner management
- 📋 Order processing
- 👥 Customer management
- ⚙️ Store settings
- 💰 Payment & shipping configuration

## 🔗 Important URLs

### Development
- Store: http://localhost:3000
- Admin: http://localhost:3000/admin/login
- Admin Setup: http://localhost:3000/admin/setup
- API Test: http://localhost:3000/api/test-connection

### Production
- Store: https://yourdomain.com
- Admin: https://yourdomain.com/admin/login
- Admin Setup: https://yourdomain.com/admin/setup (disable after first use!)

## 🐛 Troubleshooting

### Build Errors

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Environment Variables Not Working

- Ensure `.env.local` exists in root directory
- Restart dev server after changing env vars
- Check for typos in variable names
- Verify all required variables are set

### Database Connection Issues

- Verify Supabase credentials are correct
- Check Supabase project is active
- Ensure your IP isn't blocked
- Test connection: http://localhost:3000/api/test-connection

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

## 📚 Additional Resources

### Documentation
- [Full Deployment Guide](./DEPLOYMENT.md)
- [Project Structure](./docs/PROJECT_STRUCTURE.md)
- [Admin Dashboard Guide](./docs/ADMIN_DASHBOARD.md)
- [Database Schema](./docs/DATABASE_SCHEMA_UPDATE.md)

### External Services
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Razorpay Docs](https://razorpay.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Hostinger Support](https://support.hostinger.com)

## 🆘 Getting Help

1. Check [DEPLOYMENT.md](./DEPLOYMENT.md) troubleshooting section
2. Review application logs
3. Check browser console for errors
4. Verify all environment variables are set
5. Ensure all services (Supabase, Razorpay) are configured

## 📝 Next Steps After Setup

1. ✅ Set up admin account
2. ✅ Configure store settings
3. ✅ Add product categories
4. ✅ Create collections
5. ✅ Upload products
6. ✅ Create promotional banners
7. ✅ Configure shipping & tax settings
8. ✅ Test complete checkout flow
9. ✅ Deploy to production
10. ✅ Configure domain & SSL

## 🎉 You're Ready!

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

Happy selling! 🛍️

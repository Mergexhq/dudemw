# Production Checklist - Dude Men's Wears

Use this checklist before deploying to production.

## 🔒 Security

- [ ] All environment variables are set correctly
- [ ] `ADMIN_SETUP_KEY` is changed from default
- [ ] Supabase Service Role Key is kept private
- [ ] Razorpay secret keys are not exposed
- [ ] Database Row Level Security (RLS) policies are enabled
- [ ] API routes have proper authentication checks
- [ ] CORS is properly configured
- [ ] SQL injection protection is in place
- [ ] XSS protection is enabled
- [ ] Rate limiting is configured (if using Redis)

## 🌐 Environment Configuration

### Vercel

- [ ] All environment variables added in Vercel dashboard
- [ ] Variables added to Production, Preview, and Development
- [ ] `NEXT_PUBLIC_APP_URL` set to production URL
- [ ] Domain configured (if using custom domain)
- [ ] SSL certificate active
- [ ] `vercel.json` committed to repository

### Hostinger

- [ ] Node.js application created in Hpanel
- [ ] `.env.production` file created with all variables
- [ ] `NEXT_PUBLIC_APP_URL` set to production domain
- [ ] PM2 ecosystem file configured
- [ ] Application built successfully
- [ ] PM2 process running and saved
- [ ] PM2 startup script configured
- [ ] SSL certificate installed and active
- [ ] Domain DNS configured correctly
- [ ] Reverse proxy configured (if needed)

## 📊 Database (Supabase)

- [ ] All tables created and migrated
- [ ] Row Level Security (RLS) policies enabled
- [ ] Storage bucket created: `product-images`
- [ ] Storage bucket set to public
- [ ] Site URL configured in Supabase Auth settings
- [ ] Redirect URLs added for authentication
- [ ] Database backed up
- [ ] Indexes created for performance
- [ ] Foreign key relationships set up

## 💳 Payment Gateway (Razorpay)

### Test Mode (Initial Launch)

- [ ] Razorpay test keys configured
- [ ] Test payment flow verified
- [ ] Webhook URL configured: `/api/webhook/razorpay`
- [ ] Webhook secret saved in environment variables
- [ ] Webhook events selected (payment.*, order.*)
- [ ] Test transactions completed successfully

### Production Mode (When Ready for Real Payments)

- [ ] Razorpay live keys configured
- [ ] Razorpay account fully activated
- [ ] Business details verified
- [ ] Bank account linked
- [ ] Webhook updated with live keys
- [ ] Test transaction with real payment method
- [ ] Refund process tested

## 📧 Email Service (Resend) - Optional

- [ ] Resend account created
- [ ] API key configured
- [ ] Sender domain verified
- [ ] Order confirmation email tested
- [ ] Welcome email tested
- [ ] Password reset email tested
- [ ] Shipping notification tested
- [ ] Email templates reviewed for branding

## 🗄️ Caching (Upstash Redis) - Optional

- [ ] Upstash Redis account created
- [ ] Redis URL and token configured
- [ ] No quotes in environment variables
- [ ] Redis connection tested
- [ ] Cache invalidation working
- [ ] Cache TTL values optimized

## 🏗️ Application Build

- [ ] Local build completes without errors: `npm run build`
- [ ] Production build tested: `npm start`
- [ ] No TypeScript errors
- [ ] No ESLint errors (or acceptable warnings)
- [ ] All dependencies installed
- [ ] No deprecated packages with security issues
- [ ] Bundle size analyzed and optimized
- [ ] Images optimized (WebP format)
- [ ] Fonts optimized (WOFF2 format)

## 🎨 Content & Design

- [ ] Store name and branding configured
- [ ] Logo uploaded and displaying correctly
- [ ] Favicon added
- [ ] Color scheme matches brand
- [ ] Mobile responsive on all pages
- [ ] All images have alt text (SEO & accessibility)
- [ ] Product images uploaded
- [ ] Categories created
- [ ] Collections created
- [ ] Homepage banners created
- [ ] About page content added
- [ ] Contact page configured
- [ ] FAQ page populated
- [ ] Terms of Service added
- [ ] Privacy Policy added
- [ ] Shipping Policy added
- [ ] Return Policy added

## 👨‍💼 Admin Configuration

- [ ] Super admin account created
- [ ] Admin profile completed
- [ ] Admin email verified
- [ ] Strong password set
- [ ] 2FA enabled (if available)
- [ ] Admin setup page disabled or secured after first use

### Store Settings

- [ ] Store information completed
- [ ] Contact details added
- [ ] Social media links configured
- [ ] WhatsApp number configured
- [ ] Support email configured

### Payment Settings

- [ ] Razorpay keys verified
- [ ] Cash on Delivery (COD) configured
- [ ] Payment methods enabled/disabled as needed
- [ ] Minimum order value set (if applicable)

### Shipping Settings

- [ ] Shipping zones created
- [ ] Shipping rates configured
- [ ] Free shipping threshold set (if applicable)
- [ ] Estimated delivery times set
- [ ] Courier service configured

### Tax Settings

- [ ] Tax rates configured by location
- [ ] GST/VAT settings verified
- [ ] Tax exemptions set (if applicable)

## 🧪 Testing

### Functional Testing

#### Customer Flow

- [ ] Homepage loads correctly
- [ ] Product listing page works
- [ ] Product detail page displays all information
- [ ] Product filtering works
- [ ] Product search works
- [ ] Add to cart works
- [ ] Cart updates correctly
- [ ] Remove from cart works
- [ ] Wishlist works
- [ ] User signup works
- [ ] Email verification works (if enabled)
- [ ] User login works
- [ ] Password reset works
- [ ] User profile updates work
- [ ] Address management works
- [ ] Checkout process completes
- [ ] Payment processing works
- [ ] Order confirmation displayed
- [ ] Order history visible
- [ ] Order tracking works

#### Admin Flow

- [ ] Admin login works
- [ ] Dashboard loads with data
- [ ] Product creation works
- [ ] Product editing works
- [ ] Product deletion works (soft delete)
- [ ] Variant management works
- [ ] Image upload works
- [ ] Category management works
- [ ] Collection management works
- [ ] Banner management works
- [ ] Order list loads
- [ ] Order detail view works
- [ ] Order status updates work
- [ ] Tracking number addition works
- [ ] Customer list loads
- [ ] Customer detail view works
- [ ] Coupon creation works (if implemented)
- [ ] Settings pages save correctly
- [ ] Inventory management works
- [ ] Cache clearing works

### API Testing

- [ ] Test connection API: `/api/test-connection`
- [ ] Products API returns data
- [ ] Payment creation API works
- [ ] Payment verification API works
- [ ] Webhook receives and processes correctly
- [ ] All API endpoints return proper status codes
- [ ] API error handling works
- [ ] API rate limiting works (if implemented)

### Browser Testing

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

### Device Testing

- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)
- [ ] Mobile (414x896)

### Performance Testing

- [ ] Lighthouse Performance Score > 90
- [ ] Lighthouse Accessibility Score > 90
- [ ] Lighthouse Best Practices Score > 90
- [ ] Lighthouse SEO Score > 90
- [ ] Page load time < 3 seconds
- [ ] Time to Interactive < 5 seconds
- [ ] First Contentful Paint < 2 seconds
- [ ] Images optimized and lazy loaded
- [ ] JavaScript bundle optimized
- [ ] CSS optimized

## 🔍 SEO Optimization

- [ ] Meta titles set for all pages
- [ ] Meta descriptions set for all pages
- [ ] Open Graph tags configured
- [ ] Twitter Card tags configured
- [ ] Sitemap generated and accessible
- [ ] Robots.txt configured
- [ ] Structured data (JSON-LD) for products
- [ ] Canonical URLs set
- [ ] 404 page customized
- [ ] Image alt tags present
- [ ] Heading hierarchy correct (H1, H2, H3)
- [ ] URL structure is SEO-friendly

## ♿ Accessibility

- [ ] Keyboard navigation works
- [ ] Screen reader tested
- [ ] Color contrast meets WCAG standards
- [ ] Form labels present and descriptive
- [ ] Focus indicators visible
- [ ] Skip to content link present
- [ ] ARIA labels on interactive elements
- [ ] Alt text on all images
- [ ] Form validation accessible
- [ ] Error messages clear and helpful

## 📱 Progressive Web App (PWA) - Optional

- [ ] Web app manifest configured
- [ ] Service worker registered
- [ ] Offline page created
- [ ] Install prompt works
- [ ] App icons added (multiple sizes)
- [ ] Theme color configured

## 📈 Analytics & Monitoring

- [ ] Google Analytics configured (if using)
- [ ] Tracking code installed
- [ ] E-commerce tracking enabled
- [ ] Goals/conversions configured
- [ ] Error tracking set up
- [ ] Performance monitoring enabled
- [ ] Uptime monitoring configured
- [ ] Log aggregation set up

## 📞 Customer Support

- [ ] WhatsApp link configured and tested
- [ ] Support email set up and monitored
- [ ] Contact form works and delivers emails
- [ ] FAQ page comprehensive
- [ ] Instagram profile linked
- [ ] Response time expectations set
- [ ] Customer service process documented

## 📄 Legal & Compliance

- [ ] Terms of Service published
- [ ] Privacy Policy published
- [ ] Cookie Policy published (if using cookies)
- [ ] Return & Refund Policy published
- [ ] Shipping Policy published
- [ ] GDPR compliance checked (if applicable)
- [ ] Data retention policy defined
- [ ] User data deletion process implemented

## 🚀 Go-Live Process

- [ ] All above items checked
- [ ] Final backup taken
- [ ] Staging environment tested
- [ ] Production deployment completed
- [ ] DNS propagation verified
- [ ] SSL certificate verified
- [ ] Smoke tests passed
- [ ] Team notified
- [ ] Monitoring alerts configured
- [ ] Rollback plan documented

## 📋 Post-Launch

- [ ] Monitor error logs (first 24 hours)
- [ ] Check payment processing
- [ ] Verify order confirmation emails
- [ ] Test customer support channels
- [ ] Monitor server resources
- [ ] Check analytics data collection
- [ ] Social media announcement
- [ ] Send to initial customers for feedback
- [ ] Document any issues found
- [ ] Plan for first update/hotfix

## 🔄 Ongoing Maintenance

- [ ] Weekly log review
- [ ] Monthly dependency updates
- [ ] Quarterly security audit
- [ ] Regular database backups
- [ ] Performance monitoring
- [ ] Customer feedback collection
- [ ] Feature prioritization
- [ ] Content updates

---

## ✅ Final Sign-Off

By checking all items above, you confirm the application is production-ready.

**Deployment Date:** _______________

**Deployed By:** _______________

**Sign-Off:** _______________

---

**Good luck with your launch! 🎉**

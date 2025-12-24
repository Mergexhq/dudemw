#!/bin/bash

################################################################################
# Hostinger Auto-Deployment Script for Dude Men's Wears
# 
# This script handles automatic deployment when code is pushed to GitHub.
# It pulls the latest changes, installs dependencies, builds the app,
# and restarts the PM2 process.
#
# Usage:
#   Manual: ./deploy.sh
#   Auto: Configure in Hostinger Git webhook
################################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "="
echo "🚀 Starting Deployment Process"
echo "="
echo ""

# Step 1: Pull latest changes from GitHub
log_info "Pulling latest changes from GitHub..."
if git pull origin main; then
    log_success "Code updated successfully"
else
    log_error "Failed to pull from GitHub"
    exit 1
fi
echo ""

# Step 2: Check if package.json changed
log_info "Checking for dependency changes..."
if git diff HEAD@{1} --name-only | grep -q "package.json\|package-lock.json"; then
    log_warning "Dependencies changed, running npm install..."
    npm install --production
    log_success "Dependencies updated"
else
    log_info "No dependency changes detected, skipping npm install"
fi
echo ""

# Step 3: Clean previous build
log_info "Cleaning previous build..."
if [ -d ".next" ]; then
    rm -rf .next
    log_success "Cleaned .next directory"
fi

if [ -f "tsconfig.tsbuildinfo" ]; then
    rm -f tsconfig.tsbuildinfo
    log_success "Cleaned TypeScript build info"
fi
echo ""

# Step 4: Build the application
log_info "Building Next.js application..."
if npm run build; then
    log_success "Build completed successfully"
else
    log_error "Build failed! Deployment aborted."
    exit 1
fi
echo ""

# Step 5: Verify build output
log_info "Verifying build output..."
if [ -d ".next/standalone" ]; then
    log_success "Standalone build created"
else
    log_warning "Standalone build not found (this is okay if not using standalone mode)"
fi
echo ""

# Step 6: Restart PM2 application
log_info "Restarting application with PM2..."
if pm2 restart dudemw; then
    log_success "Application restarted successfully"
else
    log_warning "PM2 restart failed, attempting to start..."
    if pm2 start ecosystem.config.js; then
        log_success "Application started successfully"
    else
        log_error "Failed to start application with PM2"
        exit 1
    fi
fi
echo ""

# Step 7: Save PM2 configuration
log_info "Saving PM2 configuration..."
pm2 save
log_success "PM2 configuration saved"
echo ""

# Step 8: Display application status
log_info "Application Status:"
pm2 status dudemw
echo ""

# Step 9: Display recent logs
log_info "Recent Application Logs (last 20 lines):"
pm2 logs dudemw --lines 20 --nostream
echo ""

# Step 10: Verify application is responding
log_info "Verifying application is responding..."
sleep 3  # Wait for app to start
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    log_success "Application is responding on port 3000"
else
    log_warning "Application may not be responding yet. Check logs: pm2 logs dudemw"
fi
echo ""

# Deployment summary
echo "="
echo "✅ Deployment Completed Successfully!"
echo "="
echo ""
log_info "Next steps:"
echo "  • Check application status: pm2 status"
echo "  • View live logs: pm2 logs dudemw"
echo "  • Monitor resources: pm2 monit"
echo "  • Test your site: https://yourdomain.com"
echo ""
log_success "Deployment finished at $(date)"
echo ""

# Exit successfully
exit 0

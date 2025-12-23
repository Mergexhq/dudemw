# Hostinger Deployment Script
# Usage: ./deploy-hostinger.sh

#!/bin/bash

set -e  # Exit on error

echo "🚀 Starting Hostinger Deployment..."
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="dudemw"
APP_DIR="$HOME/domains/yourdomain.com/public_html"  # Update this!
NODE_VERSION="18"

echo "${YELLOW}Step 1: Pulling latest changes from repository...${NC}"
cd "$APP_DIR" || exit 1
git pull origin main
if [ $? -eq 0 ]; then
    echo "${GREEN}✓ Git pull successful${NC}"
else
    echo "${RED}✗ Git pull failed${NC}"
    exit 1
fi

echo ""
echo "${YELLOW}Step 2: Installing dependencies...${NC}"
npm install --production
if [ $? -eq 0 ]; then
    echo "${GREEN}✓ Dependencies installed${NC}"
else
    echo "${RED}✗ Dependency installation failed${NC}"
    exit 1
fi

echo ""
echo "${YELLOW}Step 3: Building application...${NC}"
NODE_ENV=production npm run build
if [ $? -eq 0 ]; then
    echo "${GREEN}✓ Build successful${NC}"
else
    echo "${RED}✗ Build failed${NC}"
    exit 1
fi

echo ""
echo "${YELLOW}Step 4: Restarting PM2 process...${NC}"
pm2 restart "$APP_NAME"
if [ $? -eq 0 ]; then
    echo "${GREEN}✓ Application restarted${NC}"
else
    echo "${RED}✗ PM2 restart failed${NC}"
    exit 1
fi

echo ""
echo "${YELLOW}Step 5: Checking application status...${NC}"
pm2 status

echo ""
echo "${GREEN}================================="
echo "✅ Deployment completed successfully!${NC}"
echo "================================="
echo ""
echo "${YELLOW}Useful commands:${NC}"
echo "  View logs: pm2 logs $APP_NAME"
echo "  Monitor: pm2 monit"
echo "  Stop: pm2 stop $APP_NAME"
echo "  Restart: pm2 restart $APP_NAME"
echo ""

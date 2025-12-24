#!/bin/bash
# Simplified Deployment Script for Hostinger
# This script handles deployment without standalone mode complexity

set -e  # Exit on error

echo "🚀 Starting simplified deployment for Hostinger..."

# Load environment variables
if [ -f .env.production ]; then
  echo "📝 Loading production environment variables..."
  export $(cat .env.production | grep -v '^#' | xargs)
else
  echo "⚠️  Warning: .env.production not found, using existing environment"
fi

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf .next
rm -f tsconfig.tsbuildinfo

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production=false

# Build application
echo "🔨 Building application..."
NODE_ENV=production npm run build

# Check if build was successful
if [ ! -d ".next" ]; then
  echo "❌ Build failed - .next directory not found"
  exit 1
fi

echo "✅ Build completed successfully!"

# Restart or start PM2
echo "♻️  Managing PM2 process..."
if pm2 list | grep -q "dudemw"; then
  echo "Restarting existing PM2 process..."
  pm2 restart dudemw
else
  echo "Starting new PM2 process..."
  pm2 start ecosystem.config.js
fi

# Save PM2 configuration
pm2 save

echo ""
echo "✅ Deployment complete!"
echo ""
pm2 status
echo ""
echo "📊 View logs with: pm2 logs dudemw"
echo "🔄 Restart with: pm2 restart dudemw"
echo "🛑 Stop with: pm2 stop dudemw"

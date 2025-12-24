#!/bin/bash

################################################################################
# Deployment Verification Script for Dude Men's Wears
# 
# This script verifies that your Hostinger deployment is working correctly.
# It checks application status, connectivity, and critical endpoints.
#
# Usage: ./verify-deployment.sh [domain]
# Example: ./verify-deployment.sh https://yourdomain.com
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get domain from argument or use localhost
DOMAIN="${1:-http://localhost:3000}"

echo "="
echo "🔍 Deployment Verification for Dude Men's Wears"
echo "="
echo ""
echo "Domain: $DOMAIN"
echo ""

PASSED=0
FAILED=0

test_passed() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

test_failed() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

test_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

test_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. System Requirements"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check Node.js version
test_info "Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 20 ]; then
    test_passed "Node.js version: $(node -v)"
else
    test_failed "Node.js version too old: $(node -v) (Required: 20+)"
fi

# Check npm version
test_info "Checking npm version..."
if command -v npm &> /dev/null; then
    test_passed "npm version: $(npm -v)"
else
    test_failed "npm not found"
fi

# Check PM2
test_info "Checking PM2 installation..."
if command -v pm2 &> /dev/null; then
    test_passed "PM2 version: $(pm2 -v)"
else
    test_warning "PM2 not found (may not be needed)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. Project Structure"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check critical files
test_info "Checking project files..."
for file in package.json next.config.js ecosystem.config.js .env.production; do
    if [ -f "$file" ]; then
        test_passed "Found: $file"
    else
        if [ "$file" = ".env.production" ]; then
            test_warning "Missing: $file (may need to create)"
        else
            test_failed "Missing: $file"
        fi
    fi
done

# Check node_modules
if [ -d "node_modules" ]; then
    test_passed "Dependencies installed (node_modules exists)"
else
    test_failed "Dependencies not installed (run: npm install)"
fi

# Check build output
if [ -d ".next" ]; then
    test_passed "Build output exists (.next directory)"
    if [ -d ".next/standalone" ]; then
        test_passed "Standalone build created"
    else
        test_warning "Standalone build not found (okay if not using standalone)"
    fi
else
    test_failed "Build not found (run: npm run build)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. Environment Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check environment variables
test_info "Checking environment variables..."
if [ -f ".env.production" ]; then
    # Check for required variables
    for var in NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY NEXT_PUBLIC_RAZORPAY_KEY_ID ADMIN_SETUP_KEY; do
        if grep -q "^${var}=" .env.production && ! grep -q "^${var}=your_" .env.production && ! grep -q "^${var}=$" .env.production; then
            test_passed "$var is configured"
        else
            test_warning "$var may not be configured properly"
        fi
    done
else
    test_warning "No .env.production file found"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. PM2 Process Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v pm2 &> /dev/null; then
    test_info "Checking PM2 processes..."
    
    if pm2 list | grep -q "dudemw"; then
        STATUS=$(pm2 jlist | grep -A 10 '"name":"dudemw"' | grep '"status"' | cut -d'"' -f4)
        
        if [ "$STATUS" = "online" ]; then
            test_passed "Application is running (status: online)"
            
            # Get additional info
            UPTIME=$(pm2 jlist | grep -A 10 '"name":"dudemw"' | grep '"pm_uptime"' | cut -d':' -f2 | cut -d',' -f1)
            MEMORY=$(pm2 jlist | grep -A 10 '"name":"dudemw"' | grep '"memory"' | cut -d':' -f2 | cut -d',' -f1)
            CPU=$(pm2 jlist | grep -A 10 '"name":"dudemw"' | grep '"cpu"' | cut -d':' -f2 | cut -d',' -f1)
            
            test_info "  Uptime: $UPTIME"
            test_info "  Memory: $MEMORY bytes"
            test_info "  CPU: $CPU%"
        else
            test_failed "Application is not running (status: $STATUS)"
        fi
    else
        test_warning "PM2 process 'dudemw' not found"
        test_info "To start: pm2 start ecosystem.config.js"
    fi
    
    # Show PM2 list
    echo ""
    test_info "PM2 Process List:"
    pm2 list
else
    test_warning "PM2 not installed, skipping process checks"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. Application Connectivity"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test local connection
test_info "Testing local connection (localhost:3000)..."
if curl -f -s http://localhost:3000 > /dev/null 2>&1; then
    test_passed "Local application is responding"
else
    test_failed "Local application is not responding on port 3000"
fi

# Test public domain (if not localhost)
if [ "$DOMAIN" != "http://localhost:3000" ]; then
    test_info "Testing public domain ($DOMAIN)..."
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN" 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" = "200" ]; then
        test_passed "Domain is accessible (HTTP $HTTP_CODE)"
    elif [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
        test_warning "Domain redirecting (HTTP $HTTP_CODE)"
    elif [ "$HTTP_CODE" = "000" ]; then
        test_failed "Cannot reach domain (DNS or network issue)"
    else
        test_failed "Domain returned HTTP $HTTP_CODE"
    fi
    
    # Check SSL certificate
    if [[ "$DOMAIN" == https://* ]]; then
        test_info "Checking SSL certificate..."
        DOMAIN_HOST=$(echo "$DOMAIN" | sed -e 's|https://||' -e 's|/.*||')
        if echo | openssl s_client -connect "${DOMAIN_HOST}:443" -servername "$DOMAIN_HOST" 2>/dev/null | grep -q "Verify return code: 0"; then
            test_passed "SSL certificate is valid"
        else
            test_warning "SSL certificate validation failed or self-signed"
        fi
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6. Port and Network"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if port 3000 is listening
test_info "Checking if port 3000 is listening..."
if netstat -tuln 2>/dev/null | grep -q ":3000 " || lsof -i :3000 > /dev/null 2>&1; then
    test_passed "Port 3000 is listening"
else
    test_failed "Port 3000 is not listening"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7. Logs Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v pm2 &> /dev/null && pm2 list | grep -q "dudemw"; then
    test_info "Checking for recent errors in logs..."
    
    ERROR_COUNT=$(pm2 logs dudemw --nostream --lines 100 --err 2>/dev/null | grep -i "error" | wc -l)
    
    if [ "$ERROR_COUNT" -eq 0 ]; then
        test_passed "No errors found in recent logs"
    elif [ "$ERROR_COUNT" -lt 5 ]; then
        test_warning "Found $ERROR_COUNT errors in recent logs"
    else
        test_failed "Found $ERROR_COUNT errors in recent logs"
    fi
    
    test_info "To view logs: pm2 logs dudemw"
elif [ -d "logs" ]; then
    test_info "Checking log files..."
    if [ -f "logs/pm2-error.log" ]; then
        ERROR_COUNT=$(tail -100 logs/pm2-error.log 2>/dev/null | grep -i "error" | wc -l)
        if [ "$ERROR_COUNT" -eq 0 ]; then
            test_passed "No errors in log files"
        else
            test_warning "Found $ERROR_COUNT errors in log files"
        fi
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Verification Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✓ Passed: $PASSED${NC}"
echo -e "${RED}✗ Failed: $FAILED${NC}"
echo ""

if [ "$FAILED" -eq 0 ]; then
    echo -e "${GREEN}🎉 All checks passed! Your deployment looks good.${NC}"
    exit 0
elif [ "$FAILED" -lt 3 ]; then
    echo -e "${YELLOW}⚠️  Some checks failed, but deployment may still work.${NC}"
    echo -e "${YELLOW}   Review the failed checks above.${NC}"
    exit 1
else
    echo -e "${RED}❌ Multiple checks failed. Deployment needs attention.${NC}"
    echo -e "${RED}   Please review and fix the failed checks above.${NC}"
    exit 1
fi

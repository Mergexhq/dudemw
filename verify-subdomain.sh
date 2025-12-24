#!/bin/bash

# 🔍 Subdomain Configuration Verification Script
# Run this to diagnose subdomain issues

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🔍 SUBDOMAIN DIAGNOSTICS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check 1: Files exist
echo -e "${BLUE}1. Checking required files...${NC}"
if [ -f "server.js" ]; then
    echo -e "${GREEN}✅ server.js exists${NC}"
else
    echo -e "${RED}❌ server.js missing${NC}"
fi

if [ -f ".env.production" ]; then
    echo -e "${GREEN}✅ .env.production exists${NC}"
else
    echo -e "${RED}❌ .env.production missing${NC}"
fi

if [ -f ".htaccess" ]; then
    echo -e "${GREEN}✅ .htaccess exists${NC}"
else
    echo -e "${RED}❌ .htaccess missing${NC}"
fi
echo ""

# Check 2: PM2 status
echo -e "${BLUE}2. Checking PM2 status...${NC}"
pm2 status | grep dudemw
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Application is running${NC}"
else
    echo -e "${RED}❌ Application is not running${NC}"
fi
echo ""

# Check 3: Port listening
echo -e "${BLUE}3. Checking if port 3000 is listening...${NC}"
netstat -tuln | grep ":3000" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Port 3000 is listening${NC}"
    netstat -tuln | grep ":3000"
else
    echo -e "${RED}❌ Port 3000 is not listening${NC}"
fi
echo ""

# Check 4: Local connection
echo -e "${BLUE}4. Testing local connection...${NC}"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 > /tmp/status_code.txt
STATUS_CODE=$(cat /tmp/status_code.txt)
if [ "$STATUS_CODE" = "200" ] || [ "$STATUS_CODE" = "301" ] || [ "$STATUS_CODE" = "302" ]; then
    echo -e "${GREEN}✅ Local connection working (HTTP $STATUS_CODE)${NC}"
else
    echo -e "${RED}❌ Local connection failed (HTTP $STATUS_CODE)${NC}"
fi
echo ""

# Check 5: Subdomain DNS
echo -e "${BLUE}5. Checking subdomain DNS...${NC}"
nslookup admin.dudemw.com > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ admin.dudemw.com DNS resolves${NC}"
    nslookup admin.dudemw.com | grep "Address:" | tail -1
else
    echo -e "${RED}❌ admin.dudemw.com DNS not resolving${NC}"
fi
echo ""

# Check 6: .htaccess configuration
echo -e "${BLUE}6. Checking .htaccess configuration...${NC}"
if grep -q "X-Forwarded-Host" .htaccess; then
    echo -e "${GREEN}✅ .htaccess has X-Forwarded-Host header${NC}"
else
    echo -e "${YELLOW}⚠️  .htaccess missing X-Forwarded-Host header${NC}"
fi

if grep -q "127.0.0.1:3000" .htaccess; then
    echo -e "${GREEN}✅ .htaccess proxying to port 3000${NC}"
else
    echo -e "${RED}❌ .htaccess not proxying to port 3000${NC}"
fi
echo ""

# Check 7: Environment variables
echo -e "${BLUE}7. Checking environment variables...${NC}"
if grep -q "NEXT_PUBLIC_ADMIN_URL=https://admin.dudemw.com" .env.production; then
    echo -e "${GREEN}✅ Admin URL configured correctly${NC}"
else
    echo -e "${RED}❌ Admin URL not configured${NC}"
fi

if grep -q "NEXT_PUBLIC_COOKIE_DOMAIN=.dudemw.com" .env.production; then
    echo -e "${GREEN}✅ Cookie domain configured correctly${NC}"
else
    echo -e "${RED}❌ Cookie domain not configured${NC}"
fi
echo ""

# Check 8: Build status
echo -e "${BLUE}8. Checking build status...${NC}"
if [ -d ".next/standalone" ]; then
    echo -e "${GREEN}✅ Standalone build exists${NC}"
else
    echo -e "${RED}❌ Standalone build missing - run 'npm run build'${NC}"
fi
echo ""

# Check 9: Admin routes
echo -e "${BLUE}9. Checking admin routes...${NC}"
if [ -d "src/app/admin" ]; then
    echo -e "${GREEN}✅ Admin routes directory exists${NC}"
    ls -1 src/app/admin/ | head -5
else
    echo -e "${RED}❌ Admin routes directory missing${NC}"
fi
echo ""

# Check 10: Recent logs
echo -e "${BLUE}10. Checking recent logs for errors...${NC}"
if pm2 logs dudemw --lines 10 --nostream 2>&1 | grep -i "error" > /dev/null; then
    echo -e "${YELLOW}⚠️  Errors found in logs:${NC}"
    pm2 logs dudemw --lines 20 --nostream 2>&1 | grep -i "error" | tail -5
else
    echo -e "${GREEN}✅ No recent errors in logs${NC}"
fi
echo ""

# Check 11: SSL Certificates
echo -e "${BLUE}11. Checking SSL certificates...${NC}"
echo "   Main domain (dudemw.com):"
openssl s_client -connect dudemw.com:443 -servername dudemw.com </dev/null 2>/dev/null | grep "Verify return code" | head -1

echo "   Admin subdomain (admin.dudemw.com):"
openssl s_client -connect admin.dudemw.com:443 -servername admin.dudemw.com </dev/null 2>/dev/null | grep "Verify return code" | head -1
echo ""

# Check 12: Test subdomain with Host header
echo -e "${BLUE}12. Testing subdomain with Host header...${NC}"
curl -s -o /dev/null -w "%{http_code}" -H "Host: admin.dudemw.com" http://localhost:3000 > /tmp/admin_status.txt
ADMIN_STATUS=$(cat /tmp/admin_status.txt)
if [ "$ADMIN_STATUS" = "200" ] || [ "$ADMIN_STATUS" = "301" ] || [ "$ADMIN_STATUS" = "302" ]; then
    echo -e "${GREEN}✅ Admin subdomain responding locally (HTTP $ADMIN_STATUS)${NC}"
else
    echo -e "${RED}❌ Admin subdomain not responding locally (HTTP $ADMIN_STATUS)${NC}"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}  📊 SUMMARY${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "If all checks pass but subdomain still shows parked page:"
echo ""
echo "1. Check Hostinger hPanel → Subdomains"
echo "   - Verify admin.dudemw.com exists"
echo "   - Document Root must match main domain"
echo ""
echo "2. Clear Hostinger cache"
echo "   - hPanel → Performance → Clear Cache"
echo ""
echo "3. Wait 5-10 minutes for propagation"
echo ""
echo "4. Contact Hostinger support if issue persists"
echo ""
echo "See SUBDOMAIN_FIX_GUIDE.md for detailed troubleshooting"
echo ""

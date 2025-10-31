#!/bin/bash

# Security Remediation Quick Start Script
# This script helps you begin the security fix process

set -e

echo "🔒 ReadnWin Security Remediation - Quick Start"
echo "=============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "SECURITY_REMEDIATION_PLAN.md" ]; then
    echo -e "${RED}Error: SECURITY_REMEDIATION_PLAN.md not found${NC}"
    echo "Please run this script from the project root directory"
    exit 1
fi

echo -e "${YELLOW}Step 1: Creating backup branch${NC}"
git add .
git commit -m "Pre-security-fix backup - $(date +%Y-%m-%d)" || echo "Nothing to commit"
git branch security-fixes 2>/dev/null || echo "Branch already exists"
git checkout security-fixes

echo ""
echo -e "${GREEN}✓ Backup branch created${NC}"
echo ""

echo -e "${YELLOW}Step 2: Generating new secrets${NC}"
echo "Copy these secrets to a secure location (DO NOT COMMIT):"
echo ""
echo "# Add these to your .env file:"
python3 << 'EOF'
import secrets
print(f"SECRET_KEY={secrets.token_urlsafe(64)}")
print(f"CSRF_SECRET_KEY={secrets.token_urlsafe(64)}")
print(f"# Also generate new passwords for:")
print(f"# - Database (DB_PASSWORD)")
print(f"# - Redis (in REDIS_URL)")
print(f"# - Resend API (RESEND_API_KEY)")
EOF

echo ""
echo -e "${GREEN}✓ Secrets generated${NC}"
echo ""

echo -e "${YELLOW}Step 3: Creating .env.example${NC}"
cat > readnwin-backend/.env.example << 'EOF'
# Database Configuration
DB_USER=postgres
DB_PASSWORD=<YOUR_SECURE_PASSWORD>
DB_HOST=<YOUR_DB_HOST>
DB_PORT=5432
DB_NAME=postgres

# JWT Configuration (Generate with: python -c "import secrets; print(secrets.token_urlsafe(64))")
SECRET_KEY=<GENERATE_64_CHAR_SECRET>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# CSRF Protection (Generate with: python -c "import secrets; print(secrets.token_urlsafe(64))")
CSRF_SECRET_KEY=<GENERATE_64_CHAR_SECRET>

# Rate Limiting
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15

# Frontend URL
FRONTEND_URL=https://readnwin.com

# Environment
ENVIRONMENT=production

# Email Service
RESEND_API_KEY=<YOUR_RESEND_API_KEY>

# Redis
REDIS_URL=rediss://:<YOUR_REDIS_PASSWORD>@<YOUR_REDIS_HOST>:<PORT>/0
EOF

echo -e "${GREEN}✓ .env.example created${NC}"
echo ""

echo -e "${YELLOW}Step 4: Checking .gitignore${NC}"
if grep -q "^\.env$" .gitignore 2>/dev/null; then
    echo -e "${GREEN}✓ .env already in .gitignore${NC}"
else
    echo ".env" >> .gitignore
    echo -e "${GREEN}✓ Added .env to .gitignore${NC}"
fi

echo ""
echo -e "${YELLOW}Step 5: Installing security dependencies${NC}"
cd readnwin-backend

# Check if requirements.txt exists
if [ -f "requirements.txt" ]; then
    # Add security packages if not present
    grep -q "bleach" requirements.txt || echo "bleach==6.0.0" >> requirements.txt
    grep -q "python-magic" requirements.txt || echo "python-magic==0.4.27" >> requirements.txt
    grep -q "werkzeug" requirements.txt || echo "werkzeug==3.0.0" >> requirements.txt
    
    echo -e "${GREEN}✓ Security dependencies added to requirements.txt${NC}"
    echo "Run: pip install -r requirements.txt"
else
    echo -e "${RED}Warning: requirements.txt not found${NC}"
fi

cd ..

echo ""
echo "=============================================="
echo -e "${GREEN}✓ Quick start complete!${NC}"
echo ""
echo "📋 NEXT STEPS:"
echo ""
echo "1. ${YELLOW}IMMEDIATELY${NC} update your .env file with the generated secrets above"
echo "2. Review SECURITY_REMEDIATION_PLAN.md for the full plan"
echo "3. Start with Phase 1 (Critical Fixes)"
echo "4. Test after each phase"
echo ""
echo "⚠️  ${RED}IMPORTANT REMINDERS:${NC}"
echo "   - Never commit .env file"
echo "   - Rotate all production credentials"
echo "   - Test thoroughly before deploying"
echo "   - Keep backups of everything"
echo ""
echo "📖 Read the full plan: SECURITY_REMEDIATION_PLAN.md"
echo ""

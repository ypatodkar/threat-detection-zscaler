#!/bin/bash

# Alternative method: Manual build instructions
# Use this if Docker is not available

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Manual Lambda Package Creation (for native modules)${NC}"
echo ""
echo "Since Docker is not available, here are your options:"
echo ""
echo "OPTION 1: Use EC2 Instance (Recommended)"
echo "----------------------------------------"
echo "1. Launch an EC2 instance (Amazon Linux 2, t2.micro is free tier)"
echo "2. SSH into the instance"
echo "3. Install Node.js 20:"
echo "   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
echo "   source ~/.bashrc"
echo "   nvm install 20"
echo "4. Clone your repo or upload files"
echo "5. Run: cd backend && npm ci --production"
echo "6. Create zip: zip -r lambda.zip . -x '*.git*' '*.md' 'scripts/*' 'db/*'"
echo "7. Download zip and upload to Lambda"
echo ""
echo "OPTION 2: Use GitHub Actions (Free CI/CD)"
echo "----------------------------------------"
echo "Create .github/workflows/build-lambda.yml:"
echo ""
cat << 'EOF'
name: Build Lambda Package

on:
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: |
          cd backend
          npm ci --production
      - name: Create package
        run: |
          cd backend
          zip -r lambda.zip . -x '*.git*' '*.md' 'scripts/*' 'db/*'
      - name: Upload artifact
        uses: actions/upload-artifact@v3
        with:
          name: lambda-package
          path: backend/lambda.zip
EOF
echo ""
echo "OPTION 3: Use bcryptjs instead of bcrypt (Pure JavaScript)"
echo "----------------------------------------------------------"
echo "This doesn't require native compilation:"
echo "1. Replace bcrypt with bcryptjs in package.json"
echo "2. Update imports: import bcrypt from 'bcryptjs'"
echo "3. API is the same, just slower (but fine for Lambda)"
echo ""
echo "Would you like me to help you switch to bcryptjs? (y/n)"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    echo "I'll help you switch to bcryptjs..."
    # This would be handled by the user or we can create a script
fi


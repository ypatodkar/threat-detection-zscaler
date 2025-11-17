#!/bin/bash

# Script to create a Lambda deployment package
# Usage: ./create-lambda-package.sh

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Creating Lambda deployment package...${NC}"

# Get the script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR" && pwd)"
PACKAGE_DIR="$PROJECT_ROOT/lambda-package"
ZIP_FILE="$PROJECT_ROOT/threat-detection-lambda.zip"

# Clean up previous builds
echo -e "${YELLOW}Cleaning up previous builds...${NC}"
rm -rf "$PACKAGE_DIR"
rm -f "$ZIP_FILE"

# Create package directory
mkdir -p "$PACKAGE_DIR"

# Install production dependencies
echo -e "${YELLOW}Installing production dependencies...${NC}"
cd "$PROJECT_ROOT"
npm install --production --no-audit --no-fund

# Copy necessary files
echo -e "${YELLOW}Copying files...${NC}"

# Copy all source files (preserve directory structure)
if [ -d "config" ]; then
    cp -r config "$PACKAGE_DIR/" 2>/dev/null || true
fi
if [ -d "routes" ]; then
    cp -r routes "$PACKAGE_DIR/"
fi
if [ -d "utils" ]; then
    cp -r utils "$PACKAGE_DIR/"
fi

# Copy server files
cp server.js "$PACKAGE_DIR/"
cp serverless-handler.js "$PACKAGE_DIR/"

# Copy package.json and package-lock.json
cp package.json "$PACKAGE_DIR/"
cp package-lock.json "$PACKAGE_DIR/" 2>/dev/null || true

# Copy node_modules (production only, already installed)
echo -e "${YELLOW}Copying node_modules...${NC}"
# Use rsync if available, otherwise use cp with proper flags
if command -v rsync &> /dev/null; then
    rsync -a node_modules/ "$PACKAGE_DIR/node_modules/"
else
    cp -R node_modules/ "$PACKAGE_DIR/"
fi

# Remove unnecessary files from package
echo -e "${YELLOW}Cleaning up package...${NC}"
cd "$PACKAGE_DIR"

# Ensure serverless-http is in node_modules (fix if it was copied to root)
if [ -d "serverless-http" ] && [ ! -d "node_modules/serverless-http" ]; then
    echo "Moving serverless-http to node_modules..."
    mv serverless-http node_modules/
fi

# Remove dev files and folders
rm -rf node_modules/.bin
rm -rf node_modules/.cache
rm -rf uploads/
rm -rf scripts/
rm -rf db/
rm -f test-route.js
rm -f serverless.yml
rm -f serverless.yml.example

# Create zip file
echo -e "${YELLOW}Creating zip file...${NC}"
cd "$PACKAGE_DIR"
zip -r "$ZIP_FILE" . -q

# Get file size
FILE_SIZE=$(du -h "$ZIP_FILE" | cut -f1)

echo ""
echo -e "${GREEN}✅ Lambda deployment package created!${NC}"
echo ""
echo "Package location: $ZIP_FILE"
echo "Package size: $FILE_SIZE"
echo ""
echo "Next steps:"
echo "1. Go to AWS Lambda Console"
echo "2. Create or select your function"
echo "3. Upload the zip file: $ZIP_FILE"
echo "4. Set handler to: serverless-handler.handler"
echo "5. Set runtime to: Node.js 18.x or 20.x"
echo "6. Configure environment variables:"
echo "   - DB_HOST"
echo "   - DB_NAME"
echo "   - DB_USER"
echo "   - DB_PASSWORD"
echo "   - DB_PORT (default: 5432)"
echo "   - JWT_SECRET"
echo ""
echo "Note: Make sure your Lambda has VPC access to RDS if needed"


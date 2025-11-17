#!/bin/bash

# Script to create a Lambda deployment package using Docker
# This ensures native modules (like bcrypt) are compiled for Linux
# Usage: ./create-lambda-package-docker.sh

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Creating Lambda deployment package with Docker (for native modules)...${NC}"

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

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed or not in PATH${NC}"
    echo ""
    echo "Please install Docker Desktop: https://www.docker.com/products/docker-desktop"
    echo ""
    echo "Alternatively, you can use the manual method:"
    echo "1. Use an EC2 instance (Amazon Linux 2)"
    echo "2. Or use GitHub Actions / CI/CD"
    echo "3. Or use a Linux VM"
    exit 1
fi

echo -e "${YELLOW}Using Docker to build for Linux (Lambda environment)...${NC}"

# Use Docker to install dependencies for Linux
# Amazon Linux 2 matches Lambda's runtime environment
docker run --rm \
  -v "$PROJECT_ROOT:/app" \
  -w /app \
  --platform linux/amd64 \
  public.ecr.aws/lambda/nodejs:20 \
  sh -c "
    echo 'Installing production dependencies for Linux...'
    npm ci --production --no-audit --no-fund
    
    echo 'Copying files to package directory...'
    mkdir -p /app/lambda-package
    
    # Copy source files
    if [ -d 'config' ]; then cp -r config /app/lambda-package/; fi
    if [ -d 'routes' ]; then cp -r routes /app/lambda-package/; fi
    if [ -d 'utils' ]; then cp -r utils /app/lambda-package/; fi
    
    # Copy server files
    cp server.js /app/lambda-package/
    cp serverless-handler.js /app/lambda-package/
    cp package.json /app/lambda-package/
    [ -f package-lock.json ] && cp package-lock.json /app/lambda-package/ || true
    
    # Copy node_modules (with Linux-compiled native modules)
    echo 'Copying node_modules (Linux-compiled)...'
    cp -r node_modules /app/lambda-package/
    
    echo 'Cleaning up package...'
    cd /app/lambda-package
    rm -rf node_modules/.bin
    rm -rf node_modules/.cache
    rm -rf uploads/
    rm -rf scripts/
    rm -rf db/
    rm -f test-route.js
    rm -f serverless.yml
    rm -f serverless.yml.example
    
    echo 'Creating zip file...'
    zip -r /app/threat-detection-lambda.zip . -q
    
    echo '✅ Package created successfully!'
  "

# Get file size
if [ -f "$ZIP_FILE" ]; then
    FILE_SIZE=$(du -h "$ZIP_FILE" | cut -f1)
    
    echo ""
    echo -e "${GREEN}✅ Lambda deployment package created!${NC}"
    echo ""
    echo "Package location: $ZIP_FILE"
    echo "Package size: $FILE_SIZE"
    echo ""
    echo "✅ Native modules (bcrypt) are now compiled for Linux!"
    echo ""
    echo "Next steps:"
    echo "1. Go to AWS Lambda Console"
    echo "2. Upload the zip file: $ZIP_FILE"
    echo "3. Set handler to: serverless-handler.handler"
    echo "4. Set runtime to: Node.js 20.x"
    echo "5. Configure environment variables"
else
    echo -e "${RED}❌ Failed to create package${NC}"
    exit 1
fi


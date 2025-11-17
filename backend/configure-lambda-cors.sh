#!/bin/bash

# Script to configure CORS on Lambda Function URL
# Usage: ./configure-lambda-cors.sh <function-name> <region>

set -e

FUNCTION_NAME=${1:-"threat-detection-api"}
REGION=${2:-"us-east-2"}
ORIGIN=${3:-"https://main.djqvks4i9xlkw.amplifyapp.com"}

echo "🔧 Configuring CORS for Lambda Function: $FUNCTION_NAME"
echo "📍 Region: $REGION"
echo "🌐 Allowed Origin: $ORIGIN"
echo ""

# Get the Function URL ID
FUNCTION_URL=$(aws lambda get-function-url-config \
  --function-name "$FUNCTION_NAME" \
  --region "$REGION" \
  --query 'FunctionUrl' \
  --output text 2>/dev/null || echo "")

if [ -z "$FUNCTION_URL" ]; then
  echo "❌ Error: Could not find Function URL for $FUNCTION_NAME"
  echo "   Make sure the function name is correct and a Function URL is configured."
  exit 1
fi

echo "✅ Found Function URL: $FUNCTION_URL"
echo ""

# Configure CORS
echo "📝 Updating CORS configuration..."

aws lambda update-function-url-config \
  --function-name "$FUNCTION_NAME" \
  --region "$REGION" \
  --cors "{
    \"AllowCredentials\": false,
    \"AllowHeaders\": [
      \"Content-Type\",
      \"Authorization\",
      \"x-user-id\",
      \"X-Requested-With\",
      \"Accept\",
      \"Origin\"
    ],
    \"AllowMethods\": [
      \"GET\",
      \"POST\",
      \"PUT\",
      \"DELETE\",
      \"OPTIONS\"
    ],
    \"AllowOrigins\": [
      \"$ORIGIN\",
      \"*\"
    ],
    \"ExposeHeaders\": [
      \"Content-Type\"
    ],
    \"MaxAge\": 86400
  }" \
  --output json

echo ""
echo "✅ CORS configuration updated successfully!"
echo ""
echo "🧪 Testing preflight request..."
echo ""

# Test the preflight request
curl -X OPTIONS "$FUNCTION_URL/auth/login" \
  -H "Origin: $ORIGIN" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type" \
  -v 2>&1 | grep -i "access-control" || echo "⚠️  Check the response above for CORS headers"

echo ""
echo "✨ Done! Your Lambda Function URL CORS is now configured."


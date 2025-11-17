#!/bin/bash

# Test health check endpoint
# Usage: ./test-health.sh [LAMBDA_URL]

LAMBDA_URL=${1:-"http://localhost:3001"}

echo "Testing Health Check..."
echo "URL: $LAMBDA_URL/health"
echo ""

response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$LAMBDA_URL/health")
http_code=$(echo "$response" | grep "HTTP_CODE" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_CODE/d')

echo "Response:"
echo "$body"
echo ""
echo "HTTP Status: $http_code"

if [ "$http_code" = "200" ]; then
    echo "✅ Health check passed!"
    exit 0
else
    echo "❌ Health check failed!"
    exit 1
fi


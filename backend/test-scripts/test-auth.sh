#!/bin/bash

# Test authentication endpoints
# Usage: ./test-auth.sh [LAMBDA_URL] [USERNAME] [PASSWORD]

LAMBDA_URL=${1:-"http://localhost:3001"}
USERNAME=${2:-"admin"}
PASSWORD=${3:-"admin123"}

echo "Testing Authentication..."
echo "URL: $LAMBDA_URL"
echo "Username: $USERNAME"
echo ""

# Test Login
echo "1. Testing Login..."
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$LAMBDA_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}")

http_code=$(echo "$response" | grep "HTTP_CODE" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_CODE/d')

echo "Response:"
echo "$body" | jq . 2>/dev/null || echo "$body"
echo "HTTP Status: $http_code"
echo ""

if [ "$http_code" = "200" ]; then
    echo "✅ Login successful!"
    USER_ID=$(echo "$body" | jq -r '.user.id' 2>/dev/null)
    if [ -n "$USER_ID" ] && [ "$USER_ID" != "null" ]; then
        echo "User ID: $USER_ID"
        export USER_ID
    fi
else
    echo "❌ Login failed!"
    exit 1
fi

# Test Profile (if we got a user ID)
if [ -n "$USER_ID" ]; then
    echo ""
    echo "2. Testing Profile..."
    response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$LAMBDA_URL/auth/profile" \
      -H "x-user-id: $USER_ID")
    
    http_code=$(echo "$response" | grep "HTTP_CODE" | cut -d: -f2)
    body=$(echo "$response" | sed '/HTTP_CODE/d')
    
    echo "Response:"
    echo "$body" | jq . 2>/dev/null || echo "$body"
    echo "HTTP Status: $http_code"
    
    if [ "$http_code" = "200" ]; then
        echo "✅ Profile fetch successful!"
    else
        echo "❌ Profile fetch failed!"
    fi
fi


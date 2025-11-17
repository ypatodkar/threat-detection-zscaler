#!/bin/bash

# Test logs endpoints
# Usage: ./test-logs.sh [LAMBDA_URL] [USER_ID]

LAMBDA_URL=${1:-"http://localhost:3001"}
USER_ID=${2:-"1"}

echo "Testing Logs Endpoints..."
echo "URL: $LAMBDA_URL"
echo "User ID: $USER_ID"
echo ""

# Test Stats
echo "1. Testing Stats..."
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$LAMBDA_URL/logs/stats" \
  -H "x-user-id: $USER_ID")

http_code=$(echo "$response" | grep "HTTP_CODE" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_CODE/d')

echo "Response:"
echo "$body" | jq . 2>/dev/null || echo "$body"
echo "HTTP Status: $http_code"
echo ""

if [ "$http_code" = "200" ]; then
    echo "✅ Stats fetch successful!"
else
    echo "❌ Stats fetch failed!"
fi

# Test Events
echo ""
echo "2. Testing Events (first page)..."
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$LAMBDA_URL/logs/events?page=1&limit=10" \
  -H "x-user-id: $USER_ID")

http_code=$(echo "$response" | grep "HTTP_CODE" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_CODE/d')

echo "Response (first 500 chars):"
echo "$body" | head -c 500
echo "..."
echo "HTTP Status: $http_code"
echo ""

if [ "$http_code" = "200" ]; then
    echo "✅ Events fetch successful!"
    TOTAL=$(echo "$body" | jq -r '.total' 2>/dev/null)
    if [ -n "$TOTAL" ]; then
        echo "Total logs: $TOTAL"
    fi
else
    echo "❌ Events fetch failed!"
fi

# Test Search
echo ""
echo "3. Testing Search..."
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$LAMBDA_URL/logs/search?field=src_ip&q=192.168" \
  -H "x-user-id: $USER_ID")

http_code=$(echo "$response" | grep "HTTP_CODE" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_CODE/d')

echo "Response (first 300 chars):"
echo "$body" | head -c 300
echo "..."
echo "HTTP Status: $http_code"
echo ""

if [ "$http_code" = "200" ]; then
    echo "✅ Search successful!"
else
    echo "❌ Search failed!"
fi


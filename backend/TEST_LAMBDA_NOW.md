# Testing Your Lambda Function - Quick Guide

## Prerequisites
- ✅ Lambda function uploaded
- ✅ Environment variables set (DB_HOST, DB_NAME, DB_USER, DB_PASSWORD, DB_PORT, JWT_SECRET)
- ✅ Admin user created in database (username: `admin`, password: `admin123`)

---

## Method 1: Test in Lambda Console (Easiest)

### Step 1: Create Test Event

1. Go to AWS Lambda Console → Your function
2. Click **"Test"** tab
3. Click **"Create new test event"**
4. Choose **"API Gateway AWS Proxy"** template
5. Use this JSON (replace with your user ID if different):

```json
{
  "httpMethod": "GET",
  "path": "/health",
  "headers": {},
  "queryStringParameters": null,
  "body": null,
  "isBase64Encoded": false
}
```

6. Save as "health-check"
7. Click **"Test"**

### Step 2: Test Login

Create another test event for login:

```json
{
  "httpMethod": "POST",
  "path": "/auth/login",
  "headers": {
    "Content-Type": "application/json"
  },
  "queryStringParameters": null,
  "body": "{\"username\":\"admin\",\"password\":\"admin123\"}",
  "isBase64Encoded": false
}
```

Save as "login" and test it.

**Expected Response:**
```json
{
  "statusCode": 200,
  "body": "{\"success\":true,\"user\":{\"id\":1,\"username\":\"admin\",...}}"
}
```

Note the `user.id` from the response - you'll need it for other endpoints.

### Step 3: Test Other Endpoints

Use the test events in `test-events/` folder, or create your own.

---

## Method 2: Test via Function URL

### Step 1: Create Function URL

1. Go to Lambda → **Configuration** → **Function URL**
2. Click **"Create function URL"**
3. Auth type: **NONE** (or AWS_IAM if you want auth)
4. Enable CORS: **Yes**
5. Click **"Save"**
6. Copy the Function URL

### Step 2: Test with curl

```bash
# Health check
curl https://your-function-url.lambda-url.us-east-1.on.aws/health

# Login
curl -X POST https://your-function-url.lambda-url.us-east-1.on.aws/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get stats (replace USER_ID with the id from login response)
curl https://your-function-url.lambda-url.us-east-1.on.aws/logs/stats \
  -H "x-user-id: 1"
```

---

## Method 3: Test via API Gateway

If you've set up API Gateway:

1. Go to API Gateway Console
2. Find your API
3. Click on a resource (e.g., `/health`)
4. Click **"TEST"**
5. Or use the Invoke URL from Stages

---

## Quick Test Checklist

### ✅ Health Check
```bash
GET /health
Expected: {"status":"ok"}
```

### ✅ Login
```bash
POST /auth/login
Body: {"username":"admin","password":"admin123"}
Expected: User object with id
```

### ✅ Get Profile
```bash
GET /auth/profile
Header: x-user-id: 1
Expected: User profile with stats
```

### ✅ Get Stats
```bash
GET /logs/stats
Header: x-user-id: 1
Expected: Dashboard statistics
```

### ✅ Get Events
```bash
GET /logs/events?page=1&limit=10
Header: x-user-id: 1
Expected: List of web logs
```

---

## Troubleshooting

### Connection Timeout
- Check RDS security group allows Lambda VPC
- Verify Lambda is in same VPC as RDS
- Check DB_HOST, DB_PORT are correct

### 500 Internal Server Error
- Check CloudWatch logs (Monitor tab → View logs)
- Verify environment variables are set
- Check database connection string

### 401 Unauthorized
- Verify user exists in database
- Check password is correct
- Verify x-user-id header is set

### CORS Errors
- Enable CORS in Function URL settings
- Or configure CORS in API Gateway

---

## View Logs

1. Go to Lambda → **Monitor** tab
2. Click **"View logs in CloudWatch"**
3. Check for errors and responses

---

## Test Scripts

Use the test scripts in `test-scripts/` folder:

```bash
# Test health (for Function URL)
./test-scripts/test-health.sh https://your-function-url.lambda-url.us-east-1.on.aws

# Test auth
./test-scripts/test-auth.sh https://your-function-url.lambda-url.us-east-1.on.aws admin admin123

# Test logs (replace USER_ID)
./test-scripts/test-logs.sh https://your-function-url.lambda-url.us-east-1.on.aws 1
```


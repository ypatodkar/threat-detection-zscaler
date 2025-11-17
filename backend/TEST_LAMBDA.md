# Testing Lambda Function

## Method 1: Test Locally First (Recommended)

Before deploying to Lambda, test locally to ensure everything works.

### Step 1: Set Environment Variables

Create a `.env` file in the backend directory:

```bash
DB_HOST=your-rds-endpoint.xxxxx.us-east-1.rds.amazonaws.com
DB_NAME=threat_detection
DB_USER=postgres
DB_PASSWORD=your-password
DB_PORT=5432
JWT_SECRET=your-random-secret-key
```

### Step 2: Run Locally

```bash
cd backend
npm install
npm start
```

### Step 3: Test Endpoints

Use the test scripts provided or curl commands (see below).

---

## Method 2: Test in AWS Lambda Console

### Step 1: Upload Your Function

1. Go to AWS Lambda Console
2. Create/Select your function
3. Upload `threat-detection-lambda.zip`
4. Set handler: `serverless-handler.handler`
5. Set environment variables

### Step 2: Test with Sample Events

Use the test events provided in `test-events/` folder or create your own.

### Step 3: View Logs

- Go to "Monitor" tab → "View logs in CloudWatch"
- Check for errors and responses

---

## Method 3: Test via API Gateway / Function URL

### Create Function URL

1. Go to Lambda → Configuration → Function URL
2. Click "Create function URL"
3. Enable CORS if needed
4. Copy the URL

### Test with curl

```bash
# Health check
curl https://your-function-url.lambda-url.us-east-1.on.aws/health

# Login
curl -X POST https://your-function-url.lambda-url.us-east-1.on.aws/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass"}'
```

---

## Test Scripts

See `test-scripts/` folder for automated test scripts.

---

## Common Endpoints to Test

### Health Check
- `GET /health` - Should return `{"status":"ok"}`

### Authentication
- `POST /auth/login` - Login with username/password
- `POST /auth/signup` - Create new user
- `GET /auth/profile` - Get user profile (requires x-user-id header)

### Web Logs
- `GET /logs/events` - List web logs (requires x-user-id header)
- `GET /logs/search` - Search web logs
- `GET /logs/stats` - Get dashboard statistics
- `GET /logs/anomalies` - Get anomalous logs
- `POST /logs/upload` - Upload web log file

### Access Logs
- `GET /access-logs` - List access logs
- `GET /access-logs/search` - Search access logs
- `GET /access-logs/stats` - Get dashboard statistics
- `GET /access-logs/anomalies` - Get anomalous logs
- `POST /access-logs/upload` - Upload access log file

---

## Troubleshooting

### Connection Timeout
- Check RDS security group allows Lambda VPC
- Verify Lambda is in same VPC as RDS
- Check DB_HOST, DB_PORT are correct

### 500 Internal Server Error
- Check CloudWatch logs
- Verify environment variables are set
- Check database connection string

### CORS Errors
- Enable CORS in Function URL settings
- Or configure CORS in API Gateway


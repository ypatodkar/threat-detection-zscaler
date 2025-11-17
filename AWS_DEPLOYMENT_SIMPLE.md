# AWS Deployment Guide (Without S3)

This guide covers deploying the Threat Detection System to AWS **without file storage**:
- **AWS Amplify** - Frontend (React app)
- **AWS Lambda** - Backend API (Express.js)
- **Aurora PostgreSQL** or **RDS PostgreSQL** - Database

## Architecture Overview

```
┌─────────────┐
│   Amplify   │ → React Frontend
└─────────────┘
       ↓
┌─────────────┐
│ API Gateway │ → Routes requests
└─────────────┘
       ↓
┌─────────────┐
│   Lambda    │ → Express.js API (processes files in memory)
└─────────────┘
       ↓
┌─────────────┐
│ Aurora/RDS  │ → PostgreSQL Database
└─────────────┘
```

## Step 1: Set Up Database (Aurora PostgreSQL or RDS)

### Option A: Aurora PostgreSQL (Recommended)

**Via AWS Console:**

1. Go to **RDS Console** → Click **"Create database"**
2. Choose **"Aurora PostgreSQL"**
3. **Template**: Select "Production" or "Dev/Test" based on your needs
4. **DB cluster identifier**: `threat-detection-db`
5. **Master username**: `admin` (or your choice)
6. **Master password**: Create a strong password (save it!)
7. **DB instance class**: 
   - Dev/Test: `db.t3.medium` (~$50/month)
   - Production: `db.r6g.large` or larger
8. **VPC**: Use default VPC or create new
9. **Public access**: Enable "Yes" (needed for Lambda access)
10. **VPC security group**: Create new or use existing
11. Click **"Create database"**
12. Wait 5-10 minutes for creation
13. **Note the endpoint URL** from the database details page

### Option B: RDS PostgreSQL (Simpler, Cost-Effective)

**Via AWS Console:**

1. Go to **RDS Console** → Click **"Create database"**
2. Choose **"PostgreSQL"**
3. **Template**: 
   - Free tier: `db.t3.micro` (750 hours/month free for 12 months)
   - Production: `db.t3.small` or larger
4. **DB instance identifier**: `threat-detection-db`
5. **Master username**: `admin`
6. **Master password**: Create strong password (save it!)
7. **DB instance class**: 
   - Free tier: `db.t3.micro`
   - Production: `db.t3.small` (~$15/month)
8. **Storage**: 20 GB (free tier) or more
9. **Public access**: Enable "Yes"
10. **VPC security group**: Create new
11. Click **"Create database"**
12. Wait 5-10 minutes
13. **Note the endpoint URL**

### Configure Security Group

1. Go to **EC2 Console** → **Security Groups**
2. Find the security group created for your database
3. Click **"Edit inbound rules"**
4. Add rule:
   - **Type**: PostgreSQL
   - **Port**: 5432
   - **Source**: 
     - For Lambda: Select the Lambda security group (after creating Lambda)
     - For testing: Your IP address (temporarily)
5. Click **"Save rules"**

### Initialize Database

**Connect from your local machine (for initial setup):**

```bash
# Install PostgreSQL client if needed
# macOS: brew install postgresql
# Linux: sudo apt-get install postgresql-client

# Connect to your database
psql -h [YOUR-RDS-ENDPOINT] -U admin -d postgres

# Example:
# psql -h threat-detection-db.cluster-xxxxx.us-east-1.rds.amazonaws.com -U admin -d postgres
```

**Run migrations:**

```sql
-- Copy and paste the contents of these files:
-- 1. backend/db/migrations.sql
-- 2. backend/db/create-access-logs-table.sql
-- 3. backend/db/create-search-indexes.sql

-- Or run from command line:
```

```bash
# From your project root
psql -h [YOUR-RDS-ENDPOINT] -U admin -d postgres -f backend/db/migrations.sql
psql -h [YOUR-RDS-ENDPOINT] -U admin -d postgres -f backend/db/create-access-logs-table.sql
psql -h [YOUR-RDS-ENDPOINT] -U admin -d postgres -f backend/db/create-search-indexes.sql
```

**Verify tables created:**

```sql
\dt  -- List all tables
SELECT * FROM users LIMIT 1;
```

## Step 2: Prepare Backend for Lambda

### Install Serverless Framework

```bash
cd backend
npm install -g serverless
npm install --save-dev serverless-offline
npm install serverless-http
```

### Create `serverless-handler.js`

Create a new file `backend/serverless-handler.js`:

```javascript
import serverless from 'serverless-http';
import app from './server.js';

// Export the Express app wrapped in serverless-http
export const handler = serverless(app, {
  binary: ['image/*', 'application/octet-stream']
});
```

### Create `serverless.yml`

Create `backend/serverless.yml`:

```yaml
service: threat-detection-api

frameworkVersion: '3'

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  timeout: 30
  memorySize: 1024
  environment:
    NODE_ENV: production
    DB_HOST: ${env:DB_HOST}
    DB_PORT: ${env:DB_PORT}
    DB_NAME: ${env:DB_NAME}
    DB_USER: ${env:DB_USER}
    DB_PASSWORD: ${env:DB_PASSWORD}
    JWT_SECRET: ${env:JWT_SECRET}
  iamRoleStatements:
    - Effect: Allow
      Action:
        - logs:CreateLogGroup
        - logs:CreateLogStream
        - logs:PutLogEvents
      Resource: '*'

functions:
  api:
    handler: serverless-handler.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors:
            origin: '*'
            headers:
              - Content-Type
              - x-user-id
              - Authorization
            allowCredentials: true
      - http:
          path: /
          method: ANY
          cors:
            origin: '*'
            headers:
              - Content-Type
              - x-user-id
              - Authorization
            allowCredentials: true

plugins:
  - serverless-offline
```

### Update Database Configuration

Update `backend/config/database.js` to handle Lambda environment:

```javascript
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export default pool;
```

### Update File Upload Routes (Process in Memory)

Update `backend/routes/logs.js` - modify the upload route:

```javascript
// Change from file system to memory processing
// The file is already in req.file.buffer, just process it directly
// Remove fs.unlink() calls since we're not saving files
```

Update `backend/routes/accessLogs.js` similarly.

### Update Profile Picture Route (Skip Storage)

Update `backend/routes/auth.js` - modify profile upload:

```javascript
// Option 1: Skip profile picture upload entirely
// Option 2: Store as base64 in database (not recommended for large images)
// Option 3: Remove profile picture feature
```

**Simplest approach - remove profile picture upload:**

```javascript
// In PUT /auth/profile route, remove multer and file handling
// Just update name and email
```

### Update package.json

Add to `backend/package.json`:

```json
{
  "scripts": {
    "deploy": "serverless deploy",
    "deploy:dev": "serverless deploy --stage dev",
    "offline": "serverless offline"
  },
  "dependencies": {
    "serverless-http": "^3.2.0"
  },
  "devDependencies": {
    "serverless": "^3.38.0",
    "serverless-offline": "^13.0.0"
  }
}
```

## Step 3: Deploy Backend to Lambda

### Set Environment Variables

```bash
cd backend

# Set these environment variables
export DB_HOST=your-database-endpoint.cluster-xxxxx.us-east-1.rds.amazonaws.com
export DB_PORT=5432
export DB_NAME=threat_detection
export DB_USER=admin
export DB_PASSWORD=your-database-password
export JWT_SECRET=your-random-secret-key-min-32-chars

# Verify they're set
echo $DB_HOST
```

### Install Dependencies

```bash
npm install
```

### Deploy

```bash
serverless deploy
```

**Expected output:**
```
Service Information
service: threat-detection-api
stage: dev
region: us-east-1
stack: threat-detection-api-dev
resources: 10
api keys:
  None
endpoints:
  ANY - https://xxxxx.execute-api.us-east-1.amazonaws.com/dev/{proxy+}
  ANY - https://xxxxx.execute-api.us-east-1.amazonaws.com/dev/
functions:
  api: threat-detection-api-dev-api
```

**Copy the API Gateway endpoint URL** (e.g., `https://xxxxx.execute-api.us-east-1.amazonaws.com/dev`)

### Update Lambda Security Group

1. Go to **Lambda Console** → Your function → **Configuration** → **VPC**
2. If Lambda needs VPC access, configure it
3. **OR** keep database public and allow Lambda's IP (simpler)

### Test Lambda Function

```bash
# Test locally first
npm run offline

# Then test deployed function
curl https://your-api-url.execute-api.us-east-1.amazonaws.com/dev/logs/stats
```

## Step 4: Deploy Frontend to Amplify

### Option A: Using Amplify Console (Recommended)

**1. Push Code to Git Repository**

```bash
# Initialize git if not already done
cd threat-detection-zscaler
git init
git add .
git commit -m "Initial commit"

# Push to GitHub/GitLab/Bitbucket
git remote add origin https://github.com/yourusername/threat-detection.git
git push -u origin main
```

**2. Connect to Amplify**

1. Go to **AWS Amplify Console**
2. Click **"New app"** → **"Host web app"**
3. Choose your Git provider (GitHub, GitLab, Bitbucket)
4. Authorize AWS to access your repository
5. Select your repository: `threat-detection`
6. Select branch: `main` (or `master`)

**3. Configure Build Settings**

Amplify will auto-detect, but verify:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - npm install
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: frontend/dist
    files:
      - '**/*'
  cache:
    paths:
      - frontend/node_modules/**/*
```

**4. Add Environment Variables**

In Amplify Console → **App settings** → **Environment variables**:

```
VITE_API_URL=https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/dev
```

**5. Deploy**

Click **"Save and deploy"**

Wait 5-10 minutes for deployment to complete.

**6. Get Your Amplify URL**

After deployment, you'll get a URL like:
`https://main.xxxxx.amplifyapp.com`

### Option B: Using Amplify CLI

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Configure (first time only)
amplify configure

# Initialize Amplify in frontend directory
cd frontend
amplify init

# Follow prompts:
# - Project name: threat-detection-frontend
# - Environment: dev
# - Default editor: (your choice)
# - App type: javascript
# - Framework: react
# - Source directory: src
# - Build directory: dist
# - Distribution directory: dist
# - Build command: npm run build
# - Start command: npm run dev

# Add hosting
amplify add hosting

# Choose: Hosting with Amplify Console
# Type: Manual deployment

# Publish
amplify publish
```

## Step 5: Update Frontend API Configuration

### Create API Config File

Create `frontend/src/config/api.js`:

```javascript
// Get API URL from environment variable or use default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default API_URL;
```

### Update All API Calls

Update files to use the config:

**Example for `frontend/src/pages/Events.jsx`:**

```javascript
import API_URL from '../config/api';

// Replace all instances of:
// 'http://localhost:3001/logs/events'
// With:
// `${API_URL}/logs/events`
```

**Files to update:**
- `frontend/src/pages/Events.jsx`
- `frontend/src/pages/AccessLogs.jsx`
- `frontend/src/pages/Upload.jsx`
- `frontend/src/pages/Profile.jsx`
- `frontend/src/pages/Login.jsx`
- `frontend/src/pages/Signup.jsx`
- `frontend/src/components/ThreatDetectionWidget.jsx`
- `frontend/src/components/AccessLogsWidget.jsx`

**Quick find and replace:**
```javascript
// Find: http://localhost:3001
// Replace with: API_URL (after importing)
```

## Step 6: Configure CORS

Update `backend/server.js`:

```javascript
import cors from 'cors';

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-amplify-app.amplifyapp.com',
    'https://*.amplifyapp.com' // Allow all Amplify apps
  ],
  credentials: true
}));
```

## Step 7: Test Deployment

### Test Database Connection

```bash
# From Lambda logs or test endpoint
curl https://your-api-url/logs/stats
```

### Test Frontend

1. Visit your Amplify URL
2. Try logging in
3. Upload a test log file
4. Check if data appears in dashboard

## Step 8: Security Hardening

### 1. Database Security Group

- Remove public access if possible
- Only allow Lambda security group access
- Use VPC endpoints for private access

### 2. Environment Variables

Use AWS Secrets Manager for sensitive data:

```bash
# Store database credentials in Secrets Manager
aws secretsmanager create-secret \
  --name threat-detection-db-credentials \
  --secret-string '{"host":"endpoint","port":"5432","dbname":"threat_detection","username":"admin","password":"your-password"}'
```

Then update Lambda to fetch from Secrets Manager.

### 3. API Gateway

- Add API keys for rate limiting
- Enable CloudWatch logging
- Set up WAF rules if needed

## Troubleshooting

### Lambda Can't Connect to Database

1. Check security group allows Lambda
2. Verify database is publicly accessible
3. Check Lambda VPC configuration
4. Test connection from Lambda logs

### CORS Errors

1. Verify CORS origin includes Amplify URL
2. Check API Gateway CORS settings
3. Ensure headers are allowed

### File Upload Timeout

1. Increase Lambda timeout (max 30s for API Gateway)
2. Consider direct S3 upload (if you add it later)
3. Process files in chunks

## Cost Estimate

- **RDS PostgreSQL (db.t3.small)**: ~$15-30/month
- **Aurora PostgreSQL (db.t3.medium)**: ~$50-100/month
- **Lambda**: ~$0-5/month (1M free requests/month)
- **API Gateway**: ~$0-5/month (1M free requests/month)
- **Amplify**: Free tier available, then ~$0.15/GB served

**Total: ~$15-35/month (RDS) or ~$50-110/month (Aurora)**

## Next Steps

1. Set up custom domain for Amplify
2. Configure CloudWatch alarms
3. Set up database backups
4. Implement CI/CD pipeline
5. Add monitoring and logging


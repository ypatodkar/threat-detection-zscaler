# Step-by-Step AWS Deployment (No S3)

## Quick Checklist

- [ ] Step 1: Create Database (15 min)
- [ ] Step 2: Initialize Database (10 min)
- [ ] Step 3: Prepare Backend (20 min)
- [ ] Step 4: Deploy Backend (10 min)
- [ ] Step 5: Deploy Frontend (15 min)
- [ ] Step 6: Test Everything (10 min)

**Total Time: ~1.5 hours**

---

## Step 1: Create Database (15 minutes)

### Via AWS Console:

1. **Go to RDS Console**
   - AWS Console → Search "RDS" → Click "Databases"

2. **Click "Create database"**

3. **Choose Database:**
   - **Option A (Recommended for production)**: Aurora PostgreSQL
   - **Option B (Cost-effective)**: PostgreSQL

4. **Fill in Details:**
   ```
   Template: Dev/Test (or Production)
   DB identifier: threat-detection-db
   Master username: admin
   Master password: [Create strong password - SAVE THIS!]
   DB instance class: db.t3.small (or db.t3.medium for Aurora)
   ```

5. **Network Settings:**
   - VPC: Default VPC
   - Public access: **Yes** (needed for Lambda)
   - VPC security group: Create new
   - Security group name: `threat-detection-db-sg`

6. **Click "Create database"**

7. **Wait 5-10 minutes** for database to be available

8. **Note the endpoint URL:**
   - Go to database details
   - Copy the "Endpoint" (e.g., `threat-detection-db.cluster-xxxxx.us-east-1.rds.amazonaws.com`)

### Configure Security Group:

1. **Go to EC2 Console** → **Security Groups**
2. **Find** `threat-detection-db-sg`
3. **Edit inbound rules:**
   - Add rule:
     - Type: PostgreSQL
     - Port: 5432
     - Source: `0.0.0.0/0` (temporarily for setup, restrict later)
4. **Save rules**

---

## Step 2: Initialize Database (10 minutes)

### Connect to Database:

```bash
# Install PostgreSQL client (if not installed)
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql-client

# Connect (replace with your endpoint)
psql -h threat-detection-db.cluster-xxxxx.us-east-1.rds.amazonaws.com -U admin -d postgres
```

### Run Migrations:

```bash
# From project root directory
cd threat-detection-zscaler

# Run migrations
psql -h [YOUR-ENDPOINT] -U admin -d postgres -f backend/db/migrations.sql
psql -h [YOUR-ENDPOINT] -U admin -d postgres -f backend/db/create-access-logs-table.sql
psql -h [YOUR-ENDPOINT] -U admin -d postgres -f backend/db/create-search-indexes.sql
```

### Verify:

```bash
psql -h [YOUR-ENDPOINT] -U admin -d postgres -c "\dt"
# Should show: users, web_logs, access_logs tables
```

---

## Step 3: Prepare Backend (20 minutes)

### Install Dependencies:

```bash
cd backend
npm install serverless-http
npm install --save-dev serverless serverless-offline
```

### Create Files:

**1. Create `backend/serverless-handler.js`:**

```javascript
import serverless from 'serverless-http';
import app from './server.js';

export const handler = serverless(app, {
  binary: ['image/*', 'application/octet-stream']
});
```

**2. Create `backend/serverless.yml`:**

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

**3. Update `backend/routes/logs.js`:**

Remove file deletion after processing (since we're not saving):

```javascript
// In POST /logs/upload route, remove or comment out:
// fs.unlink(req.file.path, (err) => { ... });
```

**4. Update `backend/routes/accessLogs.js`:**

Same as above - remove file deletion.

**5. Update `backend/routes/auth.js`:**

Remove profile picture upload functionality:

```javascript
// Remove multer import and configuration
// In PUT /auth/profile, remove file upload handling
// Just update name and email fields
```

**6. Update `backend/config/database.js`:**

Ensure SSL is enabled for production:

```javascript
ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
```

---

## Step 4: Deploy Backend (10 minutes)

### Set Environment Variables:

```bash
cd backend

export DB_HOST=your-database-endpoint.cluster-xxxxx.us-east-1.rds.amazonaws.com
export DB_PORT=5432
export DB_NAME=threat_detection
export DB_USER=admin
export DB_PASSWORD=your-database-password
export JWT_SECRET=generate-random-secret-key-min-32-characters
```

### Deploy:

```bash
# Install serverless globally if not already
npm install -g serverless

# Deploy
serverless deploy
```

### Copy API URL:

After deployment, you'll see output like:
```
endpoints:
  ANY - https://xxxxx.execute-api.us-east-1.amazonaws.com/dev/{proxy+}
```

**Copy this URL** (e.g., `https://xxxxx.execute-api.us-east-1.amazonaws.com/dev`)

### Test:

```bash
curl https://your-api-url.execute-api.us-east-1.amazonaws.com/dev/logs/stats
```

---

## Step 5: Deploy Frontend (15 minutes)

### Push to Git:

```bash
cd threat-detection-zscaler

# If not already a git repo
git init
git add .
git commit -m "Ready for deployment"

# Push to GitHub/GitLab/Bitbucket
git remote add origin https://github.com/yourusername/threat-detection.git
git push -u origin main
```

### Create API Config:

**Create `frontend/src/config/api.js`:**

```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
export default API_URL;
```

### Update All API Calls:

**Quick script to update all files:**

Find and replace in these files:
- `frontend/src/pages/Events.jsx`
- `frontend/src/pages/AccessLogs.jsx`
- `frontend/src/pages/Upload.jsx`
- `frontend/src/pages/Profile.jsx`
- `frontend/src/pages/Login.jsx`
- `frontend/src/pages/Signup.jsx`
- `frontend/src/components/ThreatDetectionWidget.jsx`
- `frontend/src/components/AccessLogsWidget.jsx`

**Replace:**
```javascript
// OLD:
import axios from 'axios';
const response = await axios.get('http://localhost:3001/logs/events');

// NEW:
import axios from 'axios';
import API_URL from '../config/api';
const response = await axios.get(`${API_URL}/logs/events`);
```

### Deploy via Amplify Console:

1. **Go to AWS Amplify Console**
2. **Click "New app"** → **"Host web app"**
3. **Connect repository:**
   - Choose GitHub/GitLab/Bitbucket
   - Authorize AWS
   - Select repository: `threat-detection`
   - Select branch: `main`

4. **Build settings** (auto-detected, but verify):
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
   ```

5. **Environment variables:**
   - Key: `VITE_API_URL`
   - Value: `https://your-api-url.execute-api.us-east-1.amazonaws.com/dev`

6. **Click "Save and deploy"**

7. **Wait 5-10 minutes** for deployment

8. **Get your Amplify URL:**
   - After deployment: `https://main.xxxxx.amplifyapp.com`

---

## Step 6: Test Everything (10 minutes)

### Test Frontend:

1. Visit your Amplify URL
2. Try to sign up
3. Log in
4. Upload a test log file
5. Check dashboard shows data
6. Test search functionality

### Test Backend:

```bash
# Test API directly
curl https://your-api-url/logs/stats

# Check Lambda logs
# AWS Console → Lambda → Your function → Monitor → View logs
```

### Common Issues:

**CORS Error:**
- Update `backend/server.js` CORS origin to include Amplify URL

**Database Connection Error:**
- Check security group allows Lambda
- Verify database endpoint is correct
- Check Lambda environment variables

**File Upload Timeout:**
- Increase Lambda timeout in `serverless.yml`
- Process files in smaller chunks

---

## Done! 🎉

Your application is now live on AWS:
- **Frontend**: `https://main.xxxxx.amplifyapp.com`
- **Backend API**: `https://xxxxx.execute-api.us-east-1.amazonaws.com/dev`
- **Database**: Running on RDS/Aurora

## Next Steps:

1. Set up custom domain
2. Configure database backups
3. Set up CloudWatch alarms
4. Add monitoring
5. Restrict database security group to Lambda only


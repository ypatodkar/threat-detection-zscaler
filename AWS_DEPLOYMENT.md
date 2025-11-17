# AWS Deployment Guide

This guide covers deploying the Threat Detection System to AWS using:
- **AWS Amplify** - Frontend (React app)
- **AWS Lambda** - Backend API (Express.js)
- **Aurora PostgreSQL** or **RDS PostgreSQL** - Database
- **S3** - File storage (log uploads, profile pictures)

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
│   Lambda    │ → Express.js API
└─────────────┘
       ↓
┌─────────────┐
│ Aurora/RDS  │ → PostgreSQL Database
└─────────────┘
       ↓
┌─────────────┐
│     S3      │ → File Storage
└─────────────┘
```

## Prerequisites

1. AWS Account with appropriate permissions
2. AWS CLI installed and configured
3. Node.js and npm installed
4. PostgreSQL client tools (for database setup)

## Step 1: Set Up Database (Aurora PostgreSQL or RDS)

### Option A: Aurora PostgreSQL (Recommended for scalability)

```bash
# Using AWS Console:
1. Go to RDS Console → Create Database
2. Choose "Aurora PostgreSQL"
3. Select template: "Production" or "Dev/Test"
4. DB cluster identifier: threat-detection-db
5. Master username: admin (or your choice)
6. Master password: [strong password]
7. DB instance class: db.t3.medium (or larger for production)
8. Enable "Public access" if Lambda needs direct access
9. Create VPC security group allowing PostgreSQL (port 5432)
10. Note the endpoint URL
```

### Option B: RDS PostgreSQL (Simpler, cost-effective)

```bash
# Using AWS Console:
1. Go to RDS Console → Create Database
2. Choose "PostgreSQL"
3. Template: "Free tier" or "Production"
4. DB instance identifier: threat-detection-db
5. Master username: admin
6. Master password: [strong password]
7. DB instance class: db.t3.micro (free tier) or db.t3.small+
8. Enable "Public access" if needed
9. Create security group
10. Note the endpoint URL
```

### Database Setup

```bash
# Connect to your database
psql -h [your-rds-endpoint] -U admin -d postgres

# Run migrations
\i backend/db/migrations.sql
\i backend/db/create-search-indexes.sql
\i backend/db/create-access-logs-table.sql

# Create indexes
\i backend/db/create-search-indexes.sql
```

## Step 2: Set Up S3 Buckets

```bash
# Create buckets for file storage
aws s3 mb s3://threat-detection-uploads --region us-east-1
aws s3 mb s3://threat-detection-profiles --region us-east-1

# Set up CORS for Amplify
# Create cors-config.json:
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://your-amplify-app.amplifyapp.com"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}

aws s3api put-bucket-cors --bucket threat-detection-uploads --cors-configuration file://cors-config.json
aws s3api put-bucket-cors --bucket threat-detection-profiles --cors-configuration file://cors-config.json
```

## Step 3: Convert Express App to Lambda

### Install Serverless Framework

```bash
npm install -g serverless
npm install --save-dev serverless-offline
```

### Create `serverless.yml`

```yaml
service: threat-detection-api

frameworkVersion: '3'

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    NODE_ENV: production
    DB_HOST: ${env:DB_HOST}
    DB_PORT: ${env:DB_PORT}
    DB_NAME: ${env:DB_NAME}
    DB_USER: ${env:DB_USER}
    DB_PASSWORD: ${env:DB_PASSWORD}
    JWT_SECRET: ${env:JWT_SECRET}
    S3_UPLOADS_BUCKET: threat-detection-uploads
    S3_PROFILES_BUCKET: threat-detection-profiles
  iamRoleStatements:
    - Effect: Allow
      Action:
        - s3:GetObject
        - s3:PutObject
        - s3:DeleteObject
      Resource:
        - arn:aws:s3:::threat-detection-uploads/*
        - arn:aws:s3:::threat-detection-profiles/*

functions:
  api:
    handler: serverless-handler.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true
      - http:
          path: /
          method: ANY
          cors: true

plugins:
  - serverless-offline
```

### Create `serverless-handler.js`

```javascript
import serverless from 'serverless-http';
import app from './server.js';

// Export the Express app wrapped in serverless-http
export const handler = serverless(app);
```

### Update `backend/package.json`

```json
{
  "name": "threat-detection-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "deploy": "serverless deploy",
    "deploy:dev": "serverless deploy --stage dev"
  },
  "dependencies": {
    "serverless-http": "^3.2.0",
    // ... other dependencies
  },
  "devDependencies": {
    "serverless": "^3.38.0",
    "serverless-offline": "^13.0.0"
  }
}
```

### Update Database Connection for Lambda

Update `backend/config/database.js`:

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

### Update File Upload to Use S3

Install AWS SDK:
```bash
npm install @aws-sdk/client-s3
```

Update `backend/routes/auth.js` for profile pictures:

```javascript
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const UPLOADS_BUCKET = process.env.S3_UPLOADS_BUCKET;
const PROFILES_BUCKET = process.env.S3_PROFILES_BUCKET;

// In profile upload route:
const fileExtension = path.extname(file.originalname);
const fileName = `profile-${userId}-${Date.now()}${fileExtension}`;

const uploadParams = {
  Bucket: PROFILES_BUCKET,
  Key: fileName,
  Body: file.buffer,
  ContentType: file.mimetype,
};

await s3Client.send(new PutObjectCommand(uploadParams));
const profilePictureUrl = `https://${PROFILES_BUCKET}.s3.amazonaws.com/${fileName}`;
```

## Step 4: Deploy Backend to Lambda

```bash
cd backend

# Set environment variables
export DB_HOST=your-aurora-endpoint.cluster-xxxxx.us-east-1.rds.amazonaws.com
export DB_PORT=5432
export DB_NAME=threat_detection
export DB_USER=admin
export DB_PASSWORD=your-password
export JWT_SECRET=your-secret-key

# Deploy
npm install
serverless deploy

# Note the API Gateway endpoint URL from output
```

## Step 5: Deploy Frontend to Amplify

### Option A: Using Amplify Console (Recommended)

1. **Push code to Git repository** (GitHub, GitLab, or Bitbucket)

2. **Connect to Amplify**:
   - Go to AWS Amplify Console
   - Click "New app" → "Host web app"
   - Connect your repository
   - Select branch (main/master)

3. **Configure Build Settings**:
   - Build command: `cd frontend && npm install && npm run build`
   - Output directory: `frontend/dist`

4. **Environment Variables**:
   ```
   VITE_API_URL=https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod
   ```

5. **Deploy**: Click "Save and deploy"

### Option B: Using Amplify CLI

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli
amplify configure

# Initialize Amplify in frontend directory
cd frontend
amplify init

# Add hosting
amplify add hosting

# Deploy
amplify publish
```

### Update Frontend API URLs

Update `frontend/src/pages/Events.jsx`, `AccessLogs.jsx`, etc.:

```javascript
// Create config file: frontend/src/config/api.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default API_URL;
```

Then update all axios calls:
```javascript
import API_URL from '../config/api';
const response = await axios.get(`${API_URL}/logs/events`);
```

## Step 6: Configure CORS

Update `backend/server.js`:

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-amplify-app.amplifyapp.com'
  ],
  credentials: true
}));
```

## Step 7: Security Considerations

### 1. Database Security Group
- Only allow Lambda security group to access RDS
- Remove public access if possible

### 2. Lambda Environment Variables
- Use AWS Secrets Manager for sensitive data:
```javascript
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const secretsClient = new SecretsManagerClient({ region: 'us-east-1' });
const secret = await secretsClient.send(new GetSecretValueCommand({
  SecretId: 'threat-detection-db-credentials'
}));
```

### 3. API Gateway Authentication
- Consider adding API keys or Cognito authentication
- Rate limiting on API Gateway

### 4. S3 Bucket Policies
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::threat-detection-uploads/*"
    }
  ]
}
```

## Step 8: Cost Optimization

### Aurora vs RDS
- **Aurora**: Better for high availability, auto-scaling, but more expensive
- **RDS**: More cost-effective, simpler, good for smaller workloads

### Lambda Configuration
- Set appropriate timeout (30s for file uploads)
- Configure memory based on needs (512MB-1GB)
- Use provisioned concurrency only if needed

### S3 Storage Classes
- Use S3 Standard for active files
- Consider lifecycle policies for old logs

## Troubleshooting

### Lambda Timeout Issues
- Increase timeout for file upload endpoints
- Consider using S3 pre-signed URLs for direct uploads

### Database Connection Issues
- Check security group rules
- Verify VPC configuration
- Test connection from Lambda using VPC endpoint

### CORS Errors
- Verify CORS configuration in Express
- Check API Gateway CORS settings
- Ensure Amplify URL is in allowed origins

## Monitoring

### CloudWatch
- Monitor Lambda execution logs
- Set up alarms for errors
- Track database connections

### X-Ray (Optional)
- Enable AWS X-Ray for distributed tracing
- Helps debug API Gateway → Lambda → RDS flow

## Estimated Monthly Costs (US East 1)

- **Aurora PostgreSQL (db.t3.medium)**: ~$50-100/month
- **RDS PostgreSQL (db.t3.small)**: ~$15-30/month
- **Lambda**: ~$0-5/month (pay per request)
- **API Gateway**: ~$0-5/month (first 1M requests free)
- **S3**: ~$1-5/month (storage + requests)
- **Amplify**: Free tier available, then ~$0.15/GB served

**Total (RDS)**: ~$20-50/month
**Total (Aurora)**: ~$55-115/month

## Next Steps

1. Set up CI/CD pipeline
2. Configure custom domain for Amplify
3. Set up CloudFront for S3 assets
4. Implement backup strategy for database
5. Set up monitoring and alerting


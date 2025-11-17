# Quick AWS Deployment Checklist

## 1. Database Setup (15 minutes)

```bash
# Create Aurora PostgreSQL or RDS PostgreSQL via AWS Console
# Note: Endpoint, Username, Password

# Connect and run migrations
psql -h [endpoint] -U admin -d postgres
\i backend/db/migrations.sql
\i backend/db/create-access-logs-table.sql
\i backend/db/create-search-indexes.sql
```

## 2. S3 Buckets (5 minutes)

```bash
aws s3 mb s3://threat-detection-uploads --region us-east-1
aws s3 mb s3://threat-detection-profiles --region us-east-1
```

## 3. Backend Setup (30 minutes)

```bash
cd backend

# Install dependencies
npm install serverless-http @aws-sdk/client-s3

# Copy serverless config
cp serverless.yml.example serverless.yml

# Set environment variables
export DB_HOST=your-endpoint.cluster-xxxxx.us-east-1.rds.amazonaws.com
export DB_PORT=5432
export DB_NAME=threat_detection
export DB_USER=admin
export DB_PASSWORD=your-password
export JWT_SECRET=your-random-secret-key

# Create serverless-handler.js (see AWS_DEPLOYMENT.md)

# Deploy
npm install -g serverless
serverless deploy
```

## 4. Frontend Setup (20 minutes)

```bash
cd frontend

# Update API URL in config
# Create src/config/api.js with your Lambda API Gateway URL

# Push to Git (GitHub/GitLab/Bitbucket)

# Deploy via Amplify Console:
# 1. Go to AWS Amplify Console
# 2. New app → Host web app
# 3. Connect repository
# 4. Build settings:
#    - Build command: cd frontend && npm install && npm run build
#    - Output: frontend/dist
# 5. Environment variable: VITE_API_URL=https://your-api-url
```

## 5. Update Code for AWS

### Create `backend/serverless-handler.js`:
```javascript
import serverless from 'serverless-http';
import app from './server.js';
export const handler = serverless(app);
```

### Update file uploads to use S3 (see AWS_DEPLOYMENT.md for full code)

### Update frontend API calls to use environment variable

## Total Time: ~1-2 hours

## Cost Estimate: $20-50/month (RDS) or $55-115/month (Aurora)


# AWS Deployment Checklist

## Pre-Deployment Setup

### 1. Database Setup (15 min)
- [ ] Create RDS PostgreSQL or Aurora PostgreSQL
- [ ] Note database endpoint URL
- [ ] Configure security group (allow port 5432)
- [ ] Connect to database: `psql -h [endpoint] -U admin -d postgres`
- [ ] Run migrations:
  ```bash
  \i backend/db/migrations.sql
  \i backend/db/create-access-logs-table.sql
  \i backend/db/create-search-indexes.sql
  ```
- [ ] Verify tables created: `\dt`

### 2. Backend Preparation (20 min)
- [ ] Install dependencies: `cd backend && npm install`
- [ ] Install serverless: `npm install -g serverless`
- [ ] Install packages: `npm install serverless-http && npm install --save-dev serverless serverless-offline`
- [ ] Verify `serverless-handler.js` exists
- [ ] Verify `serverless.yml` exists
- [ ] Test locally: `npm run offline` (optional)

### 3. Frontend Preparation (10 min)
- [ ] Create `frontend/src/config/api.js`
- [ ] Update all API calls to use `API_URL` from config
- [ ] Test locally: `cd frontend && npm run dev` (optional)

### 4. Code Changes Made
- [x] Updated `backend/routes/logs.js` - memory storage
- [x] Updated `backend/routes/accessLogs.js` - memory storage
- [x] Updated `backend/routes/auth.js` - removed profile picture upload
- [x] Created `backend/serverless-handler.js`
- [x] Created `backend/serverless.yml`
- [x] Created `frontend/src/config/api.js`

## Deployment Steps

### Step 1: Deploy Backend to Lambda (10 min)

```bash
cd backend

# Set environment variables
export DB_HOST=your-database-endpoint.cluster-xxxxx.us-east-1.rds.amazonaws.com
export DB_PORT=5432
export DB_NAME=threat_detection
export DB_USER=admin
export DB_PASSWORD=your-database-password
export JWT_SECRET=your-random-secret-key-min-32-characters

# Deploy
serverless deploy

# Copy API Gateway URL from output
```

**Expected Output:**
```
endpoints:
  ANY - https://xxxxx.execute-api.us-east-1.amazonaws.com/dev/{proxy+}
```

**Save this URL!**

### Step 2: Deploy Frontend to Amplify (15 min)

**Option A: Via Console (Recommended)**

1. Push code to Git:
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. Go to AWS Amplify Console
3. Click "New app" → "Host web app"
4. Connect repository (GitHub/GitLab/Bitbucket)
5. Select branch: `main`
6. Build settings (auto-detected):
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
7. Add environment variable:
   - Key: `VITE_API_URL`
   - Value: `https://your-api-url.execute-api.us-east-1.amazonaws.com/dev`
8. Click "Save and deploy"
9. Wait 5-10 minutes
10. Copy Amplify URL: `https://main.xxxxx.amplifyapp.com`

**Option B: Via CLI**

```bash
cd frontend
npm install -g @aws-amplify/cli
amplify configure
amplify init
amplify add hosting
amplify publish
```

### Step 3: Update CORS (5 min)

Update `backend/server.js`:

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-amplify-app.amplifyapp.com',
    'https://*.amplifyapp.com'
  ],
  credentials: true
}));
```

Redeploy backend:
```bash
cd backend
serverless deploy
```

## Post-Deployment Testing

- [ ] Visit Amplify URL
- [ ] Test signup
- [ ] Test login
- [ ] Upload a test log file
- [ ] Check dashboard shows data
- [ ] Test search functionality
- [ ] Test profile update (name/email only)

## Troubleshooting

### Database Connection Issues
- Check security group allows Lambda
- Verify endpoint URL is correct
- Check Lambda environment variables
- Test connection from Lambda logs

### CORS Errors
- Update CORS origin in `server.js`
- Redeploy backend
- Clear browser cache

### File Upload Timeout
- Increase Lambda timeout in `serverless.yml` (max 30s)
- Process files in smaller chunks

### API Not Found
- Check API Gateway URL is correct
- Verify Lambda function is deployed
- Check CloudWatch logs

## Cost Estimate

- **RDS PostgreSQL (db.t3.small)**: ~$15-30/month
- **Aurora PostgreSQL (db.t3.medium)**: ~$50-100/month
- **Lambda**: ~$0-5/month (1M free requests)
- **API Gateway**: ~$0-5/month (1M free requests)
- **Amplify**: Free tier available

**Total: ~$15-35/month (RDS) or ~$50-110/month (Aurora)**

## Security Checklist

- [ ] Database security group restricted to Lambda only
- [ ] Strong database password set
- [ ] JWT_SECRET is random and secure
- [ ] Environment variables not committed to Git
- [ ] CORS origins restricted to your domain
- [ ] Database backups enabled


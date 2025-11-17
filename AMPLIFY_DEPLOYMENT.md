# AWS Amplify Deployment Guide

## Prerequisites
- GitHub repository with your code
- AWS Account
- RDS PostgreSQL database (already set up)

## Step 1: Connect Repository to Amplify

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Click **"New app"** → **"Host web app"**
3. Choose **GitHub** and authorize
4. Select your repository and branch
5. Click **"Next"**

## Step 2: Configure Build Settings

### Frontend Build Settings

Amplify will auto-detect React/Vite. Use these settings:

**Build settings:**
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - npm ci
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

**Environment variables:**
- `VITE_API_BASE_URL` - Your API Gateway or Lambda Function URL

### Backend (Lambda) Setup

The backend is already deployed as Lambda. You need to:

1. **Get your Lambda Function URL or API Gateway endpoint**
2. **Set it as environment variable in Amplify:**
   - Go to Amplify App → Environment variables
   - Add: `VITE_API_BASE_URL` = `https://your-lambda-url.lambda-url.us-east-2.on.aws`

## Step 3: Configure Backend Environment Variables

Make sure your Lambda function has these environment variables:
- `DB_HOST` - RDS endpoint
- `DB_NAME` - `threat_detection`
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `DB_PORT` - `5432`
- `JWT_SECRET` - Your secret key

## Step 4: Deploy

1. Review settings and click **"Save and deploy"**
2. Wait for build to complete
3. Your app will be available at: `https://main.xxxxx.amplifyapp.com`

## Step 5: Update Frontend API Configuration

The frontend uses `VITE_API_BASE_URL` from environment variables. Make sure it's set in Amplify.

## Troubleshooting

### CORS Errors
- Ensure Lambda Function URL has CORS enabled
- Or configure CORS in API Gateway

### API Connection Issues
- Verify `VITE_API_BASE_URL` is set correctly
- Check Lambda function is accessible
- Verify RDS security group allows Lambda connections

### Build Failures
- Check build logs in Amplify Console
- Verify all dependencies are in package.json
- Ensure Node.js version matches (18.x or 20.x)

## Next Steps

1. Set up custom domain (optional)
2. Configure CI/CD for automatic deployments
3. Set up monitoring and alerts


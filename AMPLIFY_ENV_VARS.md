# AWS Amplify Environment Variables Setup

## Issue
The frontend is trying to connect to `localhost:3001` which doesn't work on AWS. You need to set the Lambda Function URL as an environment variable.

## Solution: Set Environment Variable in Amplify

### Step 1: Get Your Lambda Function URL

1. Go to **AWS Lambda Console**
2. Select your function
3. Go to **Configuration** → **Function URL**
4. Copy the Function URL (e.g., `https://xxxxx.lambda-url.us-east-2.on.aws`)

### Step 2: Set Environment Variable in Amplify

1. Go to **AWS Amplify Console**
2. Select your app
3. Go to **App settings** → **Environment variables**
4. Click **Manage variables**
5. Add new variable:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: Your Lambda Function URL (e.g., `https://xxxxx.lambda-url.us-east-2.on.aws`)
6. Click **Save**

### Step 3: Redeploy

After adding the environment variable:
1. Go to **App settings** → **Build settings**
2. Click **Redeploy this version** or push a new commit
3. The build will include the new environment variable

## Alternative: Update .amplify.yml

You can also add it to `.amplify.yml`:

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
  environment:
    variables:
      VITE_API_BASE_URL: "https://your-lambda-url.lambda-url.us-east-2.on.aws"
```

## Verify

After deployment, check the browser console. You should see requests going to your Lambda URL instead of localhost.

## Important Notes

- Environment variables starting with `VITE_` are exposed to the frontend
- The variable name must be `VITE_API_BASE_URL` (matches the code)
- Don't include trailing slash in the URL
- Make sure CORS is enabled on your Lambda Function URL


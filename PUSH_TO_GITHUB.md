# Push to GitHub - Quick Guide

## Step 1: Review Changes

```bash
git status
```

## Step 2: Commit All Changes

```bash
git add .
git commit -m "Prepare for Amplify deployment

- Updated .gitignore to exclude build artifacts
- Added Amplify configuration
- Cleaned up unnecessary files
- Updated server.js for Lambda compatibility
- Added SSL support for RDS connections"
```

## Step 3: Create/Update Remote Repository

### If you don't have a remote:
```bash
# Create a new repository on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/threat-detection-zscaler.git
```

### If remote exists but needs update:
```bash
git remote -v  # Check current remote
git remote set-url origin https://github.com/YOUR_USERNAME/threat-detection-zscaler.git
```

## Step 4: Push to GitHub

```bash
git branch -M main  # Ensure you're on main branch
git push -u origin main
```

## Step 5: Verify

1. Go to your GitHub repository
2. Verify all files are there
3. Check that `.gitignore` is working (no node_modules, .env, etc.)

## Next: Deploy to Amplify

See `AMPLIFY_DEPLOYMENT.md` for next steps!


# AWS Free Tier Limit Solutions

## Understanding the Limit

**AWS RDS Free Tier:**
- **750 hours/month** total across ALL instances
- If you have 2 instances running, that's 2 × 730 hours = 1,460 hours/month
- Only **db.t2.micro, db.t3.micro, or db.t4g.micro** qualify
- **12 months** from account creation

**Default Account Limit:**
- **40 DB instances** per account (not free tier specific)

## Solutions

### Option 1: Delete Existing RDS Instances (Recommended)

**Check existing instances:**
```bash
# Via AWS CLI
aws rds describe-db-instances --query 'DBInstances[*].[DBInstanceIdentifier,DBInstanceClass,DBInstanceStatus]' --output table

# Or via Console:
# RDS Console → Databases → Check all instances
```

**Delete unused instances:**
1. Go to **RDS Console** → **Databases**
2. Select instance → **Actions** → **Delete**
3. Uncheck "Create final snapshot" (if not needed)
4. Confirm deletion
5. Wait for deletion to complete

**Then create your new database**

### Option 2: Use Existing Database

If you have an existing PostgreSQL instance:
1. Connect to it
2. Create a new database: `CREATE DATABASE threat_detection;`
3. Run migrations in that database
4. Use that endpoint for your Lambda

### Option 3: Use Local PostgreSQL (Development Only)

For development/testing:
```bash
# Install PostgreSQL locally
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql

# Start PostgreSQL
# macOS: brew services start postgresql
# Ubuntu: sudo systemctl start postgresql

# Create database
createdb threat_detection

# Run migrations
psql -d threat_detection -f backend/db/migrations.sql
```

Then use `localhost` as DB_HOST for local development.

### Option 4: Upgrade Account (If Needed)

If you need production database:
- Upgrade to paid account
- Still use db.t3.micro (~$15/month) for cost savings
- Or use db.t3.small (~$30/month)

### Option 5: Use Aurora Serverless v2 (Pay-per-use)

**Aurora Serverless v2:**
- No free tier, but pay only for what you use
- Auto-scales based on demand
- Good for variable workloads
- ~$0.10/hour when active (minimum 0.5 ACU)

**Cost:** ~$35-70/month for light usage

## Quick Commands

### List All RDS Instances
```bash
aws rds describe-db-instances \
  --query 'DBInstances[*].[DBInstanceIdentifier,DBInstanceClass,Engine,DBInstanceStatus]' \
  --output table
```

### Delete an Instance
```bash
aws rds delete-db-instance \
  --db-instance-identifier your-instance-name \
  --skip-final-snapshot
```

### Check Free Tier Usage
```bash
# Go to AWS Billing Dashboard
# Or use Cost Explorer to see RDS usage
```

## Recommended Approach

1. **Check existing instances** - See what's running
2. **Delete unused instances** - Free up hours
3. **Create new database** - Use db.t3.micro
4. **Monitor usage** - Set up billing alerts

## Alternative: Use Existing Database

If you have a PostgreSQL instance already:

```sql
-- Connect to existing database
psql -h existing-endpoint -U admin -d postgres

-- Create new database for this project
CREATE DATABASE threat_detection;

-- Connect to new database
\c threat_detection

-- Run migrations
\i backend/db/migrations.sql
\i backend/db/create-access-logs-table.sql
\i backend/db/create-search-indexes.sql
```

Then use the existing endpoint with database name `threat_detection`.


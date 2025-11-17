# Using Existing RDS Database - Step by Step

## Step 1: Find Your Existing Database

### Via AWS Console:
1. Go to **AWS Console** → Search "RDS"
2. Click **"Databases"** in the left sidebar
3. You'll see a list of all your RDS instances
4. Find a **PostgreSQL** instance (Engine column)
5. **Note the endpoint URL** (e.g., `my-db.xxxxx.us-east-1.rds.amazonaws.com`)
6. **Note the master username** (usually `admin` or `postgres`)

### Via AWS CLI:
```bash
aws rds describe-db-instances \
  --query 'DBInstances[*].[DBInstanceIdentifier,Endpoint.Address,Engine,MasterUsername]' \
  --output table
```

## Step 2: Connect to Your Database

```bash
# Replace with your actual endpoint and username
psql -h your-database-endpoint.xxxxx.us-east-1.rds.amazonaws.com -U admin -d postgres

# You'll be prompted for the master password
```

**If connection fails:**
- Check security group allows your IP (temporarily)
- Verify endpoint URL is correct
- Check username is correct

## Step 3: Create New Database for Threat Detection

Once connected, run:

```sql
-- Create a new database for this project
CREATE DATABASE threat_detection;

-- Verify it was created
\l
```

You should see `threat_detection` in the list.

## Step 4: Connect to the New Database

```sql
-- Connect to the new database
\c threat_detection

-- Verify you're connected (should show "threat_detection")
SELECT current_database();
```

## Step 5: Run Migrations

### Option A: Copy-paste SQL files

1. Open `backend/db/migrations.sql` in a text editor
2. Copy all the SQL content
3. Paste into psql and press Enter
4. Repeat for:
   - `backend/db/create-access-logs-table.sql`
   - `backend/db/create-search-indexes.sql`

### Option B: Run from command line

```bash
# Exit psql first (type \q)

# Run migrations from your project directory
cd threat-detection-zscaler

psql -h your-endpoint.xxxxx.us-east-1.rds.amazonaws.com \
     -U admin \
     -d threat_detection \
     -f backend/db/migrations.sql

psql -h your-endpoint.xxxxx.us-east-1.rds.amazonaws.com \
     -U admin \
     -d threat_detection \
     -f backend/db/create-access-logs-table.sql

psql -h your-endpoint.xxxxx.us-east-1.rds.amazonaws.com \
     -U admin \
     -d threat_detection \
     -f backend/db/create-search-indexes.sql
```

## Step 6: Verify Tables Created

```bash
psql -h your-endpoint.xxxxx.us-east-1.rds.amazonaws.com -U admin -d threat_detection

# In psql:
\dt

# Should show:
# - users
# - web_logs
# - access_logs
```

## Step 7: Update Lambda Environment Variables

When deploying, use:

```bash
export DB_HOST=your-existing-endpoint.xxxxx.us-east-1.rds.amazonaws.com
export DB_PORT=5432
export DB_NAME=threat_detection  # Your new database name
export DB_USER=admin  # Your existing master username
export DB_PASSWORD=your-existing-password
export JWT_SECRET=your-random-secret-key
```

## Step 8: Test Connection

```bash
# Test from your local machine first
psql -h your-endpoint.xxxxx.us-east-1.rds.amazonaws.com \
     -U admin \
     -d threat_detection \
     -c "SELECT COUNT(*) FROM users;"
```

## Troubleshooting

### "Database does not exist"
- Make sure you created it: `CREATE DATABASE threat_detection;`
- Verify you're connecting to the right database: `\c threat_detection`

### "Permission denied"
- Make sure you're using the master username
- Check if your IP is allowed in security group

### "Connection timeout"
- Check security group allows your IP
- Verify endpoint URL is correct
- Check if database is publicly accessible

### "Relation does not exist"
- Run migrations again
- Check you're in the right database: `SELECT current_database();`

## Quick Reference

```bash
# Connect
psql -h [ENDPOINT] -U [USERNAME] -d postgres

# Create database
CREATE DATABASE threat_detection;

# Connect to new database
\c threat_detection

# Run migrations (from project root)
psql -h [ENDPOINT] -U [USERNAME] -d threat_detection -f backend/db/migrations.sql
psql -h [ENDPOINT] -U [USERNAME] -d threat_detection -f backend/db/create-access-logs-table.sql
psql -h [ENDPOINT] -U [USERNAME] -d threat_detection -f backend/db/create-search-indexes.sql

# Verify
\dt
```


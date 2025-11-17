#!/bin/bash

# Script to set up threat_detection database on existing RDS instance
# Usage: ./setup-existing-db.sh [ENDPOINT] [USERNAME] [DATABASE_NAME]

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get parameters
ENDPOINT=${1:-""}
USERNAME=${2:-"admin"}
DB_NAME=${3:-"threat_detection"}

if [ -z "$ENDPOINT" ]; then
    echo -e "${RED}Error: Database endpoint required${NC}"
    echo "Usage: ./setup-existing-db.sh [ENDPOINT] [USERNAME] [DATABASE_NAME]"
    echo "Example: ./setup-existing-db.sh my-db.xxxxx.us-east-1.rds.amazonaws.com admin threat_detection"
    exit 1
fi

echo -e "${YELLOW}Setting up threat_detection database on existing RDS instance...${NC}"
echo "Endpoint: $ENDPOINT"
echo "Username: $USERNAME"
echo "Database: $DB_NAME"
echo ""

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: psql is not installed${NC}"
    echo "Install PostgreSQL client: brew install postgresql (macOS) or sudo apt-get install postgresql-client (Linux)"
    exit 1
fi

# Get password once
read -sp "Enter database password: " DB_PASSWORD
echo ""
export PGPASSWORD="$DB_PASSWORD"

# Step 1: Create database (connect to postgres database first)
echo -e "${YELLOW}Step 1: Creating database '$DB_NAME'...${NC}"
psql -h "$ENDPOINT" -U "$USERNAME" -d postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "Database may already exist (this is OK)"

# Step 2: Run migrations
echo -e "${YELLOW}Step 2: Running migrations...${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "Running migrations.sql..."
psql -h "$ENDPOINT" -U "$USERNAME" -d "$DB_NAME" -f "$PROJECT_ROOT/backend/db/migrations.sql"

echo "Running create-access-logs-table.sql..."
psql -h "$ENDPOINT" -U "$USERNAME" -d "$DB_NAME" -f "$PROJECT_ROOT/backend/db/create-access-logs-table.sql"

echo "Running create-search-indexes.sql..."
psql -h "$ENDPOINT" -U "$USERNAME" -d "$DB_NAME" -f "$PROJECT_ROOT/backend/db/create-search-indexes.sql"

# Step 3: Verify
echo -e "${YELLOW}Step 3: Verifying tables...${NC}"
psql -h "$ENDPOINT" -U "$USERNAME" -d "$DB_NAME" -c "\dt"

# Clear password
unset PGPASSWORD

echo ""
echo -e "${GREEN}✅ Database setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Update your Lambda environment variables:"
echo "   DB_HOST=$ENDPOINT"
echo "   DB_NAME=$DB_NAME"
echo "   DB_USER=$USERNAME"
echo "   DB_PASSWORD=[your-password]"
echo ""
echo "2. Make sure your RDS security group allows Lambda connections"


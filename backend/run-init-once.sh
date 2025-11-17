#!/bin/bash

# Script to run init-db once on your RDS database
# Make sure your .env file has the correct database credentials

echo "Running database initialization..."
echo "Make sure your .env file has:"
echo "  DB_HOST=your-rds-endpoint"
echo "  DB_NAME=threat_detection"
echo "  DB_USER=postgres"
echo "  DB_PASSWORD=your-password"
echo "  DB_PORT=5432"
echo ""

cd "$(dirname "$0")/.."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please create a .env file with your database credentials."
    exit 1
fi

# Run the init script
npm run init-db


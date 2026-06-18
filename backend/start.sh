#!/bin/sh

DB_FILE="/app/data/dev.db"

if [ ! -f "$DB_FILE" ]; then
  echo "Database file not found at $DB_FILE. Initializing and seeding..."
  npx prisma migrate deploy
  npx prisma db seed
else
  echo "Database file found at $DB_FILE. Applying migrations..."
  npx prisma migrate deploy
fi
echo "Starting application..."
node dist/src/main.js

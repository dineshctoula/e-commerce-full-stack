#!/bin/sh

echo "Applying migrations..."
npx prisma migrate deploy

if [ "$FORCE_SEED" = "true" ]; then
  echo "FORCE_SEED is set to true. Seeding database..."
  npx prisma db seed
fi

echo "Starting application..."
node dist/src/main.js

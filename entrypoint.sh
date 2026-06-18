#!/bin/sh

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Start the application
echo "Starting Next.js application..."
node server.js

#!/bin/sh

# Run database migrations
echo "Running database migrations..."
node node_modules/prisma/build/index.js migrate deploy

# Start the application
echo "Starting Next.js application..."
node server.js

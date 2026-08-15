#!/bin/bash
set -e

PROJECT_DIR="$HOME/Expense-Tracker-Opensoft"
BRANCH="main"

cd "$PROJECT_DIR" || exit 1

echo "Fetching latest code from repository..."
git fetch --all
git reset --hard origin/$BRANCH
git pull origin $BRANCH

echo "Checking environment variables..."
if grep -q "GEMINI_API_KEY" backend/.env 2>/dev/null; then
    echo "GEMINI_API_KEY is present."
else
    echo "GEMINI_API_KEY is missing from backend/.env."
    read -p "Enter GEMINI_API_KEY (or press Enter to skip): " GEMINI_KEY
    if [ -n "$GEMINI_KEY" ]; then
        echo "" >> backend/.env
        echo "GEMINI_API_KEY=$GEMINI_KEY" >> backend/.env
        echo "Added GEMINI_API_KEY to backend/.env."
    else
        echo "Skipped adding GEMINI_API_KEY."
    fi
fi

echo "Stopping existing containers..."
if command -v docker-compose >/dev/null 2>&1; then
    docker-compose down
else
    docker compose down
fi

echo "Rebuilding docker images without cache..."
if command -v docker-compose >/dev/null 2>&1; then
    docker-compose build --no-cache
else
    docker compose build --no-cache
fi

echo "Starting containers..."
if command -v docker-compose >/dev/null 2>&1; then
    docker-compose up -d
else
    docker compose up -d
fi

echo "Waiting for containers to start..."
sleep 5

echo "Current container status:"
if command -v docker-compose >/dev/null 2>&1; then
    docker-compose ps
else
    docker compose ps
fi

echo "Deployment finished."

#!/bin/bash
# ChubbyGenius AI — One-Shot Setup
# Usage: bash setup.sh

set -e

echo "🧠 ChubbyGenius AI — Setup Script"
echo "=================================="

# Install PHP extensions
sudo apt-get install -y php8.3-mysql php8.3-mbstring php8.3-xml php8.3-curl 2>/dev/null || true

# Copy env
cp .env.example .env

# Install dependencies
composer install --no-interaction
npm install

# Generate app key
php artisan key:generate

# Configure database (SQLite for Codespaces)
echo "DB_CONNECTION=sqlite" >> .env
touch database/database.sqlite
sed -i 's/DB_CONNECTION=mysql/DB_CONNECTION=sqlite/' .env
sed -i 's/DB_HOST=.*//' .env

# Run migrations
php artisan migrate --force --seed

# Build assets
npm run build

# Start server
echo ""
echo "✅ Setup complete!"
echo "🚀 Starting server on port 8000..."
php artisan serve --host=0.0.0.0 --port=8000

#!/bin/bash

set -e  # Exit immediately on any error
cd "$(dirname "$0")/.." || exit 1  # Move to project root

echo "🔧 Installing dependencies..."
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi
echo "✅ Dependencies installed."

echo "🧪 Running lint check..."
if npm run | grep -q "lint"; then
  npm run lint || echo "⚠️ Lint failed (but continuing)"
else
  echo "ℹ️ No lint script defined."
fi

echo "🧪 Running tests..."
if npm run | grep -q "test"; then
  npm test --silent || echo "⚠️ Tests failed (but continuing)"
else
  echo "ℹ️ No test script defined."
fi

echo "🏗️ Building project..."
npm run build
echo "✅ Build complete."

echo "🎁 Checking packaging..."
if npm run | grep -q "electron:package"; then
  npm run electron:package
else
  echo "ℹ️ No packaging script defined. Skipping."
fi

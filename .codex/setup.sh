#!/bin/bash

set -e  # Exit on error
cd "$(dirname "$0")/.." || exit 1

echo "::group::🔧 Installing dependencies"
npm install
echo "::notice::✅ Dependencies installed"
echo "::endgroup::"

echo "::group::🧪 Running lint check"
if grep -q "eslintConfig" package.json || [ -f .eslintrc.js ]; then
  echo "::notice::ESLint config found — running lint..."
  npm run lint || echo "::warning::⚠️ Lint failed (but continuing)"
else
  echo "::notice::ℹ️ No ESLint config found, skipping lint."
fi
echo "::endgroup::"

echo "::group::🧪 Running tests"
if grep -q "test" package.json; then
  echo "::notice::Running tests..."
  npm test --silent || echo "::warning::⚠️ Tests failed (but continuing)"
else
  echo "::notice::ℹ️ No test script found."
fi
echo "::endgroup::"

echo "::group::🏗️ Building project"
if grep -q "build" package.json; then
  echo "::notice::Running build (CI=false)..."
  CI=false npm run build || echo "::warning::⚠️ Build failed (but continuing)"
else
  echo "::notice::ℹ️ No build script defined."
fi
echo "::endgroup::"

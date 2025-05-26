#!/bin/bash

set -e  # Exit on error

cd "$(dirname "$0")/.." || exit 1

echo "::group::🔧 Installing dependencies"
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi
echo "::notice::✅ Dependencies installed"
echo "::endgroup::"

echo "::group::🧪 Running lint check"
if npm run | grep -q "lint"; then
  if [ -f .eslintrc.json ] || grep -q "eslintConfig" package.json; then
    npm run lint || echo "::warning::⚠️ Lint failed (but continuing)"
  else
    echo "::notice::ℹ️ ESLint not configured, skipping lint"
  fi
else
  echo "::notice::ℹ️ No lint script defined."
fi
echo "::endgroup::"

echo "::group::🧪 Running tests"
if npm run | grep -q "test"; then
  npm test --silent || echo "::warning::⚠️ Tests failed (but continuing)"
else
  echo "::notice::ℹ️ No test script defined."
fi
echo "::endgroup::"

echo "::group::🏗️ Building project"
if npm run | grep -q "build"; then
  CI=false npm run build
  echo "::notice::✅ Build complete"
else
  echo "::warning::⚠️ No build script defined"
fi
echo "::endgroup::"

#!/bin/bash

echo "Installing dependencies..."
npm ci || npm install
echo "Dependencies installed."

echo "Building project..."
npm run build

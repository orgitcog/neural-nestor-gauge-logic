#!/bin/bash
# Build frontend assets after Rust build completes
# This script runs in the Shuttle build container after cargo build

set -e

echo "Building frontend assets..."

# Navigate to project root (from backend/tensor-logic)
# The working directory is backend/tensor-logic, so we go up two levels
cd ../..

# Verify we're in the right directory (should have package.json)
if [ ! -f "package.json" ]; then
    echo "ERROR: package.json not found. Current directory: $(pwd)"
    ls -la
    exit 1
fi

echo "Current directory: $(pwd)"
echo "Installing npm dependencies..."

# Install dependencies and build
npm ci
npm run build

# Verify dist folder was created
if [ ! -d "backend/tensor-logic/dist" ]; then
    echo "ERROR: dist folder not created at backend/tensor-logic/dist/"
    exit 1
fi

echo "Frontend build complete. dist/ folder exists at backend/tensor-logic/dist/"
ls -la backend/tensor-logic/dist/ | head -10


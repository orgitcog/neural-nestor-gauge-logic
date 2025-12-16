#!/bin/bash
# Install Node.js before Rust build
# This script runs in the Shuttle build container before cargo build

set -e

echo "Installing Node.js for frontend build..."

# Check if Node.js is already installed
if command -v node &> /dev/null; then
    echo "Node.js already installed: $(node --version)"
    exit 0
fi

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

echo "Node.js installed: $(node --version)"
echo "npm version: $(npm --version)"


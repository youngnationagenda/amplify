#!/usr/bin/env bash
set -euo pipefail

# Navigate to repo root (same directory as this script)
cd "$(dirname "$0")" || exit 1

echo "🔄 Resetting Hardhat environment..."

# Clean artifacts and cache
rm -rf artifacts cache

# Recompile
echo "📦 Recompiling contracts..."
npx hardhat compile

echo "✅ Hardhat environment reset complete!"

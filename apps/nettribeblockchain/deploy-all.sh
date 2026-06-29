#!/usr/bin/env bash
set -euo pipefail

# Navigate to repo root (same directory as this script)
cd "$(dirname "$0")" || exit 1

NETWORK="${NETWORK:-celoSepolia}"

# Load environment variables if source-pools.sh exists
if [ -f "source-pools.sh" ]; then
  source source-pools.sh
  echo "✅ Environment variables loaded from source-pools.sh"
else
  echo "⚠️ source-pools.sh not found, skipping env load"
fi

echo "🚀 Running deploy-all.js on $NETWORK..."
npx hardhat run --no-compile scripts/deploy-all.js --network "$NETWORK"

echo "🎉 Deploy-all sequence finished!"

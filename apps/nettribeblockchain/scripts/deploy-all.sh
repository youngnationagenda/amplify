#!/usr/bin/env bash
set -euo pipefail

NETWORK="${NETWORK:-celoSepolia}"

echo "=== [1/3] Compile ==="
npx hardhat compile

echo "=== [2/3] Deploy factory ==="
# deploy-factory.mjs prints "UniswapV3Factory: 0x..." to stdout
DEPLOY_OUTPUT=$(node scripts/deploy-factory.mjs 2>&1)
echo "$DEPLOY_OUTPUT"

FACTORY=$(echo "$DEPLOY_OUTPUT" | grep "UniswapV3Factory:" | awk '{print $2}')
if [ -z "$FACTORY" ]; then
  echo "ERROR: factory deploy failed — could not extract address"
  exit 1
fi
echo "Factory address: $FACTORY"
export UNISWAP_V3_FACTORY="$FACTORY"

echo "=== [3/3] Deploy periphery ==="
npx hardhat run --no-compile scripts/deploy-periphery.js --network "$NETWORK"

echo ""
echo "=== Deployed addresses ==="
cat deployed-addresses.json

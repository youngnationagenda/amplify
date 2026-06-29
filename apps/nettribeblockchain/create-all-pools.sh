#!/usr/bin/env bash
set -euo pipefail

# Navigate to repo root
cd "$(dirname "$0")" || exit 1

NETWORK="${NETWORK:-celoSepolia}"
POOL_FEE="${POOL_FEE:-3000}"

# These must be set in .env or exported before running
: "${UNISWAP_NFPM_ADDRESS:?Set UNISWAP_NFPM_ADDRESS in .env or export it}"
: "${TOKEN_NTC:?Set TOKEN_NTC in .env or export it}"
: "${TOKEN_NTEV:?Set TOKEN_NTEV in .env or export it}"
: "${TOKEN_USDC:?Set TOKEN_USDC in .env or export it}"
: "${WRAPPED_NATIVE_TOKEN:?Set WRAPPED_NATIVE_TOKEN in .env or export it}"

export POOL_FEE

echo "🚀 Creating NTC/CELO pool..."
export TOKEN_A_ADDRESS="$TOKEN_NTC"
export TOKEN_B_ADDRESS="$WRAPPED_NATIVE_TOKEN"
export PRICE_TOKEN1_PER_TOKEN0="${PRICE_NTC_CELO:-1}"
export TOKEN0_DECIMALS=18
export TOKEN1_DECIMALS=18
npx hardhat run --no-compile scripts/create-pool.js --network "$NETWORK"

echo "🚀 Creating NTC/USDC pool..."
export TOKEN_A_ADDRESS="$TOKEN_NTC"
export TOKEN_B_ADDRESS="$TOKEN_USDC"
export PRICE_TOKEN1_PER_TOKEN0="${PRICE_NTC_USDC:-1}"
export TOKEN0_DECIMALS=18
export TOKEN1_DECIMALS=6
npx hardhat run --no-compile scripts/create-pool.js --network "$NETWORK"

echo "🚀 Creating NTEV/USDC pool..."
export TOKEN_A_ADDRESS="$TOKEN_NTEV"
export TOKEN_B_ADDRESS="$TOKEN_USDC"
export PRICE_TOKEN1_PER_TOKEN0="${PRICE_NTEV_USDC:-1}"
export TOKEN0_DECIMALS=18
export TOKEN1_DECIMALS=6
npx hardhat run --no-compile scripts/create-pool.js --network "$NETWORK"

echo "🚀 Creating NTEV/CELO pool..."
export TOKEN_A_ADDRESS="$TOKEN_NTEV"
export TOKEN_B_ADDRESS="$WRAPPED_NATIVE_TOKEN"
export PRICE_TOKEN1_PER_TOKEN0="${PRICE_NTEV_CELO:-1}"
export TOKEN0_DECIMALS=18
export TOKEN1_DECIMALS=18
npx hardhat run --no-compile scripts/create-pool.js --network "$NETWORK"

echo "🎉 All pools created successfully!"

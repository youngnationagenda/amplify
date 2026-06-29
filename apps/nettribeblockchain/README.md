# NetTribe Uniswap V3 Hardhat Setup

This repo is configured for:

- Hardhat 3
- ESM (`"type": "module"`)
- ethers v6 via `@nomicfoundation/hardhat-ethers`
- Uniswap V3 periphery artifact-based deployment scripts
- Celo Sepolia RPC configuration through env vars

## Environment

The repo uses a local `.env` file (see `.env.example`) for Celo Sepolia credentials and a contract address book in `celo-sepolia-addresses.json`.

Key configured values:

```bash
CELO_RPC_URL=https://forno.celo-sepolia.celo-testnet.org
UNISWAP_V3_FACTORY=0xE0af690969AFff1A07b23555a6B7C716395Af80D
WRAPPED_NATIVE_TOKEN=0x2ce73dc897a3e10b3ff3f86470847c36ddb735cf
TOKEN_NTC=0xde6dbd244fbe84141a97dde4043029d9c61767ae
TOKEN_NTEV=0xcdb1d119eda8f7a04a820b5002ef2ea8b189bb18
TOKEN_USDC=0x01c5c0122039549ad1493b8220cabedd739bc44e
```

`CELO_RPC_URL` is preferred. `CELO_SEPOLIA_RPC` is still accepted as a fallback for compatibility with older local setup. Hardhat now loads `.env` from the project root automatically, and exposes both `celo` and `celoSepolia` network aliases with chain ID `11142220`.

## Deploy Periphery

Deploy the full periphery set:

```bash
npx hardhat run --no-compile scripts/deploy-periphery.js --network celoSepolia
```

Deploy individual V3 components:

```bash
npx hardhat run --no-compile scripts/deploy-nfpm.js --network celoSepolia
npx hardhat run --no-compile scripts/deploy-router.js --network celoSepolia
npx hardhat run --no-compile scripts/deploy-quoter-v2.js --network celoSepolia
```

This workflow is intentionally Uniswap V3-only. It deploys `NonfungiblePositionManager`, `SwapRouter`, and `QuoterV2` and does not use `SwapRouter02`, Universal Router, or any V4 contracts.

Note: Uniswap publishes the deployable artifacts for these contracts in `@uniswap/v3-periphery`, but not the full implementation Solidity sources in the npm package. These scripts therefore deploy directly from the published artifacts instead of relying on local contract compilation.

## Create Pool

Example:

```bash
export UNISWAP_NFPM_ADDRESS="0xYourNfpm"
export TOKEN_A_ADDRESS="$TOKEN_NTC"
export TOKEN_B_ADDRESS="$TOKEN_USDC"
export POOL_FEE="3000"
export PRICE_TOKEN1_PER_TOKEN0="1"
export TOKEN0_DECIMALS="18"
export TOKEN1_DECIMALS="6"

npx hardhat run --no-compile scripts/create-pool.js --network celoSepolia
```

You can also pass `SQRT_PRICE_X96` directly instead of deriving it from `PRICE_TOKEN1_PER_TOKEN0`.

## Mint Liquidity

Example:

```bash
export UNISWAP_NFPM_ADDRESS="0xYourNfpm"
export TOKEN_A_ADDRESS="$TOKEN_NTC"
export TOKEN_B_ADDRESS="$TOKEN_USDC"
export POOL_FEE="3000"
export TICK_LOWER="-887220"
export TICK_UPPER="887220"
export AMOUNT_A_DESIRED="1000000000000000000"
export AMOUNT_B_DESIRED="1000000"

npx hardhat run --no-compile scripts/mint-liquidity.js --network celoSepolia
```

The mint script auto-sorts the token pair, approves both ERC-20s to the position manager if needed, and then calls `mint`.

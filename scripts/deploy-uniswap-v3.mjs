#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════
 * Deploy Uniswap V3 Stack on Celo Sepolia — Step-by-Step Guide
 * ═══════════════════════════════════════════════════════════════
 *
 * Prerequisites:
 *   1. Install Foundry: curl -L https://foundry.paradigm.xyz | bash && foundryup
 *   2. Clone repos:
 *      git clone https://github.com/Uniswap/v3-core
 *      git clone https://github.com/Uniswap/v3-periphery
 *   3. Set env vars:
 *      export CELO_SEPOLIA_RPC=https://forno.celo-sepolia.celo-testnet.org
 *      export PRIVATE_KEY=0xYOUR_DEPLOYER_PRIVATE_KEY
 *
 * Deployment Order:
 *   1. UniswapV3Factory
 *   2. NonfungiblePositionManager(factory, WCELO)
 *   3. SwapRouter02(factory, WCELO)
 *   4. QuoterV2(factory, WCELO)
 *   5. Create & initialize pools (NTC/CELO, NTC/USDC, NTEV/USDC, USDm/NTC, USDm/NTEV)
 *   6. Add liquidity via PositionManager
 *
 * After deployment, set these env vars in your .env.local:
 *   VITE_TESTNET_SWAP_ROUTER=0x...
 *   VITE_TESTNET_FACTORY=0x...
 *   VITE_TESTNET_QUOTER=0x...
 *   VITE_TESTNET_POSITION_MANAGER=0x...
 *
 * The app will auto-detect these and switch from simulation to real swaps.
 *
 * Foundry Commands:
 *   forge create --rpc-url $CELO_SEPOLIA_RPC --private-key $PRIVATE_KEY src/UniswapV3Factory.sol:UniswapV3Factory
 *   forge create --rpc-url $CELO_SEPOLIA_RPC --private-key $PRIVATE_KEY src/SwapRouter02.sol:SwapRouter02 --constructor-args <FACTORY> <WCELO>
 *   forge create --rpc-url $CELO_SEPOLIA_RPC --private-key $PRIVATE_KEY src/NonfungiblePositionManager.sol:NonfungiblePositionManager --constructor-args <FACTORY> <WCELO> <TOKEN_DESCRIPTOR>
 *   forge create --rpc-url $CELO_SEPOLIA_RPC --private-key $PRIVATE_KEY src/lens/QuoterV2.sol:QuoterV2 --constructor-args <FACTORY> <WCELO>
 */

console.log(`
╔═══════════════════════════════════════════════════════╗
║  Uniswap V3 Deployment Guide for Celo Sepolia        ║
╚═══════════════════════════════════════════════════════╝

This is a documentation script. Follow the steps in the
comments above to deploy your own SwapRouter02 on Celo
Sepolia testnet.

Once deployed, add these to your environment:
  VITE_TESTNET_SWAP_ROUTER=<your_router_address>
  VITE_TESTNET_FACTORY=<your_factory_address>  
  VITE_TESTNET_QUOTER=<your_quoter_address>
  VITE_TESTNET_POSITION_MANAGER=<your_pm_address>

The app will automatically use real swaps when these are set.
`);

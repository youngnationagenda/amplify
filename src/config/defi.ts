// ============================
// DeFi Configuration: Pools, Tokens, LP NFTs
// Supports: Celo Mainnet + Celo Sepolia Testnet
// ============================

import { celo } from "viem/chains";

// Chain IDs
export const CELO_SEPOLIA_ID = 11142220;
export const CELO_MAINNET_ID = celo.id; // 42220

// ── Treasury ──
export const TREASURY_ADDRESS = "0x57651B018Fa4aC931Ec585da641078988Ef1213B" as const;

// ── Per-network contract addresses ──
export interface NetworkContracts {
  swapRouter: `0x${string}`;
  positionManager: `0x${string}`;
  factory: `0x${string}`;
  quoter: `0x${string}`;
  universalRouter: `0x${string}`;
  permit2: `0x${string}`;
  blockExplorer: string;
  tokens: {
    CELO: `0x${string}`;
    NTC: `0x${string}`;
    USDC: `0x${string}`;
    NTEV: `0x${string}`;
    USDm: `0x${string}`;
  };
  pools: {
    NTC_CELO: PoolConfig;
    NTEV_USDC: PoolConfig;
    NTC_USDC: PoolConfig;
    USDm_NTC: PoolConfig;
  };
  lpPositions: LPPosition[];
}

export interface PoolConfig {
  address: `0x${string}`;
  token0: string;
  token1: string;
  fee: number;
  lpTokenId: number;
  currentPrice: number;
}

export interface LPPosition {
  tokenId: number;
  pair: string;
  token0Symbol: string;
  token1Symbol: string;
  poolAddress: `0x${string}`;
  currentPrice: number;
  fee: string;
  explorerUrl: string;
}

// ── Celo Mainnet (official Ubeswap V3 deployments) ──
const MAINNET_CONTRACTS: NetworkContracts = {
  swapRouter: "0xE389f92B47d913F773254962eD638E12C28aA82d",
  positionManager: "0x897387c7B996485c3AAa85c94272Cd6C506f8c8F",
  factory: "0x67FEa58D5a5a4162cED847E13c2c81c73bf8aeC4",
  quoter: "0x1f34a843832044A085bB9cAe48cc7294D5478FAA",
  universalRouter: "0x3C255DED9B25f0BFB4EF1D14234BD2514d7A7A0d",
  permit2: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
  blockExplorer: "https://celoscan.io",
  tokens: {
    CELO: "0x471ece3750da237f93b8e339c536989b8978a438",
    NTC: "0xde6dbd244fbe84141a97dde4043029d9c61767ae",
    USDC: "0x01c5c0122039549ad1493b8220cabedd739bc44e",
    NTEV: "0xcdb1d119eda8f7a04a820b5002ef2ea8b189bb18",
    USDm: "0xde9e4c3ce781b4ba68120d6261cbad65ce0ab00b",
  },
  pools: {
    NTC_CELO: {
      address: "0xa34776ea7354d6d7ff475c23b43f1b316d5171b2",
      token0: "NTC",
      token1: "CELO",
      fee: 3000,
      lpTokenId: 8,
      currentPrice: 0.76921,
    },
    NTEV_USDC: {
      address: "0x6efa97b293629af7266912897a03800c1c7a178a",
      token0: "NTEV",
      token1: "USDC",
      fee: 3000,
      lpTokenId: 9,
      currentPrice: 1.0,
    },
    NTC_USDC: {
      address: "0x9375ceea175dd6188f6ed7915f8bde3dbd5a0ea2",
      token0: "NTC",
      token1: "USDC",
      fee: 3000,
      lpTokenId: 10,
      currentPrice: 0.1,
    },
    USDm_NTC: {
      address: "0x58c12ff92110cadb2fe8d9081fd86243a6ab85ff",
      token0: "USDm",
      token1: "NTC",
      fee: 3000,
      lpTokenId: 12,
      currentPrice: 0.1,
    },
  },
  lpPositions: [],
};

// ── Celo Sepolia Testnet (deployed Uniswap V3 contracts) ──
const TESTNET_CONTRACTS: NetworkContracts = {
  swapRouter: "0x5615CDAb10dc425a742d643d949a7F474C01abc4",
  positionManager: "0xb178deF6aeaBb437E161B252b7BF213A1C864e32",
  factory: "0xAfE208a311B21f13EF87E33A90049fC17A7acDE",
  quoter: "0x0000000000000000000000000000000000000000",
  universalRouter: "0x643770E279d5D0733F21d6DC03A8efbABf3255B4",
  permit2: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
  blockExplorer: "https://celo-sepolia.blockscout.com",
  tokens: {
    CELO: "0x471ece3750da237f93b8e339c536989b8978a438",
    NTC: "0xde6dbd244fbe84141a97dde4043029d9c61767ae",
    USDC: "0x01c5c0122039549ad1493b8220cabedd739bc44e",
    NTEV: "0xcdb1d119eda8f7a04a820b5002ef2ea8b189bb18",
    USDm: "0xde9e4c3ce781b4ba68120d6261cbad65ce0ab00b",
  },
  pools: {
    NTC_CELO: {
      address: "0xa34776ea7354d6d7ff475c23b43f1b316d5171b2",
      token0: "NTC",
      token1: "CELO",
      fee: 3000,
      lpTokenId: 8,
      currentPrice: 0.76921,
    },
    NTEV_USDC: {
      address: "0x6efa97b293629af7266912897a03800c1c7a178a",
      token0: "NTEV",
      token1: "USDC",
      fee: 3000,
      lpTokenId: 9,
      currentPrice: 1.0,
    },
    NTC_USDC: {
      address: "0x9375ceea175dd6188f6ed7915f8bde3dbd5a0ea2",
      token0: "NTC",
      token1: "USDC",
      fee: 3000,
      lpTokenId: 10,
      currentPrice: 0.1,
    },
    USDm_NTC: {
      address: "0x58c12ff92110cadb2fe8d9081fd86243a6ab85ff",
      token0: "USDm",
      token1: "NTC",
      fee: 3000,
      lpTokenId: 12,
      currentPrice: 0.1,
    },
  },
  lpPositions: [],
};

// ── Build LP positions from pool config ──
function buildLPPositions(contracts: NetworkContracts): LPPosition[] {
  const { pools, blockExplorer, positionManager } = contracts;
  return Object.values(pools).map((pool) => ({
    tokenId: pool.lpTokenId,
    pair: `${pool.token0} / ${pool.token1}`,
    token0Symbol: pool.token0,
    token1Symbol: pool.token1,
    poolAddress: pool.address,
    currentPrice: pool.currentPrice,
    fee: `${pool.fee / 10000}%`,
    explorerUrl: `${blockExplorer}/token/${positionManager}/instance/${pool.lpTokenId}`,
  }));
}

MAINNET_CONTRACTS.lpPositions = buildLPPositions(MAINNET_CONTRACTS);
TESTNET_CONTRACTS.lpPositions = buildLPPositions(TESTNET_CONTRACTS);

// ── Network registry ──
export const NETWORK_CONTRACTS: Record<number, NetworkContracts> = {
  [CELO_MAINNET_ID]: MAINNET_CONTRACTS,
  [CELO_SEPOLIA_ID]: TESTNET_CONTRACTS,
};

/** Get contracts for the connected chain. Falls back to mainnet. */
export function getContracts(chainId: number | undefined): NetworkContracts {
  return NETWORK_CONTRACTS[chainId ?? CELO_MAINNET_ID] ?? MAINNET_CONTRACTS;
}

// ── Shared constants (network-agnostic) ──
export const TOKEN_DECIMALS: Record<string, number> = {
  CELO: 18,
  NTC: 18,
  USDC: 6,
  NTEV: 18,
  USDm: 18,
};

export const TOKEN_LABELS: Record<string, string> = {
  CELO: "CELO",
  NTC: "Net Tribe Carbon",
  USDC: "USD Coin",
  NTEV: "EV Asset (RWA)",
  USDm: "USD Marble",
};

export type TokenSymbol = "CELO" | "NTC" | "USDC" | "NTEV" | "USDm";

// ── ABIs (network-agnostic) ──
export const LP_NFT_ABI = [
  {
    name: "ownerOf",
    type: "function",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    name: "positions",
    type: "function",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      { name: "nonce", type: "uint96" },
      { name: "operator", type: "address" },
      { name: "token0", type: "address" },
      { name: "token1", type: "address" },
      { name: "fee", type: "uint24" },
      { name: "tickLower", type: "int24" },
      { name: "tickUpper", type: "int24" },
      { name: "liquidity", type: "uint128" },
      { name: "feeGrowthInside0LastX128", type: "uint256" },
      { name: "feeGrowthInside1LastX128", type: "uint256" },
      { name: "tokensOwed0", type: "uint128" },
      { name: "tokensOwed1", type: "uint128" },
    ],
    stateMutability: "view",
  },
] as const;

export const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    name: "decimals",
    type: "function",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
  },
  {
    name: "approve",
    type: "function",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

export const UBESWAP_ROUTER_ABI = [
  {
    name: "exactInputSingle",
    type: "function",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "recipient", type: "address" },
          { name: "deadline", type: "uint256" },
          { name: "amountIn", type: "uint256" },
          { name: "amountOutMinimum", type: "uint256" },
          { name: "sqrtPriceLimitX96", type: "uint160" },
        ],
      },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
] as const;

// ── Legacy exports (backward compat) ──
export const TOKENS = MAINNET_CONTRACTS.tokens;
export const UBESWAP_POOLS = MAINNET_CONTRACTS.pools;
export const UBESWAP_ROUTER = MAINNET_CONTRACTS.swapRouter;
export const LP_NFT_CONTRACT = MAINNET_CONTRACTS.positionManager;
export const BLOCK_EXPLORER = MAINNET_CONTRACTS.blockExplorer;
export const LP_POSITIONS = MAINNET_CONTRACTS.lpPositions;

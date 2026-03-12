// ============================
// DeFi Configuration: Pools, Tokens, LP NFTs
// Network: Celo Sepolia Testnet
// ============================

export const TREASURY_ADDRESS = "0x57651B018Fa4aC931Ec585da641078988Ef1213B" as const;

// Token Addresses
export const TOKENS = {
  CELO: "0x471ece3750da237f93b8e339c536989b8978a438" as const,
  NTC: "0xde6dbd244fbe84141a97dde4043029d9c61767ae" as const,
  USDC: "0x01c5c0122039549ad1493b8220cabedd739bc44e" as const,
  NTEV: "0xcdb1d119eda8f7a04a820b5002ef2ea8b189bb18" as const,
} as const;

export const TOKEN_DECIMALS: Record<string, number> = {
  CELO: 18,
  NTC: 18,
  USDC: 6,
  NTEV: 18,
};

export const TOKEN_LABELS: Record<string, string> = {
  CELO: "CELO",
  NTC: "Net Tribe Carbon",
  USDC: "USD Coin",
  NTEV: "EV Asset (RWA)",
};

// Ubeswap V3 Pools
export const UBESWAP_POOLS = {
  NTC_CELO: {
    address: "0xa34776ea7354d6d7ff475c23b43f1b316d5171b2" as const,
    token0: "NTC",
    token1: "CELO",
    fee: 3000, // 0.3%
    lpTokenId: 8,
    currentPrice: 0.76921, // NTC per CELO
  },
  NTEV_USDC: {
    address: "0x6efa97b293629af7266912897a03800c1c7a178a" as const,
    token0: "NTEV",
    token1: "USDC",
    fee: 3000,
    lpTokenId: 9,
    currentPrice: 1.0, // NTEV per USDC
  },
  NTC_USDC: {
    address: "0x9375ceea175dd6188f6ed7915f8bde3dbd5a0ea2" as const,
    token0: "NTC",
    token1: "USDC",
    fee: 3000,
    lpTokenId: 10,
    currentPrice: 0.1, // USDC per NTC
  },
} as const;

// LP NFT Contract (Ubeswap V3 Positions Manager)
export const LP_NFT_CONTRACT = "0xb178deF6aeaBb437E161B252b7BF213A1C864e32" as const;

// LP NFT ABI (minimal for reading positions)
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

// ERC-20 ABI (minimal)
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

// Ubeswap Router ABI (minimal for swaps)
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

// Ubeswap V3 Router on Celo
export const UBESWAP_ROUTER = "0x5615CDAb10dc425a742d643d949a7F474C01abc4" as const;

// Celo Sepolia Block Explorer
export const BLOCK_EXPLORER = "https://celo-sepolia.blockscout.com";

export type TokenSymbol = keyof typeof TOKENS;

export interface LPPosition {
  tokenId: number;
  pair: string;
  token0Symbol: string;
  token1Symbol: string;
  poolAddress: string;
  currentPrice: number;
  fee: string;
  explorerUrl: string;
}

export const LP_POSITIONS: LPPosition[] = [
  {
    tokenId: 8,
    pair: "NTC / CELO",
    token0Symbol: "NTC",
    token1Symbol: "CELO",
    poolAddress: UBESWAP_POOLS.NTC_CELO.address,
    currentPrice: UBESWAP_POOLS.NTC_CELO.currentPrice,
    fee: "0.3%",
    explorerUrl: `${BLOCK_EXPLORER}/token/${LP_NFT_CONTRACT}/instance/8`,
  },
  {
    tokenId: 9,
    pair: "NTEV / USDC",
    token0Symbol: "NTEV",
    token1Symbol: "USDC",
    poolAddress: UBESWAP_POOLS.NTEV_USDC.address,
    currentPrice: UBESWAP_POOLS.NTEV_USDC.currentPrice,
    fee: "0.3%",
    explorerUrl: `${BLOCK_EXPLORER}/token/${LP_NFT_CONTRACT}/instance/9`,
  },
  {
    tokenId: 10,
    pair: "NTC / USDC",
    token0Symbol: "NTC",
    token1Symbol: "USDC",
    poolAddress: UBESWAP_POOLS.NTC_USDC.address,
    currentPrice: UBESWAP_POOLS.NTC_USDC.currentPrice,
    fee: "0.3%",
    explorerUrl: `${BLOCK_EXPLORER}/token/${LP_NFT_CONTRACT}/instance/10`,
  },
];

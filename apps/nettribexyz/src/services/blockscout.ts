// ============================
// Blockscout PRO API Service
// Celo Sepolia Testnet Integration
// ============================

const BLOCKSCOUT_API_KEY = "proapi_eFP6E3CSdc8kkplOpw75BuVD1J4aCDXB85UtNKCZXrVmhImwotLG0nTd8VZddlOmR_by7Iai";

// Base URLs per chain
const BLOCKSCOUT_URLS: Record<number, string> = {
  11142220: "https://celo-sepolia.blockscout.com/api/v2",
  42220: "https://celo.blockscout.com/api/v2",
};

const PRO_API_BASE = "https://api.blockscout.com";

export interface BlockscoutTransaction {
  hash: string;
  block: number;
  timestamp: string;
  from: { hash: string };
  to: { hash: string } | null;
  value: string;
  fee: { value: string };
  status: string | null;
  method: string | null;
  tx_types: string[];
  token_transfers?: TokenTransfer[];
}

export interface TokenTransfer {
  token: {
    address: string;
    symbol: string;
    name: string;
    decimals: string;
    type: string;
  };
  from: { hash: string };
  to: { hash: string };
  total: { value: string; decimals: string };
}

export interface BlockscoutTokenBalance {
  token: {
    address: string;
    symbol: string;
    name: string;
    decimals: string;
    type: string;
    exchange_rate: string | null;
  };
  value: string;
}

export interface AddressInfo {
  hash: string;
  is_contract: boolean;
  name: string | null;
  coin_balance: string;
  exchange_rate: string | null;
  transactions_count: number;
  token_transfers_count: number;
}

function getBaseUrl(chainId: number): string {
  return BLOCKSCOUT_URLS[chainId] || BLOCKSCOUT_URLS[11142220];
}

async function fetchBlockscout<T>(chainId: number, path: string, params?: Record<string, string>): Promise<T> {
  const baseUrl = getBaseUrl(chainId);
  const url = new URL(`${baseUrl}${path}`);
  url.searchParams.set("apikey", BLOCKSCOUT_API_KEY);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Blockscout API error: ${res.status}`);
  return res.json();
}

// ── Public API Methods ──

export async function getAddressInfo(chainId: number, address: string): Promise<AddressInfo> {
  return fetchBlockscout<AddressInfo>(chainId, `/addresses/${address}`);
}

export async function getAddressTransactions(
  chainId: number,
  address: string,
  limit = 20
): Promise<{ items: BlockscoutTransaction[]; next_page_params: Record<string, string> | null }> {
  return fetchBlockscout(chainId, `/addresses/${address}/transactions`, {
    limit: String(limit),
  });
}

export async function getAddressTokenTransfers(
  chainId: number,
  address: string,
  limit = 20
): Promise<{ items: TokenTransfer[]; next_page_params: Record<string, string> | null }> {
  return fetchBlockscout(chainId, `/addresses/${address}/token-transfers`, {
    limit: String(limit),
  });
}

export async function getAddressTokenBalances(
  chainId: number,
  address: string
): Promise<BlockscoutTokenBalance[]> {
  return fetchBlockscout<BlockscoutTokenBalance[]>(chainId, `/addresses/${address}/tokens`);
}

export async function getTransactionInfo(chainId: number, txHash: string): Promise<BlockscoutTransaction> {
  return fetchBlockscout<BlockscoutTransaction>(chainId, `/transactions/${txHash}`);
}

export async function getTokenInfo(chainId: number, tokenAddress: string) {
  return fetchBlockscout(chainId, `/tokens/${tokenAddress}`);
}

export async function getNFTInstances(chainId: number, contractAddress: string, tokenId: number) {
  return fetchBlockscout(chainId, `/tokens/${contractAddress}/instances/${tokenId}`);
}

// ── Explorer link helpers ──

export function getExplorerUrl(chainId: number): string {
  if (chainId === 42220) return "https://celoscan.io";
  return "https://celo-sepolia.blockscout.com";
}

export function txUrl(chainId: number, hash: string): string {
  return `${getExplorerUrl(chainId)}/tx/${hash}`;
}

export function addressUrl(chainId: number, addr: string): string {
  return `${getExplorerUrl(chainId)}/address/${addr}`;
}

export function tokenUrl(chainId: number, addr: string): string {
  return `${getExplorerUrl(chainId)}/token/${addr}`;
}

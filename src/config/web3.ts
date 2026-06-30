import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { celo } from 'viem/chains'
import { defineChain } from 'viem'
import { http } from 'wagmi'
import { injected } from 'wagmi/connectors'

// Define Celo Sepolia Testnet (not yet in viem/chains)
export const celoSepolia = defineChain({
  id: 11142220,
  name: 'Celo Sepolia Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'CELO',
    symbol: 'CELO',
  },
  rpcUrls: {
    default: {
      http: ['https://forno.celo-sepolia.celo-testnet.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Celo Sepolia Explorer',
      url: 'https://celo-sepolia.blockscout.com',
    },
  },
  testnet: true,
})

// WalletConnect project ID - loaded from environment variable for production
// Get your own at https://cloud.walletconnect.com
export const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'dummy_project_id_for_development'

const metadata = {
  name: 'EOT Carbon Credits',
  description: 'Purchase carbon credits with CELO and cUSD',
  url: 'https://eot-carbon.lovable.app',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

export const chains = [celo, celoSepolia] as const

export const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId: WALLETCONNECT_PROJECT_ID,
  metadata,
  transports: {
    [celo.id]: http(),
    [celoSepolia.id]: http(),
  },
})

// Celo token addresses
export const CELO_TOKENS = {
  // Mainnet
  [celo.id]: {
    CELO: '0x0000000000000000000000000000000000000000', // Native CELO
    cUSD: '0x765DE816845861e75A25fCA122bb6898B8B1282a', // USDm on mainnet
  },
  // Celo Sepolia Testnet
  [celoSepolia.id]: {
    CELO: '0x0000000000000000000000000000000000000000', // Native CELO
    cUSD: '0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b', // USDm on Celo Sepolia
  },
}

// cUSD token ABI (minimal for transfer)
export const CUSD_ABI = [
  {
    name: 'transfer',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'decimals',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
  },
] as const

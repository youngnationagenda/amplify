import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { celo, celoAlfajores } from 'viem/chains'
import { http } from 'wagmi'

// Dummy WalletConnect project ID for development
// Replace with your own project ID from https://cloud.walletconnect.com
export const WALLETCONNECT_PROJECT_ID = 'dummy_project_id_for_development'

const metadata = {
  name: 'EOT Carbon Credits',
  description: 'Purchase carbon credits with CELO and cUSD',
  url: 'https://eot-carbon.lovable.app',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

export const chains = [celo, celoAlfajores] as const

export const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId: WALLETCONNECT_PROJECT_ID,
  metadata,
  transports: {
    [celo.id]: http(),
    [celoAlfajores.id]: http(),
  },
})

// Celo token addresses
export const CELO_TOKENS = {
  // Mainnet
  [celo.id]: {
    CELO: '0x0000000000000000000000000000000000000000', // Native CELO
    cUSD: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
  },
  // Alfajores Testnet
  [celoAlfajores.id]: {
    CELO: '0x0000000000000000000000000000000000000000', // Native CELO
    cUSD: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1',
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

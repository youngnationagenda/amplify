import { createWeb3Modal } from '@web3modal/wagmi/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { wagmiConfig, WALLETCONNECT_PROJECT_ID } from '@/config/web3'
import { ReactNode } from 'react'

const queryClient = new QueryClient()

// Initialize Web3Modal
createWeb3Modal({
  wagmiConfig,
  projectId: WALLETCONNECT_PROJECT_ID,
  enableAnalytics: false,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#22c55e',
    '--w3m-border-radius-master': '0.75rem',
  },
  featuredWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
  ],
  customWallets: [
    {
      id: 'metamask',
      name: 'MetaMask',
      homepage: 'https://metamask.io',
      image_url: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg',
      mobile_link: 'https://metamask.app.link',
      desktop_link: 'https://metamask.io/download',
      webapp_link: 'https://portfolio.metamask.io',
      injected: [
        {
          namespace: 'eip155',
          injected_id: 'isMetaMask',
        },
      ],
    },
  ],
})

interface Web3ProviderProps {
  children: ReactNode
}

export function Web3Provider({ children }: Web3ProviderProps) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}

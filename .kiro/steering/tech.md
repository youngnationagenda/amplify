# Tech Stack

## Frontend
- **Framework**: React 18 with TypeScript
- **Build**: Vite 5 (SWC plugin for fast refresh)
- **Styling**: Tailwind CSS 3 with CSS variables for theming
- **Components**: shadcn/ui (Radix primitives + Tailwind)
- **Routing**: React Router v6
- **State/Data fetching**: TanStack React Query
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts

## Backend (AWS Amplify Gen 2)
- **Auth**: Amazon Cognito (email login, user groups for roles)
- **API**: AWS AppSync GraphQL
- **Database**: DynamoDB (via Amplify Data)
- **Functions**: AWS Lambda (TypeScript handlers)
- **Analytics**: AWS Athena for ride telemetry queries

## Web3
- **Chain**: Celo network
- **Wallet connection**: Web3Modal + wagmi + viem
- **Block explorer**: Blockscout integration

## Common Commands

```bash
# Development server (port 8080)
npm run dev

# Production build
npm run build

# Development build (no minification)
npm run build:dev

# Lint
npm run lint

# Preview production build
npm run preview

# Amplify sandbox (local backend)
npx ampx sandbox
```

## Key Configuration Files

| File | Purpose |
|------|---------|
| `vite.config.ts` | Vite build config, `@` path alias to `./src` |
| `tailwind.config.ts` | Theme tokens, custom colors, animations |
| `components.json` | shadcn/ui component generation settings |
| `amplify/backend.ts` | Amplify backend definition (auth, data, functions) |
| `amplify/data/resource.ts` | GraphQL schema / DynamoDB models |
| `amplify_outputs.json` | Auto-generated Amplify client config (do not edit manually) |

## Node Version

Requires Node.js >= 24.0.0

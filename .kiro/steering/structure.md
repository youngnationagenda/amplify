# Project Structure

```
├── amplify/                    # AWS Amplify Gen 2 backend
│   ├── auth/resource.ts        # Cognito auth config (groups, attributes)
│   ├── data/resource.ts        # AppSync/DynamoDB schema (all models)
│   ├── functions/              # Lambda functions
│   │   └── athena-query/       # Athena telemetry query handler
│   └── backend.ts              # Backend definition entry point
│
├── src/
│   ├── components/
│   │   ├── ui/                 # shadcn/ui primitives (do not edit manually)
│   │   ├── rider/              # Rider-specific components
│   │   ├── investor/           # Investor-specific components
│   │   ├── wallet/             # Web3 wallet components
│   │   ├── celo/               # Celo chain components
│   │   └── *.tsx               # Shared/page-level components
│   │
│   ├── pages/                  # Route-level page components
│   ├── contexts/               # React contexts (Auth, AmplifyAuth)
│   ├── providers/              # Provider wrappers (Web3Provider)
│   ├── hooks/                  # Custom React hooks
│   ├── services/               # External service integrations (Blockscout, telemetry)
│   ├── config/                 # App config (DeFi, Web3 settings)
│   ├── integrations/
│   │   ├── amplify/            # Amplify client & config (primary backend)
│   │   └── supabase/           # Legacy Supabase integration (being migrated)
│   └── lib/                    # Shared utilities (cn helper, etc.)
│
├── amplify_outputs.json        # Generated Amplify config (auto-generated)
└── index.html                  # App entry point
```

## Conventions

- **Path alias**: Use `@/` to import from `src/` (e.g., `import { cn } from "@/lib/utils"`)
- **UI components**: Place new shadcn/ui components in `src/components/ui/`. Do not modify generated ui components directly.
- **Feature components**: Group by user role (`rider/`, `investor/`, etc.) or domain
- **Pages**: One file per route in `src/pages/`
- **Data access**: Use the typed Amplify client from `@/integrations/amplify/client` for all data operations
- **Auth**: Access auth state via the `AuthContext` from `@/contexts/AuthContext`
- **Protected routes**: Wrap with `<ProtectedRoute allowedRoles={[...]}>` in App.tsx
- **Backend models**: Define in `amplify/data/resource.ts` — schema changes auto-generate types

## Migration Note

The project is migrating from Supabase to AWS Amplify Gen 2. The `src/integrations/supabase/` folder contains legacy code. New features should use Amplify exclusively.

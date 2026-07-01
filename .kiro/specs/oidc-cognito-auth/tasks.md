# Implementation Plan: OIDC Cognito Authentication

## Overview

Replace the existing Amplify SDK authentication calls with a standards-based OIDC Authorization Code Flow (with PKCE) using `react-oidc-context` and `oidc-client-ts`, while preserving role-based access control and the existing Amplify Data layer. Implementation follows a bottom-up approach: dependencies → config → context → integration → UI → tests.

## Tasks

- [x] 1. Install OIDC dependencies
  - [x] 1.1 Add `oidc-client-ts` and `react-oidc-context` to `apps/nettribexyz/package.json`
    - Run `npm install oidc-client-ts@^3 react-oidc-context@^3` in the `apps/nettribexyz` directory
    - Verify both packages appear in the `dependencies` section of `package.json` with caret range version specifiers
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 2. Create OIDC configuration module
  - [x] 2.1 Create `src/integrations/oidc/config.ts` with OIDC client settings
    - Export an `oidcConfig` object of type `UserManagerSettings` from `oidc-client-ts`
    - Set `authority` to `https://cognito-idp.us-east-1.amazonaws.com/us-east-1_9YXVf9jkA`
    - Set `client_id` to `7u0frbk65upesqqvd90jjaictl`
    - Set `redirect_uri` and `post_logout_redirect_uri` to `window.location.origin`
    - Set `response_type` to `code`
    - Set `scope` to `aws.cognito.signin.user.admin email openid phone profile`
    - Set `automaticSilentRenew` to `true`
    - Set `accessTokenExpiringNotificationTimeInSeconds` to `60`
    - Configure `userStore` with `WebStorageStateStore` using `window.sessionStorage`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 8.1, 8.2_

- [ ] 3. Create OidcAuthContext with role resolution
  - [-] 3.1 Create `src/contexts/OidcAuthContext.tsx` with the custom auth context
    - Define `AuthUser` interface with `id` (from `sub`), `email`, and optional `fullName` (from `name`)
    - Define `AppRole` type as `'rider' | 'investor' | 'admin' | 'offsetter'`
    - Define `AuthContextType` interface exposing `user`, `loading`, `userRole`, `signIn`, `signOut`, and `error`
    - Implement `extractUser` as a pure function that maps OIDC ID token claims to `AuthUser`
    - Use `useAuth()` from `react-oidc-context` internally to access OIDC session state
    - Implement role resolution by querying `client.models.UserRole.list({ filter: { userId: { eq: sub } } })` when user authenticates
    - Set `userRole` to `data[0].role.toLowerCase()` on success, or `null` on failure / no record
    - Expose `loading` as `true` while OIDC is initializing OR role query is in progress
    - Implement `signIn` to call `oidcAuth.signinRedirect()`
    - Implement `signOut` to call `oidcAuth.signoutRedirect()` with `post_logout_redirect_uri`, clear local role state, and handle endpoint failures gracefully
    - Expose OIDC error messages via the `error` field
    - Implement 10-second initialization timeout that resolves to unauthenticated state
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4, 4.5, 7.1, 7.2, 7.3, 7.4, 8.3, 8.5_

  - [~] 3.2 Update `src/contexts/AuthContext.tsx` to re-export from `OidcAuthContext`
    - Change the re-export to point to `OidcAuthContext` instead of `AmplifyAuthContext`
    - Export `OidcAuthProvider as AuthProvider` and `useAuth`
    - This maintains backward compatibility for all existing consumers
    - _Requirements: 2.1, 3.1_

- [ ] 4. Update main.tsx to integrate the OIDC AuthProvider
  - [~] 4.1 Modify `src/main.tsx` to wrap the app with `AuthProvider` from `react-oidc-context`
    - Import `AuthProvider` from `react-oidc-context` and `oidcConfig` from `./integrations/oidc/config`
    - Import `OidcAuthProvider` from `./contexts/OidcAuthContext`
    - Keep `configureAmplify()` call executing before render
    - Wrap `<App />` with `<AuthProvider {...oidcConfig}>` as outermost provider
    - Nest `<OidcAuthProvider>` inside `<AuthProvider>` and around `<App />`
    - Implement callback URL cleanup using `onSigninCallback` that removes `code`, `state`, and `session_state` query params via `window.history.replaceState`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 9.1, 9.2, 9.3, 9.4_

- [~] 5. Checkpoint - Verify provider integration
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Update ProtectedRoute component
  - [~] 6.1 Modify `src/components/ProtectedRoute.tsx` to handle null role with allowed roles
    - Keep import from `@/contexts/AuthContext` (now re-exports OIDC context)
    - Update logic: if `allowedRoles` is specified and `userRole` is `null`, redirect to `/auth`
    - Keep existing behavior: while loading show indicator, if no user redirect, if role mismatch redirect
    - If no `allowedRoles` specified, permit any authenticated user
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 7. Update Auth page with OIDC sign-in/sign-out
  - [~] 7.1 Replace the form-based login in `src/pages/Auth.tsx` with OIDC redirect flow
    - Remove email/password form and sign-up form (OIDC uses Cognito Hosted UI)
    - Present a single "Sign In" button for unauthenticated users that calls `signIn()` from auth context
    - Display error message from `error` field when OIDC redirect fails
    - After authentication and role resolution, redirect to role-specific dashboard: admin → `/admin`, rider → `/rider-dashboard`, investor → `/investor-portal`, offsetter → `/offsetter-dashboard`
    - If `userRole` is `null` after successful authentication, redirect to a default landing page (`/`)
    - Keep the visual layout (branding, right panel) intact
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3_

- [~] 8. Checkpoint - Verify end-to-end auth flow compiles
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Write unit tests for OIDC modules
  - [~] 9.1 Create `src/integrations/oidc/__tests__/config.test.ts`
    - Assert `authority`, `client_id`, `response_type`, `scope` values match requirements
    - Assert `redirect_uri` and `post_logout_redirect_uri` use `window.location.origin`
    - Assert `automaticSilentRenew` is `true` and notification time is `60`
    - Assert `userStore` uses `sessionStorage`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 8.1, 8.2_

  - [~] 9.2 Create `src/contexts/__tests__/OidcAuthContext.test.tsx`
    - Mock `react-oidc-context`'s `useAuth` hook
    - Mock Amplify `client.models.UserRole.list`
    - Test: when OIDC user available, `extractUser` correctly maps `sub`, `email`, `name` claims to `AuthUser`
    - Test: when role query succeeds, `userRole` is set to lowercase role value
    - Test: when role query fails, `userRole` is `null`
    - Test: when no user, context exposes `null` user and `null` role
    - Test: `loading` is `true` while OIDC initializing or role resolving
    - Test: `signIn` calls `signinRedirect`, `signOut` calls `signoutRedirect`
    - Test: `error` exposes OIDC error message
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4, 4.5_

  - [~] 9.3 Create `src/components/__tests__/ProtectedRoute.test.tsx`
    - Mock auth context with various user/role/loading combinations
    - Test: loading state shows indicator
    - Test: unauthenticated user redirects to `/auth`
    - Test: authenticated user with wrong role redirects to `/auth`
    - Test: authenticated user with `null` role and specified `allowedRoles` redirects to `/auth`
    - Test: authenticated user with correct role renders children
    - Test: no `allowedRoles` allows any authenticated user
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 9.4 Write property test for token claim extraction
    - **Property 1: Token Claim Extraction Preserves Identity**
    - For any OIDC ID token with arbitrary `sub`, `email`, and optional `name` strings, `extractUser` produces an `AuthUser` where `id === sub`, `email === email`, `fullName === name` (or undefined if absent)
    - Use `fast-check` with minimum 100 iterations
    - **Validates: Requirements 3.1, 6.2**

  - [ ]* 9.5 Write property test for role resolution lowercasing
    - **Property 2: Role Resolution Lowercasing**
    - For any UserRole record with role in (ADMIN, RIDER, INVESTOR, OFFSETTER), the resolved `AppRole` equals the role string converted to lowercase
    - Use `fast-check` with minimum 100 iterations
    - **Validates: Requirements 4.1**

  - [ ]* 9.6 Write property test for route access control decision
    - **Property 3: Route Access Control Decision**
    - For any combination of user (present/null), userRole (one of four roles or null), and allowedRoles (subset of roles or undefined), ProtectedRoute renders children iff user is not null AND (allowedRoles is undefined/empty OR userRole is in allowedRoles)
    - Use `fast-check` with minimum 100 iterations
    - **Validates: Requirements 5.1, 5.2, 5.4, 5.5, 5.6**

- [~] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The `AuthContext.tsx` re-export pattern preserves backward compatibility so existing component imports continue working without changes
- The Amplify Data layer (`client.models.*`) continues to function alongside the OIDC provider since `configureAmplify()` is called before the OIDC provider mounts

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["3.1"] },
    { "id": 3, "tasks": ["3.2", "4.1"] },
    { "id": 4, "tasks": ["6.1", "7.1"] },
    { "id": 5, "tasks": ["9.1", "9.2", "9.3", "9.4", "9.5", "9.6"] }
  ]
}
```

/**
 * AuthContext — now backed by OIDC (Cognito via react-oidc-context).
 * 
 * This re-exports from OidcAuthContext to maintain backward compatibility
 * with existing components that import from '@/contexts/AuthContext'.
 */
export { OidcAuthProvider as AuthProvider, useOidcAuth as useAuth } from './OidcAuthContext';

/**
 * AuthContext — now backed by AWS Amplify (Cognito + AppSync).
 * 
 * This re-exports from AmplifyAuthContext to maintain backward compatibility
 * with existing components that import from '@/contexts/AuthContext'.
 */
export { AuthProvider, useAuth } from './AmplifyAuthContext';

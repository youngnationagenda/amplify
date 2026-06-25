import { defineBackend } from '@aws-amplify/backend';

/**
 * Minimal Amplify Gen 2 backend definition.
 * 
 * This app uses Supabase for:
 * - Authentication (supabase auth)
 * - Database (PostgreSQL with RLS)
 * - Edge Functions (athena-query)
 * 
 * Amplify is used solely for static frontend hosting (CI/CD + CDN).
 * No Amplify auth, data, or storage resources are needed.
 */
const backend = defineBackend({});

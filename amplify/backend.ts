import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { athenaQuery } from './functions/athena-query/resource';

/**
 * Amplify Gen 2 backend definition for NetTribe.
 * 
 * Migrated from Supabase:
 * - Auth: Cognito (replaces Supabase Auth)
 * - Data: DynamoDB + AppSync GraphQL (replaces Supabase PostgreSQL)
 * - Functions: Lambda (replaces Supabase Edge Functions)
 */
const backend = defineBackend({
  auth,
  data,
  athenaQuery,
});

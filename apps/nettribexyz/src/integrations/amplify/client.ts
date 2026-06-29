import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';

/**
 * Typed GraphQL client for Amplify Data (AppSync + DynamoDB).
 * 
 * Usage:
 *   import { client } from '@/integrations/amplify/client';
 *   const { data } = await client.models.CarbonCredit.list({ filter: { status: { eq: 'AVAILABLE' } } });
 */
export const client = generateClient<Schema>();

import { Amplify } from 'aws-amplify';

/**
 * Dynamic Amplify configuration loader
 * Handles both build-time and runtime scenarios:
 * - In development: reads from amplify_outputs.json
 * - In production: reads from window environment variables or localStorage
 * - In CI/CD: gracefully handles missing file during build
 */

let amplifyConfig: any = null;

async function loadConfig() {
  if (amplifyConfig) return amplifyConfig;

  try {
    // Try to load from amplify_outputs.json first (local development)
    const response = await fetch('/amplify_outputs.json');
    if (response.ok) {
      amplifyConfig = await response.json();
      return amplifyConfig;
    }
  } catch (error) {
    console.debug('amplify_outputs.json not found (expected in CI/CD builds)');
  }

  // Fallback: construct config from environment variables or stored config
  amplifyConfig = {
    auth: {
      user_pool_id: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
      aws_region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
      user_pool_client_id: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
      identity_pool_id: import.meta.env.VITE_IDENTITY_POOL_ID || '',
    },
    data: {
      url: import.meta.env.VITE_APPSYNC_GRAPHQL_ENDPOINT || '',
      aws_region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
      default_authorization_type: 'AMAZON_COGNITO_USER_POOLS',
      authorization_types: ['AWS_IAM'],
    },
  };

  return amplifyConfig;
}

/**
 * Configure Amplify with generated outputs.
 * Call this once at app startup (main.tsx).
 */
export async function configureAmplify() {
  const config = await loadConfig();
  
  // Only configure if we have essential credentials
  if (config.auth?.user_pool_id) {
    Amplify.configure(config as any);
  } else {
    console.warn(
      'Amplify config incomplete. Ensure amplify_outputs.json exists or set VITE_* environment variables.'
    );
  }
}

export async function getAmplifyConfig() {
  return loadConfig();
}

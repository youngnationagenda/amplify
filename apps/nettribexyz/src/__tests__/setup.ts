import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock AWS Amplify configuration to prevent actual AWS calls during tests
vi.mock('aws-amplify', () => ({
  Amplify: {
    configure: vi.fn(),
    getConfig: vi.fn(() => ({
      Auth: {
        Cognito: {
          userPoolId: 'us-east-1_testpool',
          userPoolClientId: 'test-client-id',
          identityPoolId: 'us-east-1:test-identity-pool',
        },
      },
      API: {
        GraphQL: {
          endpoint: 'https://test-appsync-endpoint.amazonaws.com/graphql',
          defaultAuthMode: 'userPool',
        },
      },
    })),
  },
  fetchAuthSession: vi.fn(() =>
    Promise.resolve({
      tokens: {
        accessToken: { toString: () => 'mock-access-token' },
        idToken: { toString: () => 'mock-id-token' },
      },
    })
  ),
}));

// Mock @aws-amplify/ui-react to avoid rendering issues in tests
vi.mock('@aws-amplify/ui-react', () => ({
  Authenticator: ({ children }: { children: React.ReactNode }) => children,
  useAuthenticator: vi.fn(() => ({
    user: { username: 'testuser', userId: 'test-user-id' },
    signOut: vi.fn(),
    authStatus: 'authenticated',
  })),
}));

// Suppress console errors for expected test failures
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  // Filter out known React/testing noise
  const message = typeof args[0] === 'string' ? args[0] : '';
  if (
    message.includes('Warning: ReactDOM.render is no longer supported') ||
    message.includes('Error: Not implemented')
  ) {
    return;
  }
  originalConsoleError.call(console, ...args);
};

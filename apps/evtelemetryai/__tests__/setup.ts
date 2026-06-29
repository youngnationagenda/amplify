import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock environment variables used by the telemetry app
vi.stubGlobal('process', {
  ...process,
  env: {
    ...process.env,
    API_KEY: 'test-api-key',
    GEMINI_API_KEY: 'test-gemini-api-key',
  },
});

// Mock fetch for API calls in tests
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    status: 200,
  } as Response)
);

// Suppress console errors for expected test noise
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  const message = typeof args[0] === 'string' ? args[0] : '';
  if (
    message.includes('Warning: ReactDOM.render is no longer supported') ||
    message.includes('Error: Not implemented')
  ) {
    return;
  }
  originalConsoleError.call(console, ...args);
};

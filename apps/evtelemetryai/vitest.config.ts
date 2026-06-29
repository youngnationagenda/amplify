import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./__tests__/setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}', '!node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['components/**/*.{ts,tsx}', 'services/**/*.{ts,tsx}', 'utils/**/*.{ts,tsx}', '*.tsx'],
      exclude: [
        '**/*.d.ts',
        '**/__tests__/**',
        '**/test/**',
        'index.tsx',
        'vite-env.d.ts',
        'lambda/**',
        'node_modules/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});

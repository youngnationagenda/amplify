import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'amplify-functions',
    include: ['**/handler.test.ts'],
  },
});

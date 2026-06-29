import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'apps/nettribexyz/vitest.config.ts',
  'apps/evtelemetryai/vitest.config.ts',
  'amplify/functions/vitest.config.ts',
]);

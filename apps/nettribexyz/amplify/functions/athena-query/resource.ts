import { defineFunction } from '@aws-amplify/backend';

export const athenaQuery = defineFunction({
  name: 'athena-query',
  entry: './handler.ts',
  environment: {
    AWS_ATHENA_WORKGROUP: 'primary',
    AWS_ATHENA_OUTPUT_LOCATION: 's3://nettribe-athena-results/',
  },
  timeoutSeconds: 90,
});

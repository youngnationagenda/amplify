import { defineFunction } from '@aws-amplify/backend';

/**
 * Telemetry ingestion Lambda.
 * Receives IoT telemetry events via API Gateway and writes to Kinesis Firehose.
 * Data lands in S3 (Parquet) for Athena queries.
 */
export const telemetryIngest = defineFunction({
  name: 'telemetry-ingest',
  entry: './handler.ts',
  environment: {
    FIREHOSE_STREAM_NAME: 'nettribe-telemetry-stream',
    TELEMETRY_BUCKET: 'nettribe-telemetry-data',
  },
  timeoutSeconds: 30,
  memoryMB: 256,
});

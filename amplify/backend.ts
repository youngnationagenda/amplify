import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { athenaQuery } from './functions/athena-query/resource';
import { telemetryIngest } from './functions/telemetry-ingest/resource';

/**
 * Amplify Gen 2 backend definition for NetTribe.
 *
 * Architecture:
 * ─────────────────────────────────────────────────────────────
 * Auth:       Cognito (user pools + groups: admin, rider, investor, offsetter)
 * Data:       DynamoDB + AppSync GraphQL (platform CRUD)
 * Functions:
 *   - athena-query:      Query telemetry data from S3 via Athena
 *   - telemetry-ingest:  Receive IoT events → Kinesis Firehose → S3
 *
 * Infrastructure (managed outside Amplify, see /infra):
 *   - Kinesis Firehose:  nettribe-telemetry-stream → S3 (Parquet)
 *   - S3:                nettribe-telemetry-data (raw + processed)
 *   - Athena:            nettribe_carbon database for analytics
 *   - API Gateway:       Unified routing for all services
 * ─────────────────────────────────────────────────────────────
 */
const backend = defineBackend({
  auth,
  data,
  athenaQuery,
  telemetryIngest,
});

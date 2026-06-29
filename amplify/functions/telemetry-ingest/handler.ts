import type { APIGatewayProxyHandler } from 'aws-lambda';
import {
  FirehoseClient,
  PutRecordCommand,
  PutRecordBatchCommand,
} from '@aws-sdk/client-firehose';

const firehose = new FirehoseClient({});
const STREAM_NAME = process.env.FIREHOSE_STREAM_NAME || 'nettribe-telemetry-stream';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
};

interface TelemetryEvent {
  deviceId: string;
  riderId?: string;
  motorcycleId?: string;
  timestamp: string;
  latitude?: number;
  longitude?: number;
  speedKmh?: number;
  batteryLevel?: number;
  energyConsumedKwh?: number;
  distanceKm?: number;
  ambientTempC?: number;
  motorTempC?: number;
  eventType: 'heartbeat' | 'trip_start' | 'trip_end' | 'trip_waypoint' | 'alert';
  metadata?: Record<string, unknown>;
}

function validateEvent(event: unknown): event is TelemetryEvent {
  if (!event || typeof event !== 'object') return false;
  const e = event as Record<string, unknown>;
  return typeof e.deviceId === 'string' && typeof e.eventType === 'string';
}

export const handler: APIGatewayProxyHandler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: 'ok' };
  }

  try {
    const body = JSON.parse(event.body || '{}');

    // Support single event or batch
    const events: unknown[] = Array.isArray(body) ? body : [body];

    if (events.length === 0) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'No telemetry events provided' }),
      };
    }

    if (events.length > 500) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Batch size exceeds 500 events' }),
      };
    }

    // Validate all events
    const validEvents: TelemetryEvent[] = [];
    const errors: Array<{ index: number; reason: string }> = [];

    events.forEach((e, i) => {
      if (validateEvent(e)) {
        validEvents.push({
          ...e,
          timestamp: e.timestamp || new Date().toISOString(),
        });
      } else {
        errors.push({ index: i, reason: 'Missing required fields: deviceId, eventType' });
      }
    });

    if (validEvents.length === 0) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'No valid events', errors }),
      };
    }

    // Write to Firehose
    if (validEvents.length === 1) {
      const record = JSON.stringify(validEvents[0]) + '\n';
      await firehose.send(
        new PutRecordCommand({
          DeliveryStreamName: STREAM_NAME,
          Record: { Data: Buffer.from(record) },
        })
      );
    } else {
      // Batch write (max 500 per PutRecordBatch)
      const records = validEvents.map((e) => ({
        Data: Buffer.from(JSON.stringify(e) + '\n'),
      }));

      await firehose.send(
        new PutRecordBatchCommand({
          DeliveryStreamName: STREAM_NAME,
          Records: records,
        })
      );
    }

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accepted: validEvents.length,
        rejected: errors.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Telemetry ingest error:', message);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

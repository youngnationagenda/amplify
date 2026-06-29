import { describe, it, expect, beforeEach } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import {
  FirehoseClient,
  PutRecordCommand,
  PutRecordBatchCommand,
} from '@aws-sdk/client-firehose';
import { handler } from './handler';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';

const firehoseMock = mockClient(FirehoseClient);

function createEvent(body: unknown, method = 'POST'): APIGatewayProxyEvent {
  return {
    httpMethod: method,
    body: JSON.stringify(body),
    headers: {},
    multiValueHeaders: {},
    isBase64Encoded: false,
    path: '/telemetry',
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as APIGatewayProxyEvent['requestContext'],
    resource: '',
  };
}

const mockContext: Context = {
  callbackWaitsForEmptyEventLoop: false,
  functionName: 'telemetry-ingest',
  functionVersion: '1',
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789:function:telemetry-ingest',
  memoryLimitInMB: '256',
  awsRequestId: 'test-request-id',
  logGroupName: '/aws/lambda/telemetry-ingest',
  logStreamName: '2024/01/01/[$LATEST]abc123',
  getRemainingTimeInMillis: () => 30000,
  done: () => {},
  fail: () => {},
  succeed: () => {},
};

describe('telemetry-ingest handler', () => {
  beforeEach(() => {
    firehoseMock.reset();
  });

  describe('valid event processing', () => {
    it('should accept a single valid telemetry event and call PutRecord', async () => {
      firehoseMock.on(PutRecordCommand).resolves({ RecordId: 'rec-1' });

      const event = createEvent({
        deviceId: 'device-001',
        eventType: 'heartbeat',
        timestamp: '2024-01-15T10:00:00Z',
      });

      const result = await handler(event, mockContext, () => {});
      expect(result).toBeDefined();
      expect(result!.statusCode).toBe(200);

      const body = JSON.parse(result!.body);
      expect(body.accepted).toBe(1);
      expect(body.rejected).toBe(0);

      const putCalls = firehoseMock.commandCalls(PutRecordCommand);
      expect(putCalls).toHaveLength(1);
      expect(putCalls[0].args[0].input.DeliveryStreamName).toBe('nettribe-telemetry-stream');
    });

    it('should accept a batch of valid events and call PutRecordBatch', async () => {
      firehoseMock.on(PutRecordBatchCommand).resolves({
        FailedPutCount: 0,
        RequestResponses: [
          { RecordId: 'rec-1' },
          { RecordId: 'rec-2' },
        ],
      });

      const events = [
        { deviceId: 'device-001', eventType: 'heartbeat', timestamp: '2024-01-15T10:00:00Z' },
        { deviceId: 'device-002', eventType: 'trip_start', timestamp: '2024-01-15T10:01:00Z' },
      ];

      const event = createEvent(events);
      const result = await handler(event, mockContext, () => {});
      expect(result).toBeDefined();
      expect(result!.statusCode).toBe(200);

      const body = JSON.parse(result!.body);
      expect(body.accepted).toBe(2);
      expect(body.rejected).toBe(0);

      const batchCalls = firehoseMock.commandCalls(PutRecordBatchCommand);
      expect(batchCalls).toHaveLength(1);
      expect(batchCalls[0].args[0].input.Records).toHaveLength(2);
    });

    it('should return accepted and rejected counts for mixed valid/invalid batch', async () => {
      firehoseMock.on(PutRecordBatchCommand).resolves({
        FailedPutCount: 0,
        RequestResponses: [{ RecordId: 'rec-1' }],
      });

      const events = [
        { deviceId: 'device-001', eventType: 'heartbeat' },
        { invalid: true }, // missing required fields
        { deviceId: 'device-003', eventType: 'trip_end' },
      ];

      const event = createEvent(events);
      const result = await handler(event, mockContext, () => {});
      expect(result).toBeDefined();
      expect(result!.statusCode).toBe(200);

      const body = JSON.parse(result!.body);
      expect(body.accepted).toBe(2);
      expect(body.rejected).toBe(1);
      expect(body.errors).toHaveLength(1);
      expect(body.errors[0].index).toBe(1);
    });

    it('should handle OPTIONS preflight request', async () => {
      const event = createEvent({}, 'OPTIONS');
      const result = await handler(event, mockContext, () => {});
      expect(result).toBeDefined();
      expect(result!.statusCode).toBe(200);
      expect(result!.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
    });
  });

  describe('invalid payload rejection', () => {
    it('should return 400 when event is missing deviceId', async () => {
      const event = createEvent({ eventType: 'heartbeat' });
      const result = await handler(event, mockContext, () => {});
      expect(result).toBeDefined();
      expect(result!.statusCode).toBe(400);

      const body = JSON.parse(result!.body);
      expect(body.error).toBe('No valid events');
      expect(body.errors[0].reason).toContain('deviceId');
    });

    it('should return 400 when event is missing eventType', async () => {
      const event = createEvent({ deviceId: 'device-001' });
      const result = await handler(event, mockContext, () => {});
      expect(result).toBeDefined();
      expect(result!.statusCode).toBe(400);

      const body = JSON.parse(result!.body);
      expect(body.error).toBe('No valid events');
      expect(body.errors[0].reason).toContain('eventType');
    });

    it('should return 400 when payload is empty array', async () => {
      const event = createEvent([]);
      const result = await handler(event, mockContext, () => {});
      expect(result).toBeDefined();
      expect(result!.statusCode).toBe(400);

      const body = JSON.parse(result!.body);
      expect(body.error).toBe('No telemetry events provided');
    });

    it('should return 400 when batch exceeds 500 events', async () => {
      const events = Array.from({ length: 501 }, (_, i) => ({
        deviceId: `device-${i}`,
        eventType: 'heartbeat',
      }));

      const event = createEvent(events);
      const result = await handler(event, mockContext, () => {});
      expect(result).toBeDefined();
      expect(result!.statusCode).toBe(400);

      const body = JSON.parse(result!.body);
      expect(body.error).toBe('Batch size exceeds 500 events');
    });

    it('should return 400 when all events in batch are invalid', async () => {
      const events = [
        { foo: 'bar' },
        { something: 'else' },
      ];

      const event = createEvent(events);
      const result = await handler(event, mockContext, () => {});
      expect(result).toBeDefined();
      expect(result!.statusCode).toBe(400);

      const body = JSON.parse(result!.body);
      expect(body.error).toBe('No valid events');
      expect(body.errors).toHaveLength(2);
    });
  });

  describe('Firehose error handling', () => {
    it('should return 500 when PutRecord fails', async () => {
      firehoseMock.on(PutRecordCommand).rejects(new Error('Firehose service unavailable'));

      const event = createEvent({
        deviceId: 'device-001',
        eventType: 'heartbeat',
      });

      const result = await handler(event, mockContext, () => {});
      expect(result).toBeDefined();
      expect(result!.statusCode).toBe(500);

      const body = JSON.parse(result!.body);
      expect(body.error).toBe('Internal server error');
    });

    it('should return 500 when PutRecordBatch fails', async () => {
      firehoseMock.on(PutRecordBatchCommand).rejects(new Error('Firehose throttled'));

      const events = [
        { deviceId: 'device-001', eventType: 'heartbeat' },
        { deviceId: 'device-002', eventType: 'trip_start' },
      ];

      const event = createEvent(events);
      const result = await handler(event, mockContext, () => {});
      expect(result).toBeDefined();
      expect(result!.statusCode).toBe(500);

      const body = JSON.parse(result!.body);
      expect(body.error).toBe('Internal server error');
    });
  });
});

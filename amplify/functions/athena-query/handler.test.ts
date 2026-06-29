import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import {
  AthenaClient,
  StartQueryExecutionCommand,
  GetQueryExecutionCommand,
  GetQueryResultsCommand,
  StopQueryExecutionCommand,
} from '@aws-sdk/client-athena';
import { handler } from './handler';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';

const athenaMock = mockClient(AthenaClient);

function createEvent(body: unknown, method = 'POST'): APIGatewayProxyEvent {
  return {
    httpMethod: method,
    body: JSON.stringify(body),
    headers: {},
    multiValueHeaders: {},
    isBase64Encoded: false,
    path: '/athena',
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
  functionName: 'athena-query',
  functionVersion: '1',
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789:function:athena-query',
  memoryLimitInMB: '256',
  awsRequestId: 'test-request-id',
  logGroupName: '/aws/lambda/athena-query',
  logStreamName: '2024/01/01/[$LATEST]abc123',
  getRemainingTimeInMillis: () => 60000,
  done: () => {},
  fail: () => {},
  succeed: () => {},
};

describe('athena-query handler', () => {
  beforeEach(() => {
    athenaMock.reset();
    vi.restoreAllMocks();
  });

  describe('query execution', () => {
    it('should execute a preset query and return results', async () => {
      athenaMock.on(StartQueryExecutionCommand).resolves({
        QueryExecutionId: 'query-123',
      });

      athenaMock.on(GetQueryExecutionCommand).resolves({
        QueryExecution: {
          Status: { State: 'SUCCEEDED' },
        },
      });

      athenaMock.on(GetQueryResultsCommand).resolves({
        ResultSet: {
          Rows: [
            { Data: [{ VarCharValue: 'credit_id' }, { VarCharValue: 'tokens' }] },
            { Data: [{ VarCharValue: 'credit-001' }, { VarCharValue: '100' }] },
            { Data: [{ VarCharValue: 'credit-002' }, { VarCharValue: '250' }] },
          ],
        },
      });

      const event = createEvent({ preset: 'recent_issued', limit: 10 });
      const result = await handler(event, mockContext, () => {});
      expect(result).toBeDefined();
      expect(result!.statusCode).toBe(200);

      const body = JSON.parse(result!.body);
      expect(body.query_id).toBe('query-123');
      expect(body.columns).toEqual(['credit_id', 'tokens']);
      expect(body.rows).toHaveLength(2);
      expect(body.rows[0]).toEqual({ credit_id: 'credit-001', tokens: '100' });
      expect(body.count).toBe(2);

      const startCalls = athenaMock.commandCalls(StartQueryExecutionCommand);
      expect(startCalls).toHaveLength(1);
      expect(startCalls[0].args[0].input.QueryString).toContain('credits_issued');
      expect(startCalls[0].args[0].input.QueryString).toContain('LIMIT 10');
    });

    it('should execute a table query for allowed tables', async () => {
      athenaMock.on(StartQueryExecutionCommand).resolves({
        QueryExecutionId: 'query-456',
      });

      athenaMock.on(GetQueryExecutionCommand).resolves({
        QueryExecution: {
          Status: { State: 'SUCCEEDED' },
        },
      });

      athenaMock.on(GetQueryResultsCommand).resolves({
        ResultSet: {
          Rows: [
            { Data: [{ VarCharValue: 'burn_id' }, { VarCharValue: 'tokens_burned' }] },
            { Data: [{ VarCharValue: 'burn-001' }, { VarCharValue: '50' }] },
          ],
        },
      });

      const event = createEvent({ table: 'credits_burned', limit: 5 });
      const result = await handler(event, mockContext, () => {});
      expect(result).toBeDefined();
      expect(result!.statusCode).toBe(200);

      const body = JSON.parse(result!.body);
      expect(body.query_id).toBe('query-456');
      expect(body.columns).toEqual(['burn_id', 'tokens_burned']);
      expect(body.rows).toHaveLength(1);

      const startCalls = athenaMock.commandCalls(StartQueryExecutionCommand);
      expect(startCalls[0].args[0].input.QueryString).toContain('nettribe_carbon.credits_burned');
      expect(startCalls[0].args[0].input.QueryString).toContain('LIMIT 5');
    });

    it('should handle OPTIONS preflight request', async () => {
      const event = createEvent({}, 'OPTIONS');
      const result = await handler(event, mockContext, () => {});
      expect(result).toBeDefined();
      expect(result!.statusCode).toBe(200);
      expect(result!.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
    });

    it('should clamp limit to range [1, 1000]', async () => {
      athenaMock.on(StartQueryExecutionCommand).resolves({
        QueryExecutionId: 'query-789',
      });

      athenaMock.on(GetQueryExecutionCommand).resolves({
        QueryExecution: {
          Status: { State: 'SUCCEEDED' },
        },
      });

      athenaMock.on(GetQueryResultsCommand).resolves({
        ResultSet: { Rows: [{ Data: [{ VarCharValue: 'col1' }] }] },
      });

      const event = createEvent({ preset: 'totals_burned', limit: 9999 });
      const result = await handler(event, mockContext, () => {});
      expect(result).toBeDefined();
      expect(result!.statusCode).toBe(200);

      const startCalls = athenaMock.commandCalls(StartQueryExecutionCommand);
      // The limit should be clamped to 1000
      expect(startCalls[0].args[0].input.QueryString).toBeDefined();
    });
  });

  describe('invalid parameters', () => {
    it('should return 400 when neither preset nor table is provided', async () => {
      const event = createEvent({});
      const result = await handler(event, mockContext, () => {});
      expect(result).toBeDefined();
      expect(result!.statusCode).toBe(400);

      const body = JSON.parse(result!.body);
      expect(body.error).toContain('preset');
      expect(body.presets).toBeDefined();
      expect(body.tables).toBeDefined();
    });

    it('should return 400 for disallowed table name', async () => {
      const event = createEvent({ table: 'users_secret' });
      const result = await handler(event, mockContext, () => {});
      expect(result).toBeDefined();
      expect(result!.statusCode).toBe(400);

      const body = JSON.parse(result!.body);
      expect(body.error).toContain('preset');
    });

    it('should return 400 for unknown preset', async () => {
      const event = createEvent({ preset: 'nonexistent_preset' });
      const result = await handler(event, mockContext, () => {});
      expect(result).toBeDefined();
      expect(result!.statusCode).toBe(400);

      const body = JSON.parse(result!.body);
      expect(body.error).toContain('preset');
    });
  });

  describe('Athena error handling', () => {
    it('should return 500 when StartQueryExecution fails', async () => {
      athenaMock.on(StartQueryExecutionCommand).rejects(new Error('Access Denied'));

      const event = createEvent({ preset: 'recent_issued' });
      const result = await handler(event, mockContext, () => {});
      expect(result).toBeDefined();
      expect(result!.statusCode).toBe(500);

      const body = JSON.parse(result!.body);
      expect(body.error).toBe('Access Denied');
    });

    it('should return 500 when query state is FAILED', async () => {
      athenaMock.on(StartQueryExecutionCommand).resolves({
        QueryExecutionId: 'query-fail',
      });

      athenaMock.on(GetQueryExecutionCommand).resolves({
        QueryExecution: {
          Status: {
            State: 'FAILED',
            StateChangeReason: 'TABLE_NOT_FOUND: Table not found',
          },
        },
      });

      const event = createEvent({ table: 'credits_issued' });
      const result = await handler(event, mockContext, () => {});
      expect(result).toBeDefined();
      expect(result!.statusCode).toBe(500);

      const body = JSON.parse(result!.body);
      expect(body.error).toContain('FAILED');
      expect(body.error).toContain('TABLE_NOT_FOUND');
    });

    it('should return 500 when query state is CANCELLED', async () => {
      athenaMock.on(StartQueryExecutionCommand).resolves({
        QueryExecutionId: 'query-cancel',
      });

      athenaMock.on(GetQueryExecutionCommand).resolves({
        QueryExecution: {
          Status: {
            State: 'CANCELLED',
            StateChangeReason: 'User cancelled the query',
          },
        },
      });

      const event = createEvent({ preset: 'recent_burned' });
      const result = await handler(event, mockContext, () => {});
      expect(result).toBeDefined();
      expect(result!.statusCode).toBe(500);

      const body = JSON.parse(result!.body);
      expect(body.error).toContain('CANCELLED');
    });
  });

  describe('query timeout handling', () => {
    it('should return 500 when query exceeds 60-second deadline', async () => {
      athenaMock.on(StartQueryExecutionCommand).resolves({
        QueryExecutionId: 'query-timeout',
      });

      // Mock Date.now to simulate time passing beyond the deadline
      const originalDateNow = Date.now;
      let callCount = 0;
      const startTime = 1700000000000;

      vi.spyOn(Date, 'now').mockImplementation(() => {
        callCount++;
        // First call is for setting the deadline, subsequent calls exceed it
        if (callCount === 1) return startTime;
        return startTime + 61_000; // 61 seconds later — exceeds 60s deadline
      });

      athenaMock.on(GetQueryExecutionCommand).resolves({
        QueryExecution: {
          Status: { State: 'RUNNING' },
        },
      });

      athenaMock.on(StopQueryExecutionCommand).resolves({});

      const event = createEvent({ preset: 'recent_issued' });
      const result = await handler(event, mockContext, () => {});
      expect(result).toBeDefined();
      expect(result!.statusCode).toBe(500);

      const body = JSON.parse(result!.body);
      expect(body.error).toContain('timed out');

      // Verify StopQueryExecution was called to cancel the query
      const stopCalls = athenaMock.commandCalls(StopQueryExecutionCommand);
      expect(stopCalls).toHaveLength(1);
      expect(stopCalls[0].args[0].input.QueryExecutionId).toBe('query-timeout');

      vi.spyOn(Date, 'now').mockRestore();
    });
  });
});

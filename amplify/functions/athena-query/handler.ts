import type { APIGatewayProxyHandler } from 'aws-lambda';
import {
  AthenaClient,
  StartQueryExecutionCommand,
  GetQueryExecutionCommand,
  GetQueryResultsCommand,
  StopQueryExecutionCommand,
} from '@aws-sdk/client-athena';

const athena = new AthenaClient({});

const ALLOWED_TABLES = new Set([
  'credits_issued',
  'credits_burned',
  'ico_purchases',
  'carbon_purchases',
]);

const PRESETS: Record<string, (limit: number) => string> = {
  recent_issued: (l) =>
    `SELECT credit_id, motorcycle_id, rider_id, tokens, co2_offset_tons, issued_at
     FROM nettribe_carbon.credits_issued ORDER BY issued_at DESC LIMIT ${l}`,
  recent_burned: (l) =>
    `SELECT burn_id, user_id, tokens_burned, co2_offset_tons, certificate_number, burned_at
     FROM nettribe_carbon.credits_burned ORDER BY burned_at DESC LIMIT ${l}`,
  totals_burned: () =>
    `SELECT SUM(tokens_burned) AS total_tokens, SUM(co2_offset_tons) AS total_tons
     FROM nettribe_carbon.credits_burned`,
  totals_issued: () =>
    `SELECT SUM(tokens) AS total_tokens, SUM(co2_offset_tons) AS total_tons
     FROM nettribe_carbon.credits_issued`,
  ico_summary: (l) =>
    `SELECT offering_id, SUM(tons_purchased) AS tons, SUM(total_usd) AS usd
     FROM nettribe_carbon.ico_purchases GROUP BY offering_id ORDER BY usd DESC LIMIT ${l}`,
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
};

export const handler: APIGatewayProxyHandler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: 'ok' };
  }

  try {
    const { preset, table, limit = 50 } = JSON.parse(event.body || '{}');
    const safeLimit = Math.min(Math.max(parseInt(String(limit), 10) || 50, 1), 1000);

    let sql: string;
    if (preset && PRESETS[preset]) {
      sql = PRESETS[preset](safeLimit);
    } else if (table && ALLOWED_TABLES.has(table)) {
      sql = `SELECT * FROM nettribe_carbon.${table} LIMIT ${safeLimit}`;
    } else {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Provide { preset } or { table }',
          presets: Object.keys(PRESETS),
          tables: [...ALLOWED_TABLES],
        }),
      };
    }

    const workgroup = process.env.AWS_ATHENA_WORKGROUP || 'primary';
    const outputLocation = process.env.AWS_ATHENA_OUTPUT_LOCATION;

    // Start query
    const startResult = await athena.send(
      new StartQueryExecutionCommand({
        QueryString: sql,
        WorkGroup: workgroup,
        ...(outputLocation && {
          ResultConfiguration: { OutputLocation: outputLocation },
        }),
      })
    );

    const queryExecutionId = startResult.QueryExecutionId!;

    // Poll for completion
    let state = 'QUEUED';
    let delay = 700;
    const deadline = Date.now() + 60_000;

    while (state === 'QUEUED' || state === 'RUNNING') {
      if (Date.now() > deadline) {
        await athena
          .send(new StopQueryExecutionCommand({ QueryExecutionId: queryExecutionId }))
          .catch(() => {});
        throw new Error('Athena query timed out after 60s');
      }
      await new Promise((r) => setTimeout(r, delay));
      delay = Math.min(delay * 1.4, 3500);

      const execResult = await athena.send(
        new GetQueryExecutionCommand({ QueryExecutionId: queryExecutionId })
      );
      state = execResult.QueryExecution?.Status?.State || 'FAILED';

      if (state === 'FAILED' || state === 'CANCELLED') {
        throw new Error(
          `Query ${state}: ${execResult.QueryExecution?.Status?.StateChangeReason ?? 'unknown'}`
        );
      }
    }

    // Get results
    const resultsResponse = await athena.send(
      new GetQueryResultsCommand({
        QueryExecutionId: queryExecutionId,
        MaxResults: 1000,
      })
    );

    const rows = resultsResponse.ResultSet?.Rows ?? [];
    const [header, ...dataRows] = rows;
    const columns = (header?.Data ?? []).map((d) => d.VarCharValue ?? '');
    const records = dataRows.map((row) =>
      Object.fromEntries(
        (row.Data ?? []).map((d, i) => [columns[i], d.VarCharValue ?? null])
      )
    );

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query_id: queryExecutionId,
        columns,
        rows: records,
        count: records.length,
      }),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: message }),
    };
  }
};

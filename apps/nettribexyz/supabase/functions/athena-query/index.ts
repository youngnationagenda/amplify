import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const GATEWAY = 'https://connector-gateway.lovable.dev/aws_athena/';

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

async function athena(op: string, body: Record<string, unknown>) {
  const r = await fetch(GATEWAY, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
      'X-Connection-Api-Key': Deno.env.get('AWS_ATHENA_API_KEY') ?? '',
      'X-Amz-Target': `AmazonAthena.${op}`,
      'Content-Type': 'application/x-amz-json-1.1',
    },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`Athena ${op} ${r.status}: ${text}`);
  return JSON.parse(text);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!Deno.env.get('LOVABLE_API_KEY')) throw new Error('LOVABLE_API_KEY not set');
    if (!Deno.env.get('AWS_ATHENA_API_KEY')) throw new Error('AWS_ATHENA_API_KEY not set');

    const { preset, table, limit = 50 } = await req.json().catch(() => ({}));
    const safeLimit = Math.min(Math.max(parseInt(String(limit), 10) || 50, 1), 1000);

    let sql: string;
    if (preset && PRESETS[preset]) {
      sql = PRESETS[preset](safeLimit);
    } else if (table && ALLOWED_TABLES.has(table)) {
      sql = `SELECT * FROM nettribe_carbon.${table} LIMIT ${safeLimit}`;
    } else {
      return new Response(
        JSON.stringify({
          error: 'Provide { preset } or { table }',
          presets: Object.keys(PRESETS),
          tables: [...ALLOWED_TABLES],
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const WG = Deno.env.get('AWS_ATHENA_WORKGROUP');
    const OUT = Deno.env.get('AWS_ATHENA_OUTPUT_LOCATION');

    const { QueryExecutionId } = await athena('StartQueryExecution', {
      QueryString: sql,
      ClientRequestToken: crypto.randomUUID(),
      ...(WG && { WorkGroup: WG }),
      ...(OUT && { ResultConfiguration: { OutputLocation: OUT } }),
    });

    let state = 'QUEUED';
    let delay = 700;
    const deadline = Date.now() + 60_000;
    while (state === 'QUEUED' || state === 'RUNNING') {
      if (Date.now() > deadline) {
        await athena('StopQueryExecution', { QueryExecutionId }).catch(() => {});
        throw new Error('Athena query timed out after 60s');
      }
      await new Promise((r) => setTimeout(r, delay));
      delay = Math.min(delay * 1.4, 3500);
      const { QueryExecution } = await athena('GetQueryExecution', { QueryExecutionId });
      state = QueryExecution.Status.State;
      if (state === 'FAILED' || state === 'CANCELLED') {
        throw new Error(`Query ${state}: ${QueryExecution.Status.StateChangeReason ?? 'unknown'}`);
      }
    }

    const { ResultSet } = await athena('GetQueryResults', { QueryExecutionId, MaxResults: 1000 });
    const [header, ...rows] = ResultSet.Rows ?? [];
    const columns = (header?.Data ?? []).map((d: { VarCharValue?: string }) => d.VarCharValue ?? '');
    const records = rows.map((row: { Data?: { VarCharValue?: string }[] }) =>
      Object.fromEntries((row.Data ?? []).map((d, i) => [columns[i], d.VarCharValue ?? null])),
    );

    return new Response(
      JSON.stringify({ query_id: QueryExecutionId, columns, rows: records, count: records.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
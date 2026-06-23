import type { APIRoute } from 'astro';
import { checkRateLimit, consumeRateLimit } from '../../lib/rateLimit';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const { env } = (locals as App.Locals).runtime;

  const kv = (env as Record<string, unknown>).RATE_LIMIT as KVNamespace | undefined;
  if (!kv) {
    return new Response(JSON.stringify({ error: 'Service temporarily unavailable.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const ip = request.headers.get('CF-Connecting-IP') ?? '127.0.0.1';
  const check = await checkRateLimit(kv, 'steelman', ip);
  if (!check.allowed) {
    const hours = Math.ceil(check.retryAfterSecs / 3600);
    return new Response(
      JSON.stringify({ error: `You've used your 2 free requests for today. Try again in about ${hours} hour${hours === 1 ? '' : 's'}.` }),
      { status: 429, headers: { 'Content-Type': 'application/json', 'X-Rate-Limit-Remaining': '0' } }
    );
  }

  let position: string;
  try {
    const body = await request.json();
    position = typeof body.position === 'string' ? body.position.trim() : '';
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!position || position.length < 10) {
    return new Response(JSON.stringify({ error: 'Describe your position first.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (position.length > 1000) {
    return new Response(JSON.stringify({ error: 'Keep it under 1000 characters.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const systemPrompt = `You are a rigorous debate coach and critical thinking expert.
Given a position or decision, return JSON with exactly these keys:
- "steelman": the strongest possible counterargument to the position (2-3 sentences, genuine and sharp)
- "weaknesses": the 2-3 most significant weaknesses in the original position (array of strings, each 1 sentence)
- "score": how defensible the original position is, from 1-10 (integer), where 10 means nearly unassailable
- "scoreReason": one sentence explaining the score

Respond with raw JSON only. No markdown, no code fences.`;

  try {
    const result = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Position to analyze:\n\n${position}` },
      ],
      max_tokens: 500,
    });

    let parsed: { steelman: string; weaknesses: string[]; score: number; scoreReason: string };
    try {
      const raw = result.response;
      if (raw && typeof raw === 'object') {
        parsed = raw as typeof parsed;
      } else {
        const str = String(raw ?? '');
        const match = str.match(/\{[\s\S]*\}/);
        if (!match) throw new Error('no json object found');
        parsed = JSON.parse(match[0]);
      }
      if (
        typeof parsed.steelman !== 'string' ||
        !Array.isArray(parsed.weaknesses) ||
        typeof parsed.score !== 'number' ||
        typeof parsed.scoreReason !== 'string'
      ) {
        throw new Error('invalid shape');
      }
    } catch {
      console.error('Parse error. Raw response:', result.response);
      return new Response(JSON.stringify({ error: 'Model returned unexpected format. Try again.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const remaining = await consumeRateLimit(kv, 'steelman', ip);
    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'X-Rate-Limit-Remaining': String(remaining) },
    });
  } catch (err) {
    console.error('Workers AI error:', err);
    return new Response(JSON.stringify({ error: 'AI request failed. Try again.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

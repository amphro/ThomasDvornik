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
  const check = await checkRateLimit(kv, 'vibe', ip);
  if (!check.allowed) {
    const hours = Math.ceil(check.retryAfterSecs / 3600);
    return new Response(
      JSON.stringify({ error: `You've used your 2 free requests for today. Try again in about ${hours} hour${hours === 1 ? '' : 's'}.` }),
      { status: 429, headers: { 'Content-Type': 'application/json', 'X-Rate-Limit-Remaining': '0' } }
    );
  }

  let text: string;
  try {
    const body = await request.json();
    text = typeof body.text === 'string' ? body.text.trim() : '';
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!text || text.length < 10) {
    return new Response(JSON.stringify({ error: 'Paste some text first.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (text.length > 2000) {
    return new Response(JSON.stringify({ error: 'Keep it under 2000 characters.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const systemPrompt = `You are a brutally honest corporate communication translator.
Given a piece of corporate text, return JSON with exactly these keys:
- "plain": plain English translation (1-2 sentences, no jargon)
- "subtext": what's really being said or implied (1-2 sentences, candid)
- "reply": a suggested reply (1-3 sentences, professional but direct)

Respond with raw JSON only. No markdown, no code fences.`;

  try {
    const result = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze this text:\n\n${text}` },
      ],
      max_tokens: 400,
    });

    let parsed: { plain: string; subtext: string; reply: string };
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
    } catch {
      console.error('Parse error. Raw response:', result.response);
      return new Response(JSON.stringify({ error: 'Model returned unexpected format. Try again.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const remaining = await consumeRateLimit(kv, 'vibe', ip);
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

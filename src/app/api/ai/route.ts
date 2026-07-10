/**
 * Single server-side AI entry point. API keys never reach the browser.
 * Validates requests and responses with zod, applies a simple per-IP rate
 * limit, and logs job metadata (no hidden reasoning is ever stored).
 */

import { NextResponse, type NextRequest } from 'next/server';
import { aiTaskSchema, type AIProvider } from '@/lib/ai/provider';
import { MockAIProvider } from '@/lib/ai/mock';

export const runtime = 'nodejs';

const RATE_LIMIT = 30; // requests per window
const WINDOW_MS = 5 * 60 * 1000;
const hits = new Map<string, { count: number; windowStart: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    hits.set(ip, { count: 1, windowStart: now });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

async function getProvider(): Promise<{ provider: AIProvider; live: boolean }> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (key) {
    const { AnthropicProvider } = await import('@/lib/ai/anthropic');
    return { provider: new AnthropicProvider(key), live: true };
  }
  return { provider: new MockAIProvider(), live: false };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'rate-limited' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 });
  }

  const parsed = aiTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid-task' }, { status: 400 });
  }

  const { provider, live } = await getProvider();
  try {
    const result = await provider.run(parsed.data);
    // Job log (metadata only): task, model, latency, validation ok.
    console.info(
      `[ai-job] task=${parsed.data.task} provider=${result.provider} model=${result.model} prompt=${result.promptVersion} latencyMs=${result.latencyMs} valid=true`,
    );
    return NextResponse.json(result);
  } catch (err) {
    console.warn(`[ai-job] task=${parsed.data.task} live=${live} failed=${err instanceof Error ? err.message : 'unknown'}`);
    if (live) {
      // Live provider failed validation — fall back to the labeled mock rather
      // than fabricating a model response.
      const mock = await new MockAIProvider().run(parsed.data);
      return NextResponse.json(mock);
    }
    return NextResponse.json({ error: 'ai-failed' }, { status: 502 });
  }
}

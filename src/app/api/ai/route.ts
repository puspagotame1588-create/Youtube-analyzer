/**
 * Single server-side AI entry point. API keys never reach the browser.
 * Validates requests and responses with zod, applies a simple per-IP rate
 * limit, and logs job metadata (no hidden reasoning is ever stored).
 */

import { NextResponse, type NextRequest } from 'next/server';
import { aiTaskSchema } from '@/lib/ai/provider';
import { MockAIProvider } from '@/lib/ai/mock';
import { getProvider } from '@/lib/ai/select';
import { safeRateLimit } from '@/lib/storage/kv';
import { clientIp } from '@/lib/net/ip';

export const runtime = 'nodejs';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = clientIp(request);
  const rl = await safeRateLimit('ai', ip, 30, 300);
  if (!rl.allowed) {
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

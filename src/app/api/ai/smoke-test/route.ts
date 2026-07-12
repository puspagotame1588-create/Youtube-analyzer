/**
 * Protected server-side AI smoke test.
 *
 * Sends ONE minimal request to Anthropic and reports only a sanitized status:
 * whether a key is configured, whether the provider was reachable, the model
 * probed, the round-trip latency, and a coarse error category. It never
 * returns the API key, request/response headers, message content, or raw
 * error text — nothing that could leak a secret or provider internals.
 *
 * Access is gated by a bearer token that must match AI_SMOKE_TEST_TOKEN or the
 * admin ADMIN_ACCESS_CODE. With neither configured the endpoint is CLOSED
 * (503) rather than open — it is never publicly runnable.
 */

import { createHash, timingSafeEqual } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_MODEL } from '@/lib/ai/anthropic';
import { checkSecretStrength } from '@/lib/config-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ErrorCategory =
  | 'authentication'
  | 'permission'
  | 'not-found'
  | 'rate-limited'
  | 'invalid-request'
  | 'server-error'
  | 'timeout'
  | 'network'
  | 'api-error'
  | 'unknown';

/** Constant-time equality over sha256 digests (also hides length differences). */
function tokenMatches(provided: string, expected: string): boolean {
  const a = createHash('sha256').update(provided).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

/** The secrets that may authorize a smoke test. Empty when none is configured. */
function authorizedSecrets(): string[] {
  const secrets: string[] = [];
  const smokeToken = process.env.AI_SMOKE_TEST_TOKEN?.trim();
  if (smokeToken && checkSecretStrength(smokeToken).ok) secrets.push(smokeToken);
  const adminCode = process.env.ADMIN_ACCESS_CODE?.trim();
  if (adminCode && checkSecretStrength(adminCode).ok) secrets.push(adminCode);
  return secrets;
}

function presentedToken(request: NextRequest): string | null {
  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7).trim();
  const header = request.headers.get('x-smoke-token');
  return header?.trim() || null;
}

/** Map any thrown error to a coarse category + reachability, leaking nothing. */
function categorize(err: unknown): { category: ErrorCategory; reachable: boolean } {
  if (err instanceof Anthropic.AuthenticationError) return { category: 'authentication', reachable: true };
  if (err instanceof Anthropic.PermissionDeniedError) return { category: 'permission', reachable: true };
  if (err instanceof Anthropic.NotFoundError) return { category: 'not-found', reachable: true };
  if (err instanceof Anthropic.RateLimitError) return { category: 'rate-limited', reachable: true };
  if (err instanceof Anthropic.BadRequestError) return { category: 'invalid-request', reachable: true };
  if (err instanceof Anthropic.InternalServerError) return { category: 'server-error', reachable: true };
  if (err instanceof Anthropic.APIConnectionTimeoutError) return { category: 'timeout', reachable: false };
  if (err instanceof Anthropic.APIConnectionError) return { category: 'network', reachable: false };
  if (err instanceof Anthropic.APIError) return { category: 'api-error', reachable: true };
  return { category: 'unknown', reachable: false };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // --- Access control: closed unless a strong token is configured AND matches.
  const secrets = authorizedSecrets();
  if (secrets.length === 0) {
    return NextResponse.json(
      { ok: false, error: 'smoke-test-not-configured', detail: 'Set AI_SMOKE_TEST_TOKEN or ADMIN_ACCESS_CODE to enable this endpoint.' },
      { status: 503 },
    );
  }
  const token = presentedToken(request);
  const authorized = Boolean(token) && secrets.some((s) => tokenMatches(token as string, s));
  if (!authorized) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  // --- Configuration presence (never reads the key's value).
  const configured = Boolean(process.env.ANTHROPIC_API_KEY?.trim());
  if (!configured) {
    return NextResponse.json({
      ok: true,
      configured: false,
      providerReachable: false,
      model: ANTHROPIC_MODEL,
      latencyMs: 0,
      errorCategory: 'not-configured',
    });
  }

  // --- One minimal live request. max_tokens:1 keeps it as small as possible.
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY as string, maxRetries: 0 });
  const start = Date.now();
  try {
    await client.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 1,
      messages: [{ role: 'user', content: 'ping' }],
    });
    return NextResponse.json({
      ok: true,
      configured: true,
      providerReachable: true,
      model: ANTHROPIC_MODEL,
      latencyMs: Date.now() - start,
      errorCategory: null,
    });
  } catch (err) {
    const { category, reachable } = categorize(err);
    // Log only the category server-side — never the error message or key.
    console.warn(`[ai-smoke] configured=true reachable=${reachable} category=${category}`);
    return NextResponse.json({
      ok: true,
      configured: true,
      providerReachable: reachable,
      model: ANTHROPIC_MODEL,
      latencyMs: Date.now() - start,
      errorCategory: category,
    });
  }
}

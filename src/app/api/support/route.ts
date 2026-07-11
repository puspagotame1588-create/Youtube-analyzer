/**
 * Support intake with confirmed delivery.
 * Order of truth:
 * 1. provider delivery (webhook/resend/postmark) → status 'delivered' only on
 *    confirmed provider acceptance, with proof (provider, http status,
 *    timestamp, redacted message id)
 * 2. durable KV queue (Upstash/Supabase) → status 'queued'
 * 3. otherwise → status 'failed'/'unconfigured'; the UI keeps the draft and
 *    shows an honest error — never "Message sent".
 * Spam protection: durable per-IP rate limit + honeypot field.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { deliverSupportTicket } from '@/lib/support/delivery';
import { getKV, safeRateLimit } from '@/lib/storage/kv';

export const runtime = 'nodejs';

const ticketSchema = z.object({
  category: z.string().max(40),
  message: z.string().min(1).max(4000),
  email: z.string().max(200).optional(),
  locale: z.enum(['en', 'ja']).default('en'),
  /** honeypot — real users never fill this */
  website: z.string().max(0).optional().or(z.literal('')),
});

function referenceNumber(): string {
  const t = Date.now().toString(36).toUpperCase().slice(-5);
  const r = Math.random().toString(36).toUpperCase().slice(2, 5);
  return `CV-${t}${r}`;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  const rl = await safeRateLimit('support', ip, 5, 600);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'rate-limited' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  const parsed = ticketSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  if (parsed.data.website && parsed.data.website.length > 0) {
    // Honeypot triggered — pretend success without delivery.
    return NextResponse.json({ ok: true, reference: referenceNumber(), status: 'received' });
  }

  const reference = referenceNumber();
  const delivery = await deliverSupportTicket({
    reference,
    category: parsed.data.category,
    message: parsed.data.message,
    ...(parsed.data.email ? { email: parsed.data.email } : {}),
    locale: parsed.data.locale,
  });

  let status: 'delivered' | 'queued' | 'failed' | 'unconfigured' = delivery.status;

  // Fall back to the durable queue when a provider is missing or failed.
  const kv = getKV();
  if ((status === 'unconfigured' || status === 'failed') && kv.mode !== 'memory') {
    const queued = await kv
      .pushDoc('support:queue', {
        reference,
        category: parsed.data.category,
        message: parsed.data.message,
        email: parsed.data.email ?? null,
        locale: parsed.data.locale,
        receivedAt: new Date().toISOString(),
        deliveryError: delivery.error ?? null,
        status: 'queued',
      })
      .catch(() => false);
    if (queued) status = 'queued';
  }

  console.info(
    `[support] ref=${reference} status=${status} provider=${delivery.provider} http=${delivery.httpStatus ?? '-'} id=${delivery.messageIdRedacted ?? '-'}`,
  );

  return NextResponse.json({
    ok: status === 'delivered' || status === 'queued',
    reference,
    status,
    proof: {
      provider: delivery.provider,
      httpStatus: delivery.httpStatus ?? null,
      messageIdRedacted: delivery.messageIdRedacted ?? null,
      timestamp: delivery.timestamp,
    },
  });
}

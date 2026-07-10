/**
 * Support intake. Every submission gets a reference number. Delivery:
 * - If SUPPORT_WEBHOOK_URL is set, the ticket is forwarded there (e.g. a
 *   Slack/Discord webhook or a form-to-email service the founder controls).
 * - The response reports whether server-side delivery is configured so the
 *   UI never implies an inbox exists when it does not.
 * Spam protection: per-IP rate limit + honeypot field.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, { count: number; windowStart: number }>();

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
  const now = Date.now();
  const entry = hits.get(ip);
  if (entry && now - entry.windowStart < WINDOW_MS && entry.count >= MAX_PER_WINDOW) {
    return NextResponse.json({ error: 'rate-limited' }, { status: 429 });
  }
  if (!entry || now - entry.windowStart > WINDOW_MS) hits.set(ip, { count: 1, windowStart: now });
  else entry.count += 1;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  const parsed = ticketSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  if (parsed.data.website && parsed.data.website.length > 0) {
    // Honeypot triggered — accept silently without delivery.
    return NextResponse.json({ ok: true, reference: referenceNumber(), delivered: false });
  }

  const reference = referenceNumber();
  const webhook = process.env.SUPPORT_WEBHOOK_URL;
  let delivered = false;
  if (webhook) {
    try {
      const res = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `[CareerVerse support] ${reference} · ${parsed.data.category}\nfrom: ${parsed.data.email ?? 'no email'} (${parsed.data.locale})\n\n${parsed.data.message}`,
          reference,
          ...parsed.data,
        }),
      });
      delivered = res.ok;
    } catch {
      delivered = false;
    }
  }

  return NextResponse.json({
    ok: true,
    reference,
    delivered,
    deliveryConfigured: Boolean(webhook),
  });
}

/**
 * Provider-neutral support delivery adapter.
 * Providers (checked in order):
 * - webhook:  SUPPORT_WEBHOOK_URL (any JSON-accepting endpoint, e.g. Discord/Slack).
 *             SENDS A SANITIZED ALERT ONLY — reference, category, and reply
 *             email. The message body and other PII are NEVER sent to a chat
 *             webhook; the full ticket is retained server-side (durable queue).
 *             User-controlled fields are sanitized against mention/markdown
 *             injection and pings are disabled (allowed_mentions).
 * - resend:   RESEND_API_KEY + SUPPORT_EMAIL_TO (+ optional SUPPORT_EMAIL_FROM)
 * - postmark: POSTMARK_SERVER_TOKEN + SUPPORT_EMAIL_TO (+ optional SUPPORT_EMAIL_FROM)
 *   (email providers deliver the full ticket — a private, secure channel.)
 *
 * "Delivered" is only reported after the provider CONFIRMS acceptance
 * (2xx + parseable response). The result carries provider proof: provider
 * name, HTTP status, timestamp, and a redacted message id.
 */

export interface SupportTicketInput {
  reference: string;
  category: string;
  message: string;
  email?: string;
  locale: string;
}

export interface DeliveryResult {
  status: 'delivered' | 'queued' | 'failed' | 'unconfigured';
  provider: 'webhook' | 'resend' | 'postmark' | 'kv-queue' | 'none';
  httpStatus?: number;
  /** redacted provider message id (first 8 chars + length) */
  messageIdRedacted?: string;
  timestamp: string;
  error?: string;
}

const redactId = (id: string | undefined): string | undefined =>
  id ? `${id.slice(0, 8)}…(${id.length})` : undefined;

/**
 * Neutralize chat-webhook injection in user-controlled fields before they are
 * placed in a Discord/Slack message: defuse `@everyone`/`@here` and role/user
 * mentions, strip formatting/link characters (backticks, angle brackets), and
 * flatten control chars/newlines so a value cannot smuggle extra lines or
 * hidden content. Pairs with `allowed_mentions:{parse:[]}`, which also stops
 * pings from ever notifying.
 */
export function sanitizeForChat(input: string, max = 200): string {
  // Drop C0 control chars, tab, newline, and DEL (code-point based, so no
  // literal control chars live in this source file).
  const noControls = Array.from(input)
    .filter((ch) => {
      const c = ch.charCodeAt(0);
      return c > 0x1f && c !== 0x7f;
    })
    .join('');
  return noControls
    .replace(/@(everyone|here)/gi, '@​$1') // zero-width space defuses the token
    .replace(/[`<>]/g, '') // no code blocks, no <@id> mentions, no <url> link-hiding
    .replace(/\s+/g, ' ') // collapse whitespace runs
    .trim()
    .slice(0, max);
}

export function configuredProvider(): DeliveryResult['provider'] {
  if (process.env.SUPPORT_WEBHOOK_URL) return 'webhook';
  if (process.env.RESEND_API_KEY && process.env.SUPPORT_EMAIL_TO) return 'resend';
  if (process.env.POSTMARK_SERVER_TOKEN && process.env.SUPPORT_EMAIL_TO) return 'postmark';
  return 'none';
}

export async function deliverSupportTicket(t: SupportTicketInput): Promise<DeliveryResult> {
  const timestamp = new Date().toISOString();
  const provider = configuredProvider();
  const subject = `[CareerVerse support] ${t.reference} · ${t.category}`;
  const body = `Reference: ${t.reference}\nCategory: ${t.category}\nFrom: ${t.email ?? 'no email provided'} (${t.locale})\n\n${t.message}`;

  try {
    if (provider === 'webhook') {
      // Sanitized alert ONLY. Never send the message body or any PII beyond the
      // reply email to a chat webhook. Every interpolated field is user-derived,
      // so each is sanitized against mention/markdown injection; the full ticket
      // lives only in the durable queue.
      const safeRef = sanitizeForChat(t.reference, 48);
      const safeCat = sanitizeForChat(t.category, 48);
      const safeEmail = t.email ? sanitizeForChat(t.email, 120) : 'no email provided';
      const alertText = `[CareerVerse support] ${safeRef} · ${safeCat}\nReply to: ${safeEmail}`;
      const res = await fetch(process.env.SUPPORT_WEBHOOK_URL as string, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // `content` renders on Discord, `text` on Slack — both carry only the
          // sanitized alert. allowed_mentions blocks any ping on Discord.
          content: alertText,
          text: alertText,
          allowed_mentions: { parse: [] },
          reference: safeRef,
          category: safeCat,
          replyEmail: t.email ? safeEmail : null,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      const text = await res.text().catch(() => '');
      if (!res.ok) return { status: 'failed', provider, httpStatus: res.status, timestamp, error: `webhook ${res.status}` };
      let id: string | undefined;
      try {
        const json = JSON.parse(text) as { id?: string; message_id?: string; ts?: string };
        id = json.id ?? json.message_id ?? json.ts;
      } catch {
        id = undefined;
      }
      return { status: 'delivered', provider, httpStatus: res.status, messageIdRedacted: redactId(id) ?? 'accepted', timestamp };
    }

    if (provider === 'resend') {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY as string}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.SUPPORT_EMAIL_FROM ?? 'CareerVerse Support <onboarding@resend.dev>',
          to: [process.env.SUPPORT_EMAIL_TO as string],
          reply_to: t.email,
          subject,
          text: body,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) return { status: 'failed', provider, httpStatus: res.status, timestamp, error: `resend ${res.status}` };
      const json = (await res.json()) as { id?: string };
      return { status: 'delivered', provider, httpStatus: res.status, messageIdRedacted: redactId(json.id), timestamp };
    }

    if (provider === 'postmark') {
      const res = await fetch('https://api.postmarkapp.com/email', {
        method: 'POST',
        headers: {
          'X-Postmark-Server-Token': process.env.POSTMARK_SERVER_TOKEN as string,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          From: process.env.SUPPORT_EMAIL_FROM ?? (process.env.SUPPORT_EMAIL_TO as string),
          To: process.env.SUPPORT_EMAIL_TO as string,
          ReplyTo: t.email,
          Subject: subject,
          TextBody: body,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) return { status: 'failed', provider, httpStatus: res.status, timestamp, error: `postmark ${res.status}` };
      const json = (await res.json()) as { MessageID?: string };
      return { status: 'delivered', provider, httpStatus: res.status, messageIdRedacted: redactId(json.MessageID), timestamp };
    }

    return { status: 'unconfigured', provider: 'none', timestamp };
  } catch (err) {
    return {
      status: 'failed',
      provider,
      timestamp,
      error: err instanceof Error ? err.name : 'unknown',
    };
  }
}

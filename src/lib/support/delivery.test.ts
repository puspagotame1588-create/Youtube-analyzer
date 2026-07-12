import { afterEach, describe, expect, it, vi } from 'vitest';
import { configuredProvider, deliverSupportTicket } from './delivery';

const ticket = { reference: 'CV-TEST1', category: 'technical', message: 'hi', locale: 'en' as const };

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('support delivery adapter', () => {
  it('reports unconfigured when no provider env is set', async () => {
    vi.stubEnv('SUPPORT_WEBHOOK_URL', '');
    vi.stubEnv('RESEND_API_KEY', '');
    vi.stubEnv('POSTMARK_SERVER_TOKEN', '');
    expect(configuredProvider()).toBe('none');
    const r = await deliverSupportTicket(ticket);
    expect(r.status).toBe('unconfigured');
  });

  it('marks delivered only after a webhook 2xx, with proof', async () => {
    vi.stubEnv('SUPPORT_WEBHOOK_URL', 'https://hook.example/x');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ id: 'abcдef123456789' }), { status: 200 })),
    );
    const r = await deliverSupportTicket(ticket);
    expect(r.status).toBe('delivered');
    expect(r.provider).toBe('webhook');
    expect(r.httpStatus).toBe(200);
    expect(r.messageIdRedacted).toMatch(/…\(\d+\)$/); // redacted id, not raw
    expect(r.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('webhook payload is sanitized — reference/category/replyEmail only, never the message', async () => {
    vi.stubEnv('SUPPORT_WEBHOOK_URL', 'https://hook.example/x');
    let sentBody = '';
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: RequestInit) => {
        sentBody = String(init.body);
        return new Response(JSON.stringify({ id: 'x1234567' }), { status: 200 });
      }),
    );
    const secret = 'SENSITIVE-DO-NOT-LEAK-BODY';
    const r = await deliverSupportTicket({
      reference: 'CV-XYZ99',
      category: 'legal-referral',
      message: secret,
      email: 'user@example.com',
      locale: 'ja',
    });
    expect(r.status).toBe('delivered');
    expect(sentBody).not.toContain(secret); // message body never leaves
    const payload = JSON.parse(sentBody) as Record<string, unknown>;
    expect(payload.message).toBeUndefined();
    expect(payload.locale).toBeUndefined();
    expect(payload.reference).toBe('CV-XYZ99');
    expect(payload.category).toBe('legal-referral');
    expect(payload.replyEmail).toBe('user@example.com');
  });

  it('webhook defuses @everyone / mentions / markdown and disables pings', async () => {
    vi.stubEnv('SUPPORT_WEBHOOK_URL', 'https://hook.example/x');
    let sentBody = '';
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: RequestInit) => {
        sentBody = String(init.body);
        return new Response(JSON.stringify({ id: 'x1234567' }), { status: 200 });
      }),
    );
    await deliverSupportTicket({
      reference: 'CV-AB1',
      category: '@everyone `code` <@123456789>',
      message: 'irrelevant',
      email: 'a@b.com',
      locale: 'en',
    });
    const payload = JSON.parse(sentBody) as Record<string, unknown>;
    expect(payload.allowed_mentions).toEqual({ parse: [] }); // pings disabled on Discord
    const content = String(payload.content);
    expect(content).not.toMatch(/@everyone/); // token defused (zero-width break)
    expect(content).not.toContain('`'); // no markdown code injection
    expect(content).not.toContain('<@'); // no raw mention syntax
    expect(payload.text).toBe(payload.content); // Slack + Discord carry the same sanitized alert
  });

  it('marks failed (never delivered) on a webhook non-2xx', async () => {
    vi.stubEnv('SUPPORT_WEBHOOK_URL', 'https://hook.example/x');
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 500 })));
    const r = await deliverSupportTicket(ticket);
    expect(r.status).toBe('failed');
    expect(r.httpStatus).toBe(500);
  });

  it('marks failed on a network error, without throwing', async () => {
    vi.stubEnv('SUPPORT_WEBHOOK_URL', 'https://hook.example/x');
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('boom'); }));
    const r = await deliverSupportTicket(ticket);
    expect(r.status).toBe('failed');
  });
});

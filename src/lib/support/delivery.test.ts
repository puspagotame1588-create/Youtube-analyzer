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

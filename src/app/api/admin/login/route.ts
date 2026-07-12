import { NextResponse, type NextRequest } from 'next/server';
import { expectedToken } from '@/lib/admin/auth';
import { checkSecretStrength } from '@/lib/config-guard';
import { safeRateLimit } from '@/lib/storage/kv';
import { clientIp } from '@/lib/net/ip';

export const runtime = 'nodejs';

export async function POST(request: NextRequest): Promise<NextResponse> {
  // FAIL-CLOSED: admin login is disabled entirely unless a strong credential
  // is configured. Known defaults / short / low-entropy secrets are rejected.
  const strength = checkSecretStrength(process.env.ADMIN_ACCESS_CODE);
  if (!strength.ok) {
    console.warn(`[admin-login] disabled: ADMIN_ACCESS_CODE ${strength.reason}`); // never logs the value
    return NextResponse.json({ error: 'admin-not-configured' }, { status: 503 });
  }

  const ip = clientIp(request);
  const rl = await safeRateLimit('admin-login', ip, 10, 600);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'rate-limited' }, { status: 429 });
  }

  let code = '';
  try {
    const body = (await request.json()) as { code?: string };
    code = body.code ?? '';
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  if (code !== process.env.ADMIN_ACCESS_CODE) {
    return NextResponse.json({ error: 'invalid-code' }, { status: 401 });
  }

  const token = expectedToken();
  if (!token) {
    return NextResponse.json({ error: 'admin-not-configured' }, { status: 503 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set('cv-admin', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 8 * 60 * 60,
  });
  return res;
}

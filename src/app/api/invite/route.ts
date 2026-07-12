import { NextResponse, type NextRequest } from 'next/server';
import { checkInviteCode, INVITE_COOKIE } from '@/lib/invite';
import { safeRateLimit } from '@/lib/storage/kv';
import { clientIp } from '@/lib/net/ip';

export const runtime = 'nodejs';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = clientIp(request);
  const rl = await safeRateLimit('invite', ip, 12, 600);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'rate-limited' }, { status: 429 });
  }

  let code = '';
  try {
    const body = (await request.json()) as { code?: string };
    code = String(body.code ?? '');
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  if (!code || code.length > 100) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const { result, hash } = await checkInviteCode(code);
  if (result === 'not-configured') {
    // Fail closed, and say so without leaking anything about codes.
    return NextResponse.json({ error: 'gate-not-configured' }, { status: 503 });
  }
  if (result !== 'ok' || !hash) {
    // Generic failure — never reveal whether a code exists, expired, or is used up.
    return NextResponse.json({ error: 'invalid-code' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(INVITE_COOKIE, hash, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
  });
  return res;
}

import { NextResponse, type NextRequest } from 'next/server';
import { checkInviteCode, INVITE_COOKIE } from '@/lib/invite';

export const runtime = 'nodejs';

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 12;
const attempts = new Map<string, { count: number; windowStart: number }>();

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  const now = Date.now();
  const entry = attempts.get(ip);
  if (entry && now - entry.windowStart < WINDOW_MS && entry.count >= MAX_ATTEMPTS) {
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

  const { result, hash } = checkInviteCode(code);
  if (result !== 'ok' || !hash) {
    // Generic failure — never reveal whether a code exists, expired, or is used up.
    if (!entry || now - entry.windowStart > WINDOW_MS) attempts.set(ip, { count: 1, windowStart: now });
    else entry.count += 1;
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

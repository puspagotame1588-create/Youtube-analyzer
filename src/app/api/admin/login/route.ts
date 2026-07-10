import { NextResponse, type NextRequest } from 'next/server';
import { expectedToken } from '@/lib/admin/auth';

export const runtime = 'nodejs';

const attempts = new Map<string, { count: number; windowStart: number }>();

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  const now = Date.now();
  const entry = attempts.get(ip);
  if (entry && now - entry.windowStart < 10 * 60 * 1000 && entry.count >= 10) {
    return NextResponse.json({ error: 'rate-limited' }, { status: 429 });
  }

  let code = '';
  try {
    const body = (await request.json()) as { code?: string };
    code = body.code ?? '';
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const expected = process.env.ADMIN_ACCESS_CODE ?? 'careerverse-admin';
  if (code !== expected) {
    if (!entry || now - entry.windowStart > 10 * 60 * 1000) attempts.set(ip, { count: 1, windowStart: now });
    else entry.count += 1;
    return NextResponse.json({ error: 'invalid-code' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('cv-admin', expectedToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 8 * 60 * 60,
  });
  return res;
}

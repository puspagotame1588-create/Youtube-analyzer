import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(): Promise<NextResponse> {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('cv-admin', '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}

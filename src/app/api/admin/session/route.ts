import { NextResponse, type NextRequest } from 'next/server';
import { isAdmin } from '@/lib/admin/auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const ok = isAdmin(request);
  return NextResponse.json({ ok }, { status: ok ? 200 : 401 });
}

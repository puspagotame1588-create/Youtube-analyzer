import { createHash } from 'node:crypto';
import type { NextRequest } from 'next/server';

/** Server-side admin session helpers. The access code never reaches the client. */

export function expectedToken(): string {
  const code = process.env.ADMIN_ACCESS_CODE ?? 'careerverse-admin';
  return createHash('sha256').update(`cv-admin:${code}`).digest('hex');
}

export function isAdmin(request: NextRequest): boolean {
  return request.cookies.get('cv-admin')?.value === expectedToken();
}

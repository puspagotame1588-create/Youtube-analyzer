import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import { edgeIsValidInvite, GATED_SEGMENTS } from './lib/invite-edge';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Private-beta gate: personalized areas require a valid invite cookie.
  // Public: landing, schools/careers/scholarships browsing, roadmap, support,
  // settings, methodology, privacy, terms, data sources, invite page itself.
  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];
  const isLocale = first === 'en' || first === 'ja';
  const section = isLocale ? segments[1] : segments[0];

  if (section && (GATED_SEGMENTS as readonly string[]).includes(section)) {
    const cookie = request.cookies.get('cv-invite')?.value;
    if (!edgeIsValidInvite(cookie, process.env.INVITE_CODE_HASHES)) {
      const locale = isLocale ? first : routing.defaultLocale;
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/invite`;
      url.search = `?next=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(url);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  // Skip api routes, static files and Next internals.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};

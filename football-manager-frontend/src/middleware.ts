import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const token = req.cookies.get('fm_token')?.value ?? null;
  const { pathname } = req.nextUrl;

  // Let static & API pass
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // If logged in and tries to hit /login → send them back
  if (token && pathname === '/login') {
    const last = req.cookies.get('fm_last')?.value || '/market';
    return NextResponse.redirect(new URL(last, req.url));
  }

  // Only protect "/" and "/market"
  const isProtected =
    pathname === '/' || pathname.startsWith('/market');

  if (!token && isProtected) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Set last section when authed and on a tracked section
  const res = NextResponse.next();
  if (token) {
    const section =
      pathname.startsWith('/market') ? '/market' :
      pathname === '/' ? '/' : null;

    if (section) {
      res.cookies.set('fm_last', section, {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
      });
    }
  }

  return res;
}

export const config = {
  // Run on everything EXCEPT login, static, api, favicon
  matcher: ['/((?!login|_next|api|favicon.ico).*)'],
};

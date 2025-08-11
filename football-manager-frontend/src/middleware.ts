import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const token = req.cookies.get('fm_token')?.value;
  const { pathname } = req.nextUrl;

  const protectedRoutes = ['/market', '/team'];
  const isProtected = protectedRoutes.some(path => pathname.startsWith(path));

  if (isProtected && token) {
    const res = NextResponse.next();
    const lastSection = pathname.startsWith('/team') ? '/team' : '/market';
    res.cookies.set('fm_last', lastSection, { path: '/', httpOnly: false });
    return res;
  }
  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (token && pathname === '/login') {
    const last = req.cookies.get('fm_last')?.value || '/market';
    return NextResponse.redirect(new URL(last, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/market/:path*', '/team/:path*', '/login'],
};

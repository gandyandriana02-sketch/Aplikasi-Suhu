import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'default-insecure-secret-key-32chars!!';
const secretKey = new TextEncoder().encode(JWT_SECRET);
const SESSION_COOKIE_NAME = 'wh_session';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Protect all /api/admin/* routes
  if (pathname.startsWith('/api/admin/')) {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Akses ditolak. Sesi tidak ditemukan.' }, { status: 401 });
    }

    try {
      const { payload } = await jwtVerify(token, secretKey);
      if (payload.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Akses ditolak. Hanya untuk Admin.' }, { status: 403 });
      }

      // Backend enforcement: if must_change_password is true, block all administrative actions
      if (payload.must_change_password) {
        return NextResponse.json(
          { error: 'Wajib mengganti password awal sebelum mengakses fitur admin.' },
          { status: 403 }
        );
      }
    } catch {
      return NextResponse.json({ error: 'Sesi tidak valid atau telah kedaluwarsa.' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // 2. Protect frontend pages: /, /dashboard, /reports, /admin, /photo
  const isProtectedPage =
    pathname === '/' ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/reports') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/photo');

  if (isProtectedPage) {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    try {
      const { payload } = await jwtVerify(token, secretKey);
      // If admin page, verify admin role
      if (pathname.startsWith('/admin') && payload.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    } catch {
      // Invalid/expired token -> redirect to login and clear bad cookie
      const res = NextResponse.redirect(new URL('/login', req.url));
      res.cookies.delete(SESSION_COOKIE_NAME);
      return res;
    }
  }

  // 3. If already logged in and visiting /login, redirect to /
  if (pathname === '/login') {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      try {
        await jwtVerify(token, secretKey);
        return NextResponse.redirect(new URL('/', req.url));
      } catch {
        // Expired token, allow staying on /login
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/reports/:path*',
    '/admin/:path*',
    '/photo/:path*',
    '/login',
    '/api/admin/:path*'
  ]
};

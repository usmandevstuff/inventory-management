
import { type NextRequest, NextResponse } from 'next/server';
import { createMiddlewareSupabaseClient } from '@/lib/supabase/middleware';

const PROTECTED_ROUTES = ['/dashboard', '/inventory', '/orders', '/history', '/transactions', '/low-stock', '/settings'];
const PUBLIC_ROUTES = ['/login', '/signup', '/password-reset']; // Add any other public utility pages

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = await createMiddlewareSupabaseClient(req, res);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  // If user is authenticated
  if (session) {
    // If trying to access a public route like /login or /signup, redirect to dashboard
    if (PUBLIC_ROUTES.includes(pathname)) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    // If accessing the root path, redirect to dashboard
    if (pathname === '/') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  } else { // If user is not authenticated
    // If trying to access a protected route, redirect to login
    if (PROTECTED_ROUTES.some(path => pathname.startsWith(path))) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    // If accessing the root path and not authenticated, redirect to login
    if (pathname === '/') {
        return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

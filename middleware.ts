import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Get the token from cookies
  const token = request.cookies.get('token')?.value;
  
  // Public paths that don't require authentication
  const publicPaths = ['/login', '/register', '/forgot-password', '/verify-email', '/reset-password'];
  const isPublicPath = publicPaths.includes(path);
  
  // If no token and trying to access protected route, redirect to login
  if (!token && !isPublicPath) {
    const loginUrl = new URL('/login', request.url);
    // Preserve the original URL as a redirect parameter
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  }
  
  // REMOVED: Don't redirect away from login page during login process
  // This was causing interference with the login flow
  // The frontend will handle redirects after successful authentication
  
  // For admin routes, we'll let the frontend handle the role check
  // since we need to decode the JWT to get the role information
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/profile/:path*',
    '/reading/:path*',
    '/checkout/:path*',
    '/order/:path*',
    '/login',
    '/register'
  ]
};

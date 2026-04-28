import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

// Create the next-intl middleware
const intlMiddleware = createMiddleware({
  locales: ['en', 'am'],
  defaultLocale: 'en',
  localePrefix: 'as-needed' // Don't add /en prefix for default locale
});

export function middleware(request: NextRequest) {
  // First, handle internationalization
  const response = intlMiddleware(request);
  
  // Get the pathname without locale prefix
  const pathname = request.nextUrl.pathname;
  const pathnameWithoutLocale = pathname.replace(/^\/(en|am)/, '') || '/';
  
  // Check if the route is protected (dashboard or admin)
  const isProtectedRoute = 
    pathnameWithoutLocale.startsWith('/dashboard') || 
    pathnameWithoutLocale.startsWith('/admin');
  
  // If it's a protected route, check for authentication token
  if (isProtectedRoute) {
    const token = request.cookies.get("insa_token")?.value;
    
    if (!token) {
      // Get the locale from the pathname
      const locale = pathname.match(/^\/(en|am)/)?.[1] || 'en';
      const loginUrl = new URL(`/${locale}/login`, request.url);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  return response;
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};

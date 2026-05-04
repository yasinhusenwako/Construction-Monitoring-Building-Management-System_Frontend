import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  
  // Allow unsafe-eval for Keycloak
  response.headers.set(
    'Content-Security-Policy',
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' http://localhost:8081 http://localhost:8090;"
  );
  
  // NOTE: Authentication is now handled by Keycloak on the client side
  // No server-side cookie check needed
  
  return response;
}

export const config = {
  matcher: '/:path*',
};

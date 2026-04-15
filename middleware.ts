import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Read the token securely from the incoming request's cookies
  const token = request.cookies.get("insa_token")?.value;

  // If there's no valid token, redirect to login
  if (!token) {
    // Determine the original requested URL so we could potentially return users here after login
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Token exists, proceed to the requested route
  return NextResponse.next();
}

// Config ensures the middleware ONLY runs against protected routes and APIs
// Not against public CSS, JS, images, /login, etc.
export const config = {
  matcher: [
    /*
     * Match all requests paths representing protected views
     */
    "/dashboard/:path*",
    "/admin/:path*",
  ],
};

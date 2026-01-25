import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 * 1000; // 7 days in milliseconds

// Routes that require authentication
const PROTECTED_ROUTES = ["/dashboard"];

// Routes that are always accessible (no redirect even if not authenticated)
const PUBLIC_ROUTES = ["/", "/upload", "/login", "/register", "/summary", "/quiz"];

/**
 * Verify session token signature using Web Crypto API (Edge compatible).
 * Returns the user ID if valid, null otherwise.
 */
async function verifySessionToken(
  token: string,
  secret: string
): Promise<string | null> {
  const parts = token.split(":");
  if (parts.length !== 3) {
    return null;
  }

  const [userId, timestamp, signature] = parts;
  const data = `${userId}:${timestamp}`;

  // Create HMAC using Web Crypto API (Edge compatible)
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);

  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", key, messageData);
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time comparison
  if (signature.length !== expectedSignature.length) {
    return null;
  }

  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }

  if (result !== 0) {
    return null;
  }

  // Check if token is expired
  const tokenTime = parseInt(timestamp, 10);
  if (isNaN(tokenTime) || Date.now() - tokenTime > SESSION_MAX_AGE) {
    return null;
  }

  return userId;
}

/**
 * Check if the current path matches any of the given route prefixes.
 */
function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some((route) => {
    if (route === "/") {
      return pathname === "/";
    }
    return pathname === route || pathname.startsWith(`${route}/`);
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") // static files like favicon.ico
  ) {
    return NextResponse.next();
  }

  // Check if the route is protected
  const isProtectedRoute = matchesRoute(pathname, PROTECTED_ROUTES);

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Get session cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    // No session cookie, redirect to login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Get the session secret
  const secret =
    process.env.SESSION_SECRET || process.env.ENCRYPTION_KEY;

  if (!secret) {
    console.error("SESSION_SECRET or ENCRYPTION_KEY not configured");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Verify session token
  const userId = await verifySessionToken(sessionCookie.value, secret);

  if (!userId) {
    // Invalid or expired session, redirect to login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    const response = NextResponse.redirect(loginUrl);
    // Clear invalid session cookie
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  // Session is valid, allow request to proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*),"
  ],
};

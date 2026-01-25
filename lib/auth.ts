import { cookies } from "next/headers";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE_NAME = "session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

/**
 * Get the session secret from environment variable.
 * Falls back to ENCRYPTION_KEY if SESSION_SECRET is not set.
 */
function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("SESSION_SECRET or ENCRYPTION_KEY environment variable must be set");
  }
  return secret;
}

/**
 * Sign data with HMAC-SHA256 using the session secret.
 */
function sign(data: string): string {
  const secret = getSessionSecret();
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(data);
  return hmac.digest("hex");
}

/**
 * Create a signed session token containing the user ID.
 */
function createSessionToken(userId: string): string {
  const timestamp = Date.now();
  const data = `${userId}:${timestamp}`;
  const signature = sign(data);
  return `${data}:${signature}`;
}

/**
 * Verify and parse a session token.
 * Returns the user ID if valid, null otherwise.
 */
function verifySessionToken(token: string): string | null {
  const parts = token.split(":");
  if (parts.length !== 3) {
    return null;
  }

  const [userId, timestamp, signature] = parts;
  const data = `${userId}:${timestamp}`;
  const expectedSignature = sign(data);

  // Constant-time comparison to prevent timing attacks
  if (signature.length !== expectedSignature.length) {
    return null;
  }

  const sigBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return null;
  }

  // Check if token is expired (7 days)
  const tokenTime = parseInt(timestamp, 10);
  if (isNaN(tokenTime) || Date.now() - tokenTime > SESSION_MAX_AGE * 1000) {
    return null;
  }

  return userId;
}

/**
 * Session data returned by getSession()
 */
export interface SessionUser {
  id: string;
  email: string;
}

/**
 * Get the current session user from cookies.
 * Returns the user object if authenticated, null otherwise.
 */
export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie?.value) {
      return null;
    }

    const userId = verifySessionToken(sessionCookie.value);
    if (!userId) {
      return null;
    }

    // Verify user still exists in database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
    };
  } catch (error) {
    console.error("Session verification error:", error);
    return null;
  }
}

/**
 * Create a session for a user and set the HTTP-only cookie.
 * Call this after successful login.
 */
export async function createSession(userId: string): Promise<void> {
  const token = createSessionToken(userId);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

/**
 * Destroy the current session by clearing the cookie.
 * Call this for logout.
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

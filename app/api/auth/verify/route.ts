import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(new URL("/login?error=missing_token", request.url));
    }

    // Find user with this verification token
    const user = await prisma.user.findUnique({
      where: { verification_token: token },
    });

    if (!user) {
      return NextResponse.redirect(new URL("/login?error=invalid_token", request.url));
    }

    // Check if token has expired
    if (user.token_expires_at && new Date() > user.token_expires_at) {
      return NextResponse.redirect(new URL("/login?error=token_expired", request.url));
    }

    // Check if already verified
    if (user.email_verified) {
      return NextResponse.redirect(new URL("/login?verified=already", request.url));
    }

    // Verify the email
    await prisma.user.update({
      where: { id: user.id },
      data: {
        email_verified: true,
        verification_token: null,
        token_expires_at: null,
      },
    });

    // Redirect to login with success message
    return NextResponse.redirect(new URL("/login?verified=success", request.url));

  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.redirect(new URL("/login?error=verification_failed", request.url));
  }
}

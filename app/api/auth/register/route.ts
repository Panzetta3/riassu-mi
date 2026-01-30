import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { generateVerificationToken, getTokenExpiration, sendVerificationEmail } from "@/lib/email";

interface RegisterRequest {
  email: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e password sono obbligatori" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Formato email non valido" },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: "La password deve contenere almeno 8 caratteri" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Questa email è già registrata" },
        { status: 409 }
      );
    }

    // Hash password with bcrypt (10 rounds is a good default)
    const password_hash = await bcrypt.hash(password, 10);

    // Generate verification token
    const verification_token = generateVerificationToken();
    const token_expires_at = getTokenExpiration();

    // Create user with verification token
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password_hash,
        email_verified: false,
        verification_token,
        token_expires_at,
      },
    });

    // Send verification email
    const emailSent = await sendVerificationEmail(email.toLowerCase(), verification_token);

    if (!emailSent) {
      console.error("Failed to send verification email, but user was created");
    }

    return NextResponse.json(
      {
        message: "Registrazione completata! Controlla la tua email per verificare l'account.",
        userId: user.id,
        requiresVerification: true
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Errore durante la registrazione" },
      { status: 500 }
    );
  }
}

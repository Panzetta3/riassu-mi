import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

interface LoginRequest {
  email: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e password sono obbligatori" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Use generic error message to prevent email enumeration
      return NextResponse.json(
        { error: "Credenziali non valide" },
        { status: 401 }
      );
    }

    // Verify password with bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Credenziali non valide" },
        { status: 401 }
      );
    }

    // Create session (sets HTTP-only cookie)
    await createSession(user.id);

    return NextResponse.json(
      {
        message: "Login effettuato con successo",
        user: {
          id: user.id,
          email: user.email,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Errore durante il login" },
      { status: 500 }
    );
  }
}

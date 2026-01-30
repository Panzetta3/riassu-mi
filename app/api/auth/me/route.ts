import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Non autenticato" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        email: true,
        email_verified: true,
        created_at: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utente non trovato" },
        { status: 404 }
      );
    }

    // Check if user is admin
    const adminEmail = process.env.ADMIN_EMAIL;
    const isAdmin = adminEmail ? user.email === adminEmail : false;

    return NextResponse.json({ user: { ...user, isAdmin } });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Errore durante il recupero del profilo" },
      { status: 500 }
    );
  }
}

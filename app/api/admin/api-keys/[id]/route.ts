import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { reactivateKey, deactivateKey } from "@/lib/api-keys";

/**
 * Verify the user is an admin based on ADMIN_EMAIL environment variable.
 */
async function verifyAdmin(): Promise<{ authorized: boolean; error?: string }> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    return { authorized: false, error: "ADMIN_EMAIL non configurato" };
  }

  const session = await getSession();
  if (!session) {
    return { authorized: false, error: "Accesso non autorizzato" };
  }

  if (session.email.toLowerCase() !== adminEmail.toLowerCase()) {
    return { authorized: false, error: "Accesso riservato agli amministratori" };
  }

  return { authorized: true };
}

/**
 * DELETE /api/admin/api-keys/[id]
 * Delete an API key permanently.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.error === "Accesso non autorizzato" ? 401 : 403 }
    );
  }

  try {
    const { id } = await params;

    // Check if key exists
    const apiKey = await prisma.apiKey.findUnique({
      where: { id },
    });

    if (!apiKey) {
      return NextResponse.json(
        { error: "Chiave API non trovata" },
        { status: 404 }
      );
    }

    // Delete the key
    await prisma.apiKey.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting API key:", error);
    return NextResponse.json(
      { error: "Errore durante l'eliminazione della chiave API" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/api-keys/[id]
 * Update an API key (reactivate or deactivate).
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.error === "Accesso non autorizzato" ? 401 : 403 }
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    // Check if key exists
    const apiKey = await prisma.apiKey.findUnique({
      where: { id },
    });

    if (!apiKey) {
      return NextResponse.json(
        { error: "Chiave API non trovata" },
        { status: 404 }
      );
    }

    if (action === "reactivate") {
      await reactivateKey(id);
      return NextResponse.json({ success: true, message: "Chiave riattivata" });
    } else if (action === "deactivate") {
      await deactivateKey(id);
      return NextResponse.json({ success: true, message: "Chiave disattivata" });
    } else {
      return NextResponse.json(
        { error: "Azione non valida. Usa 'reactivate' o 'deactivate'" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error updating API key:", error);
    return NextResponse.json(
      { error: "Errore durante l'aggiornamento della chiave API" },
      { status: 500 }
    );
  }
}

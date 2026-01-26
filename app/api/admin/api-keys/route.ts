import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { addApiKey, reactivateKey, decryptKey } from "@/lib/api-keys";

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
 * GET /api/admin/api-keys
 * Fetch all API keys (without decrypted key values for security).
 */
export async function GET() {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.error === "Accesso non autorizzato" ? 401 : 403 }
    );
  }

  try {
    const apiKeys = await prisma.apiKey.findMany({
      orderBy: { last_used: "desc" },
      select: {
        id: true,
        key_encrypted: true,
        provider: true,
        is_active: true,
        last_used: true,
        fail_count: true,
        disabled_until: true,
      },
    });

    // Extract last 4 characters of each decrypted key for display
    const keysWithMasked = apiKeys.map((key) => {
      let lastFourChars = "****";
      try {
        const decryptedKey = decryptKey(key.key_encrypted);
        lastFourChars = decryptedKey.slice(-4);
      } catch {
        // If decryption fails, keep masked value
      }

      return {
        id: key.id,
        lastFourChars,
        provider: key.provider,
        is_active: key.is_active,
        last_used: key.last_used,
        fail_count: key.fail_count,
        disabled_until: key.disabled_until,
      };
    });

    return NextResponse.json({ apiKeys: keysWithMasked });
  } catch (error) {
    console.error("Error fetching API keys:", error);
    return NextResponse.json(
      { error: "Errore durante il recupero delle chiavi API" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/api-keys
 * Add a new API key.
 */
export async function POST(request: Request) {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.error === "Accesso non autorizzato" ? 401 : 403 }
    );
  }

  try {
    const body = await request.json();
    const { key, provider = "openrouter" } = body;

    if (!key || typeof key !== "string" || key.trim().length === 0) {
      return NextResponse.json(
        { error: "Chiave API obbligatoria" },
        { status: 400 }
      );
    }

    const keyId = await addApiKey(key.trim(), provider);

    return NextResponse.json({ id: keyId }, { status: 201 });
  } catch (error) {
    console.error("Error adding API key:", error);
    return NextResponse.json(
      { error: "Errore durante l'aggiunta della chiave API" },
      { status: 500 }
    );
  }
}

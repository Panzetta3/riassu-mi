import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/**
 * DELETE /api/summary/[id]
 * Deletes a summary and its associated quizzes.
 * Requires authentication and ownership verification.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Devi effettuare l'accesso per eliminare un riassunto" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "ID riassunto mancante" },
        { status: 400 }
      );
    }

    // Find the summary and verify ownership
    const summary = await prisma.summary.findUnique({
      where: { id },
      select: { id: true, user_id: true },
    });

    if (!summary) {
      return NextResponse.json(
        { error: "Riassunto non trovato" },
        { status: 404 }
      );
    }

    // Verify the user owns this summary
    if (summary.user_id !== session.id) {
      return NextResponse.json(
        { error: "Non hai il permesso di eliminare questo riassunto" },
        { status: 403 }
      );
    }

    // Delete the summary (quizzes will be cascade deleted due to schema relation)
    await prisma.summary.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting summary:", error);
    return NextResponse.json(
      { error: "Errore durante l'eliminazione del riassunto" },
      { status: 500 }
    );
  }
}

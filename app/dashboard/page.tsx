import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { SummaryList } from "./summary-list";

export default async function DashboardPage() {
  const session = await getSession();

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/login?redirect=/dashboard");
  }

  // Fetch user's summaries ordered by date descending
  const summaries = await prisma.summary.findMany({
    where: { user_id: session.id },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      title: true,
      pdf_name: true,
      detail_level: true,
      created_at: true,
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-4 py-12 dark:from-gray-900 dark:to-gray-950">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            I miei riassunti
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Gestisci tutti i tuoi riassunti in un unico posto
          </p>
        </div>

        {/* Action button */}
        <div className="mb-8">
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Carica nuovo PDF
          </Link>
        </div>

        {/* Summaries list with delete functionality */}
        <SummaryList summaries={summaries} />
      </div>
    </div>
  );
}

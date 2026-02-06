import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SummaryContent } from "./summary-content";

interface SummaryPageProps {
  params: Promise<{ id: string }>;
}

// Map detail level to Italian labels
const detailLevelLabels: Record<string, string> = {
  brief: "Breve",
  medium: "Medio",
  detailed: "Dettagliato",
};

export default async function SummaryPage({ params }: SummaryPageProps) {
  const { id } = await params;

  const summary = await prisma.summary.findUnique({
    where: { id },
  });

  if (!summary) {
    notFound();
  }

  const detailLevelLabel = detailLevelLabels[summary.detail_level] || summary.detail_level;

  return (
    <div className="min-h-screen page-shell px-4 py-12">
      <div className="mx-auto max-w-4xl">
        {/* Back link */}
        <Link
          href="/upload"
          className="mb-8 inline-flex items-center text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
        >
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Carica un altro PDF
        </Link>

        {/* Summary Header */}
        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {summary.title}
          </h1>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              {summary.pdf_name}
            </span>
            <span className="flex items-center gap-1">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h7"
                />
              </svg>
              Livello: {detailLevelLabel}
            </span>
            <span className="flex items-center gap-1">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {new Date(summary.created_at).toLocaleDateString("it-IT", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Summary Content with Markdown */}
        <SummaryContent
          content={summary.content}
          summaryId={summary.id}
          title={summary.title}
          pdfName={summary.pdf_name}
          detailLevel={summary.detail_level}
          createdAt={summary.created_at.toISOString()}
        />
      </div>
    </div>
  );
}

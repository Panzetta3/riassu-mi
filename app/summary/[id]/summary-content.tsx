"use client";

import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { Button, Card, CardContent } from "@/components/ui";

interface SummaryContentProps {
  content: string;
  summaryId: string;
  title: string;
}

export function SummaryContent({ content, summaryId, title }: SummaryContentProps) {
  const handleDownloadPdf = () => {
    // TODO: Implement PDF download in US-019
    alert("La funzionalità di download PDF sarà disponibile prossimamente.");
  };

  return (
    <>
      {/* Main Content Card */}
      <Card className="mb-6">
        <CardContent className="prose prose-blue max-w-none p-6 dark:prose-invert prose-headings:text-gray-900 prose-headings:dark:text-white prose-p:text-gray-700 prose-p:dark:text-gray-300 prose-li:text-gray-700 prose-li:dark:text-gray-300 prose-strong:text-gray-900 prose-strong:dark:text-white">
          <ReactMarkdown
            components={{
              // Custom rendering for headings
              h1: ({ children }) => (
                <h1 className="mb-4 mt-6 text-2xl font-bold text-gray-900 dark:text-white first:mt-0">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="mb-3 mt-5 text-xl font-semibold text-gray-900 dark:text-white">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="mb-2 mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                  {children}
                </h3>
              ),
              // Custom rendering for paragraphs
              p: ({ children }) => (
                <p className="mb-4 leading-relaxed text-gray-700 dark:text-gray-300">
                  {children}
                </p>
              ),
              // Custom rendering for lists
              ul: ({ children }) => (
                <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-700 dark:text-gray-300">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="mb-4 list-decimal space-y-2 pl-6 text-gray-700 dark:text-gray-300">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="leading-relaxed">{children}</li>
              ),
              // Custom rendering for bold text
              strong: ({ children }) => (
                <strong className="font-semibold text-gray-900 dark:text-white">
                  {children}
                </strong>
              ),
              // Custom rendering for italic text
              em: ({ children }) => (
                <em className="italic text-gray-700 dark:text-gray-300">{children}</em>
              ),
              // Custom rendering for blockquotes
              blockquote: ({ children }) => (
                <blockquote className="my-4 border-l-4 border-blue-500 bg-blue-50 py-2 pl-4 italic text-gray-700 dark:border-blue-400 dark:bg-blue-900/20 dark:text-gray-300">
                  {children}
                </blockquote>
              ),
              // Custom rendering for code
              code: ({ children, className }) => {
                const isInline = !className;
                if (isInline) {
                  return (
                    <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-sm text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                      {children}
                    </code>
                  );
                }
                return (
                  <code className={className}>{children}</code>
                );
              },
              // Custom rendering for code blocks
              pre: ({ children }) => (
                <pre className="my-4 overflow-x-auto rounded-lg bg-gray-100 p-4 dark:bg-gray-700">
                  {children}
                </pre>
              ),
              // Custom rendering for horizontal rules
              hr: () => (
                <hr className="my-6 border-t border-gray-200 dark:border-gray-700" />
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
        <Link href={`/quiz/generate/${summaryId}`}>
          <Button variant="primary" className="w-full px-6 py-3 sm:w-auto">
            <svg
              className="mr-2 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            Genera Quiz
          </Button>
        </Link>
        <Button
          variant="secondary"
          className="w-full px-6 py-3 sm:w-auto"
          onClick={handleDownloadPdf}
        >
          <svg
            className="mr-2 h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Scarica PDF
        </Button>
      </div>
    </>
  );
}

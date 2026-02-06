import Link from "next/link";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-73px)] flex-col items-center justify-center page-shell px-4">
      <div className="text-center">
        {/* 404 Icon */}
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <svg
            className="h-12 w-12 text-gray-400 dark:text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Error Code */}
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white sm:text-8xl">
          404
        </h1>

        {/* Title */}
        <h2 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl">
          Pagina non trovata
        </h2>

        {/* Description */}
        <p className="mt-4 max-w-md text-gray-600 dark:text-gray-400">
          La pagina che stai cercando non esiste o Ã¨ stata spostata.
        </p>

        {/* Action Button */}
        <div className="mt-8">
          <Link href="/">
            <Button variant="primary" className="px-6 py-3">
              Torna alla Homepage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}


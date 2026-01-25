import Link from "next/link";
import { Button } from "@/components/ui";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-950">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-4 py-20 text-center sm:py-32">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
          Riassu<span className="text-blue-600">.mi</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-300 sm:text-xl">
          Trasforma i tuoi PDF di studio in riassunti intelligenti e quiz di
          verifica. Powered by AI.
        </p>
        <div className="mt-10">
          <Link href="/upload">
            <Button variant="primary" className="px-8 py-3 text-lg">
              Carica PDF
            </Button>
          </Link>
        </div>
      </section>

      {/* Come funziona Section */}
      <section className="bg-white px-4 py-16 dark:bg-gray-900 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            Come funziona
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {/* Step 1: Carica */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl dark:bg-blue-900">
                <span role="img" aria-label="Upload">
                  📄
                </span>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                1. Carica
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Carica il tuo PDF di studio. Puoi anche selezionare quali pagine
                escludere dal riassunto.
              </p>
            </div>

            {/* Step 2: Riassumi */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl dark:bg-blue-900">
                <span role="img" aria-label="AI">
                  🤖
                </span>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                2. Riassumi
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                L&apos;intelligenza artificiale analizza il contenuto e genera
                un riassunto personalizzato.
              </p>
            </div>

            {/* Step 3: Quiz */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl dark:bg-blue-900">
                <span role="img" aria-label="Quiz">
                  ✅
                </span>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                3. Quiz
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Metti alla prova le tue conoscenze con quiz generati
                automaticamente dal contenuto.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 px-4 py-8 text-center text-gray-500 dark:border-gray-800 dark:text-gray-400">
        <p>&copy; 2026 Riassu.mi - Studia in modo più intelligente</p>
      </footer>
    </div>
  );
}

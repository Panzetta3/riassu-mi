import Link from "next/link";
import { Button } from "@/components/ui";

export default function Home() {
  return (
    <div className="page-shell">
      <div className="mx-auto flex max-w-6xl flex-col gap-20">
        {/* Hero Section */}
        <section className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
              Studio smart
              <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--brand)]" />
              PDF + AI
            </div>
            <h1 className="text-4xl font-semibold leading-tight text-[color:var(--ink)] sm:text-5xl lg:text-6xl">
              Riassumi, memorizza e
              <span className="text-gradient"> verifica</span> in un flusso unico.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-[color:var(--muted)]">
              Riassu.mi trasforma PDF, appunti e immagini in sintesi strutturate
              e quiz intelligenti. Tutto in pochi minuti, con controllo totale
              sul livello di dettaglio.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/upload">
                <Button variant="primary" className="px-8 py-3 text-base">
                  Carica il tuo file
                </Button>
              </Link>
              <Link
                href="/dashboard"
                className="text-sm font-semibold text-[color:var(--ink)] underline-offset-4 hover:underline"
              >
                Vai ai tuoi riassunti
              </Link>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {[
                { label: "Analisi rapida", value: "2 min" },
                { label: "Quiz generati", value: "100%" },
                { label: "Supporto formati", value: "PDF, TXT, IMG" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                    {item.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-[color:var(--ink)]">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-8 -top-8 h-24 w-24 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-2)]" />
            <div className="absolute -right-6 bottom-6 h-16 w-16 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-2)]" />
            <div className="panel relative overflow-hidden rounded-3xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                    Anteprima riassunto
                  </p>
                  <p className="mt-2 text-xl font-semibold text-[color:var(--ink)]">
                    Economia Politica - Capitolo 3
                  </p>
                </div>
                <span className="chip rounded-full px-3 py-1 text-xs font-semibold">
                  Medio
                </span>
              </div>
              <div className="mt-6 space-y-4 text-sm text-[color:var(--muted)]">
                <div className="rounded-2xl border border-[color:var(--border)] bg-white/70 p-4">
                  <p className="font-semibold text-[color:var(--ink)]">
                    1. Domanda e offerta
                  </p>
                  <p className="mt-2">
                    Le variazioni di prezzo sono influenzate da equilibrio, shock
                    esterni e aspettative di mercato.
                  </p>
                </div>
                <div className="rounded-2xl border border-[color:var(--border)] bg-white/70 p-4">
                  <p className="font-semibold text-[color:var(--ink)]">
                    2. Elasticita
                  </p>
                  <p className="mt-2">
                    Misura la sensibilita di domanda e offerta ai cambiamenti di
                    prezzo e reddito.
                  </p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                    Quiz generati
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-[color:var(--ink)]">12</p>
                </div>
                <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                    Accuratezza
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-[color:var(--ink)]">97%</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Come funziona Section */}
        <section>
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="text-3xl font-semibold text-[color:var(--ink)] sm:text-4xl">
              Un flusso semplice, ma fatto bene
            </h2>
            <p className="mt-4 text-[color:var(--muted)]">
              Ogni passaggio e pensato per ridurre il tempo di studio, senza
              perdere profondita.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Carica",
                description:
                  "Importa PDF, appunti o immagini. Gestisci pagine da escludere e mantieni il controllo.",
                icon: (
                  <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 4v10m0 0l-4-4m4 4l4-4M5 20h14" />
                  </svg>
                ),
              },
              {
                title: "Riassumi",
                description:
                  "L'AI struttura il contenuto in sezioni logiche e livelli di dettaglio personalizzati.",
                icon: (
                  <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M4 6h16M4 12h16M4 18h10" />
                  </svg>
                ),
              },
              {
                title: "Verifica",
                description:
                  "Quiz generati automaticamente per consolidare la memoria attiva.",
                icon: (
                  <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
            ].map((step, index) => (
              <div key={step.title} className="panel rounded-3xl p-6 text-left">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:color-mix(in_oklab,var(--brand)_18%,transparent)] text-[color:var(--brand)]">
                    {step.icon}
                  </div>
                  <span className="text-xs font-semibold text-[color:var(--muted)]">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-[color:var(--ink)]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-[color:var(--muted)]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[color:var(--border)] py-8 text-center text-sm text-[color:var(--muted)]">
          <p>&copy; 2026 Riassu.mi - Studia in modo piu intelligente</p>
        </footer>
      </div>
    </div>
  );
}

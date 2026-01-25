"use client";

import { Spinner } from "@/components/ui";

export type ProgressStage =
  | "analyzing"    // Analyzing PDF
  | "generating"   // Generating summary
  | "chunking"     // Processing chunks (for long PDFs)
  | "saving";      // Saving to database

interface ProgressIndicatorProps {
  stage: ProgressStage;
  chunkProgress?: {
    current: number;
    total: number;
  };
}

const stageMessages: Record<ProgressStage, string> = {
  analyzing: "Analizzando il PDF...",
  generating: "Generando riassunto...",
  chunking: "Elaborando il documento...",
  saving: "Salvando il riassunto...",
};

const stageDescriptions: Record<ProgressStage, string> = {
  analyzing: "Estrazione del testo dal documento",
  generating: "L'intelligenza artificiale sta creando il tuo riassunto",
  chunking: "Il documento viene elaborato in parti per una migliore analisi",
  saving: "Finalizzazione in corso",
};

export function ProgressIndicator({ stage, chunkProgress }: ProgressIndicatorProps) {
  const message = stage === "chunking" && chunkProgress
    ? `Elaborando parte ${chunkProgress.current} di ${chunkProgress.total}...`
    : stageMessages[stage];

  const description = stageDescriptions[stage];

  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-12">
      {/* Spinner with pulsing animation */}
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-20" />
        <Spinner size="lg" />
      </div>

      {/* Stage message */}
      <div className="text-center">
        <p className="text-lg font-medium text-gray-900 dark:text-white">
          {message}
        </p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>

      {/* Progress bar for chunking */}
      {stage === "chunking" && chunkProgress && chunkProgress.total > 1 && (
        <div className="w-full max-w-xs">
          <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-500 ease-out"
              style={{
                width: `${(chunkProgress.current / chunkProgress.total) * 100}%`,
              }}
            />
          </div>
          <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
            {Math.round((chunkProgress.current / chunkProgress.total) * 100)}% completato
          </p>
        </div>
      )}

      {/* Helpful tip */}
      <div className="max-w-md rounded-lg bg-blue-50 px-4 py-3 dark:bg-blue-900/20">
        <p className="text-center text-xs text-blue-700 dark:text-blue-300">
          Non chiudere questa pagina. Il processo potrebbe richiedere alcuni istanti
          a seconda della lunghezza del documento.
        </p>
      </div>
    </div>
  );
}

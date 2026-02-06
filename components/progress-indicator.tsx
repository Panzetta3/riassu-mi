"use client";

import { useState, useEffect } from "react";
import { Spinner } from "@/components/ui";

export type ProgressStage =
  | "uploading"    // Uploading to storage
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
  pageCount?: number;
}

const stageMessages: Record<ProgressStage, string> = {
  uploading: "Caricamento file...",
  analyzing: "Analizzando il documento...",
  generating: "Generando riassunto...",
  chunking: "Elaborando il documento...",
  saving: "Salvando il riassunto...",
};

const stageDescriptions: Record<ProgressStage, string> = {
  uploading: "Caricamento del file in corso",
  analyzing: "Estrazione del testo dal documento",
  generating: "L'intelligenza artificiale sta creando il tuo riassunto",
  chunking: "Il documento viene elaborato in parti per una migliore analisi",
  saving: "Finalizzazione in corso",
};

// Estimated seconds per page group (4 pages)
const SECONDS_PER_GROUP = 15;

function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${Math.ceil(seconds)} sec`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.ceil(seconds % 60);
  return secs > 0 ? `${mins} min ${secs} sec` : `${mins} min`;
}

export function ProgressIndicator({ stage, chunkProgress, pageCount }: ProgressIndicatorProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime] = useState(Date.now());

  // Update elapsed time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const message = stage === "chunking" && chunkProgress
    ? `Elaborando parte ${chunkProgress.current} di ${chunkProgress.total}...`
    : stageMessages[stage];

  const description = stageDescriptions[stage];

  // Calculate progress and estimated time
  let progressPercent = 0;
  let estimatedTotal = 0;
  let estimatedRemaining = 0;

  if (chunkProgress && chunkProgress.total > 0) {
    progressPercent = Math.round((chunkProgress.current / chunkProgress.total) * 100);
    estimatedTotal = chunkProgress.total * SECONDS_PER_GROUP;

    // Calculate remaining time based on actual elapsed time
    if (chunkProgress.current > 0) {
      const avgTimePerChunk = elapsedTime / chunkProgress.current;
      estimatedRemaining = avgTimePerChunk * (chunkProgress.total - chunkProgress.current);
    } else {
      estimatedRemaining = estimatedTotal;
    }
  } else if (pageCount) {
    // Estimate based on page count
    const groups = Math.ceil(pageCount / 4);
    estimatedTotal = groups * SECONDS_PER_GROUP;

    // Progress based on stage
    if (stage === "uploading") {
      progressPercent = 2;
      estimatedRemaining = estimatedTotal + 5;
    } else if (stage === "analyzing") {
      progressPercent = 5;
      estimatedRemaining = estimatedTotal;
    } else if (stage === "generating") {
      progressPercent = 50;
      estimatedRemaining = estimatedTotal * 0.5;
    } else if (stage === "saving") {
      progressPercent = 95;
      estimatedRemaining = 2;
    }
  } else {
    // Default progress based on stage
    if (stage === "uploading") progressPercent = 2;
    else if (stage === "analyzing") progressPercent = 10;
    else if (stage === "generating") progressPercent = 50;
    else if (stage === "saving") progressPercent = 95;
  }

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

      {/* Progress bar */}
      <div className="w-full max-w-md space-y-2">
        <div className="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{progressPercent}% completato</span>
          {estimatedRemaining > 0 && (
            <span>~{formatTime(estimatedRemaining)} rimanenti</span>
          )}
        </div>
      </div>

      {/* Chunk progress detail */}
      {chunkProgress && chunkProgress.total > 1 && (
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Gruppo {chunkProgress.current} di {chunkProgress.total}
        </p>
      )}

      {/* Elapsed time */}
      <p className="text-xs text-gray-400 dark:text-gray-500">
        Tempo trascorso: {formatTime(elapsedTime)}
      </p>

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

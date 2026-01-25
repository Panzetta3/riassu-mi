"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileUpload, MAX_FILE_SIZE } from "@/components/file-upload";
import { Button, Card, CardContent, CardHeader, Input } from "@/components/ui";
import { DetailLevelSelector, DetailLevel } from "@/components/detail-level-selector";
import { ProgressIndicator, ProgressStage } from "@/components/progress-indicator";
import { parsePageRanges } from "@/lib/utils";

function validateFile(file: File): string | null {
  // Check file type
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return "Il file deve essere in formato PDF";
  }

  // Check MIME type (additional validation)
  if (file.type !== "application/pdf") {
    return "Il file deve essere un PDF valido";
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return "Il file supera il limite di 20MB";
  }

  return null;
}

// Get page count from PDF using pdf-lib (client-side compatible)
async function getPdfPageCount(file: File): Promise<number> {
  const { PDFDocument } = await import("pdf-lib");
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  return pdfDoc.getPageCount();
}

export default function UploadPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [isLoadingPageCount, setIsLoadingPageCount] = useState(false);
  const [excludePagesInput, setExcludePagesInput] = useState("");
  const [excludePagesError, setExcludePagesError] = useState<string | null>(null);
  const [excludedPages, setExcludedPages] = useState<number[]>([]);
  const [detailLevel, setDetailLevel] = useState<DetailLevel>("medium");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStage, setProgressStage] = useState<ProgressStage>("analyzing");
  const [apiError, setApiError] = useState<string | null>(null);

  // Load page count when file is selected
  useEffect(() => {
    if (!selectedFile) {
      setPageCount(null);
      setExcludePagesInput("");
      setExcludePagesError(null);
      setExcludedPages([]);
      return;
    }

    setIsLoadingPageCount(true);
    getPdfPageCount(selectedFile)
      .then((count) => {
        setPageCount(count);
      })
      .catch(() => {
        setPageCount(null);
      })
      .finally(() => {
        setIsLoadingPageCount(false);
      });
  }, [selectedFile]);

  // Validate exclude pages input when it changes or page count changes
  useEffect(() => {
    if (!excludePagesInput.trim()) {
      setExcludePagesError(null);
      setExcludedPages([]);
      return;
    }

    const result = parsePageRanges(excludePagesInput, pageCount ?? undefined);
    if (result.error) {
      setExcludePagesError(result.error);
      setExcludedPages([]);
    } else {
      setExcludePagesError(null);
      setExcludedPages(result.pages);
    }
  }, [excludePagesInput, pageCount]);

  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
    } else {
      setError(null);
      setSelectedFile(file);
    }
  }, []);

  const handleClearFile = useCallback(() => {
    setSelectedFile(null);
    setError(null);
    setPageCount(null);
    setExcludePagesInput("");
    setExcludePagesError(null);
    setExcludedPages([]);
    setApiError(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setApiError(null);
    setProgressStage("analyzing");

    try {
      // Build form data
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("detailLevel", detailLevel);
      if (excludePagesInput.trim()) {
        formData.append("excludePages", excludePagesInput);
      }

      // Update progress stage after a brief moment to show "Analyzing"
      const stageTimer = setTimeout(() => {
        setProgressStage("generating");
      }, 1500);

      // Call the API
      const response = await fetch("/api/summarize", {
        method: "POST",
        body: formData,
      });

      clearTimeout(stageTimer);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Errore durante la generazione del riassunto");
      }

      // Show saving stage briefly before redirect
      setProgressStage("saving");

      // Redirect to the summary page
      setTimeout(() => {
        router.push(`/summary/${data.summaryId}`);
      }, 500);

    } catch (err) {
      setIsProcessing(false);
      setApiError(err instanceof Error ? err.message : "Errore sconosciuto");
    }
  }, [selectedFile, detailLevel, excludePagesInput, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-4 py-12 dark:from-gray-900 dark:to-gray-950">
      <div className="mx-auto max-w-2xl">
        {/* Back link */}
        <Link
          href="/"
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
          Torna alla home
        </Link>

        <Card>
          <CardHeader>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Carica il tuo PDF
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Seleziona un file PDF per generare un riassunto intelligente
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Show Progress Indicator when processing */}
            {isProcessing ? (
              <ProgressIndicator stage={progressStage} />
            ) : (
              <>
                {/* File Upload Component */}
                <FileUpload
                  onFileSelect={handleFileSelect}
                  selectedFile={selectedFile}
                  error={error}
                  onClearFile={handleClearFile}
                />

                {/* API Error Message */}
                {apiError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                    <div className="flex items-start gap-3">
                      <svg
                        className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500 dark:text-red-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div>
                        <p className="font-medium text-red-800 dark:text-red-200">
                          Errore
                        </p>
                        <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                          {apiError}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Page Exclusion Input - only show when file is selected */}
                {selectedFile && !error && (
                  <div className="space-y-4">
                    {/* Page count info */}
                    {isLoadingPageCount ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Analizzando il PDF...
                      </p>
                    ) : pageCount !== null ? (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Il PDF contiene <span className="font-semibold">{pageCount}</span> {pageCount === 1 ? "pagina" : "pagine"}
                      </p>
                    ) : null}

                    {/* Page exclusion input */}
                    <div>
                      <Input
                        label="Pagine da escludere (opzionale)"
                        placeholder="es. 1-3, 5, 10-15"
                        value={excludePagesInput}
                        onChange={(e) => setExcludePagesInput(e.target.value)}
                        error={excludePagesError ?? undefined}
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Inserisci i numeri di pagina o gli intervalli da saltare (es. &quot;1-3, 5, 10-15&quot;)
                      </p>
                    </div>

                    {/* Preview of pages to process */}
                    {pageCount !== null && !excludePagesError && (
                      <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                        <div className="flex flex-col gap-2 text-sm sm:flex-row sm:justify-between">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Pagine escluse: </span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {excludedPages.length}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Pagine da processare: </span>
                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                              {pageCount - excludedPages.length}
                            </span>
                          </div>
                        </div>
                        {excludedPages.length > 0 && excludedPages.length <= 20 && (
                          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Escluse: {excludedPages.join(", ")}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Detail Level Selector */}
                    <DetailLevelSelector
                      value={detailLevel}
                      onChange={setDetailLevel}
                    />
                  </div>
                )}

                {/* Action Button */}
                {selectedFile && !error && !excludePagesError && (
                  <div className="flex justify-center pt-4">
                    <Button
                      variant="primary"
                      className="px-8 py-3 text-lg"
                      onClick={handleSubmit}
                    >
                      Genera Riassunto
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Info section */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            I tuoi file vengono elaborati in modo sicuro e non vengono
            conservati dopo la generazione del riassunto.
          </p>
        </div>
      </div>
    </div>
  );
}

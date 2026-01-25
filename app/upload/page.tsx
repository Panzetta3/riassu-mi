"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { FileUpload, MAX_FILE_SIZE } from "@/components/file-upload";
import { Button, Card, CardContent, CardHeader, Input } from "@/components/ui";
import { DetailLevelSelector, DetailLevel } from "@/components/detail-level-selector";
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [isLoadingPageCount, setIsLoadingPageCount] = useState(false);
  const [excludePagesInput, setExcludePagesInput] = useState("");
  const [excludePagesError, setExcludePagesError] = useState<string | null>(null);
  const [excludedPages, setExcludedPages] = useState<number[]>([]);
  const [detailLevel, setDetailLevel] = useState<DetailLevel>("medium");

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
  }, []);

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
            {/* File Upload Component */}
            <FileUpload
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
              error={error}
              onClearFile={handleClearFile}
            />

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
                <Button variant="primary" className="px-8 py-3 text-lg">
                  Genera Riassunto
                </Button>
              </div>
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

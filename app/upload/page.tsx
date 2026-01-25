"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { FileUpload, MAX_FILE_SIZE } from "@/components/file-upload";
import { Button, Card, CardContent, CardHeader } from "@/components/ui";

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

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

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

            {/* Action Button */}
            {selectedFile && !error && (
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

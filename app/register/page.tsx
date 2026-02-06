"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, CardHeader, Input } from "@/components/ui";
import { useToast } from "@/components/toast";

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

function validateForm(
  email: string,
  password: string,
  confirmPassword: string
): FormErrors {
  const errors: FormErrors = {};

  // Validate email
  if (!email) {
    errors.email = "L'email Ã¨ obbligatoria";
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.email = "Formato email non valido";
    }
  }

  // Validate password
  if (!password) {
    errors.password = "La password Ã¨ obbligatoria";
  } else if (password.length < 8) {
    errors.password = "La password deve contenere almeno 8 caratteri";
  }

  // Validate confirm password
  if (!confirmPassword) {
    errors.confirmPassword = "Conferma la password";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Le password non corrispondono";
  }

  return errors;
}

export default function RegisterPage() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setApiError(null);

    // Client-side validation
    const validationErrors = validateForm(email, password, confirmPassword);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || "Errore durante la registrazione";
        setApiError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      // Redirect to login page on success
      router.push("/login?registered=true");
    } catch {
      const errorMsg = "Errore di connessione. Riprova piÃ¹ tardi.";
      setApiError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen page-shell px-4 py-12">
      <div className="mx-auto max-w-md">
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
              Crea un account
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Registrati per salvare i tuoi riassunti e quiz
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {apiError}
                    </p>
                  </div>
                </div>
              )}

              {/* Email field */}
              <Input
                type="email"
                label="Email"
                placeholder="tuaemail@esempio.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) {
                    setErrors((prev) => ({ ...prev, email: undefined }));
                  }
                }}
                error={errors.email}
                disabled={isLoading}
              />

              {/* Password field */}
              <Input
                type="password"
                label="Password"
                placeholder="Minimo 8 caratteri"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) {
                    setErrors((prev) => ({ ...prev, password: undefined }));
                  }
                }}
                error={errors.password}
                disabled={isLoading}
              />

              {/* Confirm Password field */}
              <Input
                type="password"
                label="Conferma Password"
                placeholder="Ripeti la password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) {
                    setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                  }
                }}
                error={errors.confirmPassword}
                disabled={isLoading}
              />

              {/* Submit button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="h-4 w-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Registrazione in corso...
                    </span>
                  ) : (
                    "Registrati"
                  )}
                </Button>
              </div>
            </form>

            {/* Login link */}
            <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              Hai giÃ  un account?{" "}
              <Link
                href="/login"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Accedi
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


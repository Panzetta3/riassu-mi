"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, CardContent, CardHeader } from "@/components/ui";
import { useToast } from "@/components/toast";
import { Spinner } from "@/components/ui";

interface UserProfile {
  id: string;
  email: string;
  email_verified: boolean;
  created_at: string;
  isAdmin: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const toast = useToast();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          router.push("/login");
        }
      } catch {
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, [router]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        toast.success("Logout effettuato con successo");
        router.push("/");
        router.refresh();
      } else {
        toast.error("Errore durante il logout");
      }
    } catch {
      toast.error("Errore di connessione");
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-950">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const createdDate = new Date(user.created_at).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-4 py-12 dark:from-gray-900 dark:to-gray-950">
      <div className="mx-auto max-w-md">
        {/* Back link */}
        <Link
          href="/dashboard"
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
          Torna alla dashboard
        </Link>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <svg
                  className="h-8 w-8 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Il tuo profilo
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Gestisci il tuo account
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-6">
              {/* Email */}
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Email
                </label>
                <p className="mt-1 text-lg text-gray-900 dark:text-white">
                  {user.email}
                </p>
              </div>

              {/* Verification status */}
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Stato email
                </label>
                <div className="mt-1 flex items-center gap-2">
                  {user.email_verified ? (
                    <>
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                        <svg
                          className="h-3 w-3 text-green-600 dark:text-green-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </span>
                      <span className="text-green-700 dark:text-green-400">
                        Verificata
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                        <svg
                          className="h-3 w-3 text-amber-600 dark:text-amber-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M12 9v2m0 4h.01"
                          />
                        </svg>
                      </span>
                      <span className="text-amber-700 dark:text-amber-400">
                        Non verificata
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Member since */}
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Membro dal
                </label>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {createdDate}
                </p>
              </div>

              {/* Admin section */}
              {user.isAdmin && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Pannello Admin
                  </label>
                  <div className="mt-3 space-y-2">
                    <Link
                      href="/admin/api-keys"
                      className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <svg className="h-5 w-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      <div>
                        <p className="font-medium">Gestione API Keys</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Aggiungi e gestisci le chiavi API</p>
                      </div>
                    </Link>
                    <Link
                      href="/admin/users"
                      className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <div>
                        <p className="font-medium">Gestione Utenti</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Visualizza e gestisci gli utenti</p>
                      </div>
                    </Link>
                  </div>
                </div>
              )}

              {/* Logout button */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
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
                      Uscita in corso...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Esci dall&apos;account
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

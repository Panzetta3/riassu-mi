"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";
import { useToast } from "@/components/toast";

interface HeaderProps {
  user: { id: string; email: string } | null;
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();
  const toast = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  return (
    <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white"
        >
          Riassu<span className="text-blue-600">.mi</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                Dashboard
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profilo
              </Link>
              <Button
                variant="ghost"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                {isLoggingOut ? "Uscita..." : "Esci"}
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">Accedi</Button>
              </Link>
              <Link href="/register">
                <Button variant="primary">Registrati</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

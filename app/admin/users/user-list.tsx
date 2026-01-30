"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent } from "@/components/ui";
import { useToast } from "@/components/toast";
import type { UserData } from "./page";

interface UserListProps {
  initialUsers: UserData[];
  adminEmail: string;
}

export function UserList({ initialUsers, adminEmail }: UserListProps) {
  const router = useRouter();
  const toast = useToast();
  const [users, setUsers] = useState(initialUsers);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("it-IT", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDeleteClick = (user: UserData) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    setDeletingId(userToDelete.id);
    try {
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setUsers(users.filter((u) => u.id !== userToDelete.id));
        toast.success("Utente eliminato con successo");
      } else {
        const data = await response.json();
        toast.error(data.error || "Errore durante l'eliminazione");
      }
    } catch {
      toast.error("Errore di connessione");
    } finally {
      setDeletingId(null);
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  return (
    <>
      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {users.length}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Utenti totali
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {users.filter((u) => u.email_verified).length}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Verificati
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {users.filter((u) => !u.email_verified).length}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Non verificati
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {users.reduce((sum, u) => sum + u._count.summaries, 0)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Riassunti totali
            </p>
          </CardContent>
        </Card>
      </div>

      {/* User list */}
      <Card>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              Nessun utente registrato
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => {
                const isAdmin = user.email.toLowerCase() === adminEmail.toLowerCase();
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        isAdmin
                          ? "bg-purple-100 dark:bg-purple-900/30"
                          : "bg-gray-100 dark:bg-gray-800"
                      }`}>
                        {isAdmin ? (
                          <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        )}
                      </div>

                      {/* Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {user.email}
                          </p>
                          {isAdmin && (
                            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                              Admin
                            </span>
                          )}
                          {user.email_verified ? (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                              Verificato
                            </span>
                          ) : (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                              Non verificato
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Registrato il {formatDate(user.created_at)} · {user._count.summaries} riassunti
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    {!isAdmin && (
                      <Button
                        variant="ghost"
                        onClick={() => handleDeleteClick(user)}
                        disabled={deletingId === user.id}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        {deletingId === user.id ? (
                          <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Eliminare questo utente?
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Stai per eliminare <strong>{userToDelete.email}</strong>. Questa azione eliminerà anche tutti i suoi {userToDelete._count.summaries} riassunti e non può essere annullata.
            </p>
            <div className="mt-6 flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
              >
                Annulla
              </Button>
              <Button
                variant="primary"
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={handleDeleteConfirm}
                disabled={deletingId !== null}
              >
                {deletingId ? "Eliminazione..." : "Elimina"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

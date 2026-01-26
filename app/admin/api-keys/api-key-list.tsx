"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ApiKeyData } from "./page";

interface ApiKeyListProps {
  initialKeys: ApiKeyData[];
}

export function ApiKeyList({ initialKeys }: ApiKeyListProps) {
  const router = useRouter();
  const [apiKeys, setApiKeys] = useState(initialKeys);
  const [newKey, setNewKey] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiKeyData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Add new API key
  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newKey.trim()) {
      setAddError("Inserisci una chiave API");
      return;
    }

    setIsAdding(true);
    setAddError(null);

    try {
      const response = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: newKey.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Errore durante l'aggiunta");
      }

      // Clear the input and refresh
      setNewKey("");
      router.refresh();

      // Add the new key to the list with masked value
      const data = await response.json();
      const newKeyData: ApiKeyData = {
        id: data.id,
        lastFourChars: newKey.trim().slice(-4),
        provider: "openrouter",
        is_active: true,
        last_used: null,
        fail_count: 0,
        disabled_until: null,
      };
      setApiKeys((prev) => [newKeyData, ...prev]);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setIsAdding(false);
    }
  };

  // Delete API key
  const handleDeleteClick = (key: ApiKeyData) => {
    setDeleteTarget(key);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/admin/api-keys/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Errore durante l'eliminazione");
      }

      // Remove from list
      setApiKeys((prev) => prev.filter((k) => k.id !== deleteTarget.id));
      setDeleteTarget(null);
      router.refresh();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setIsDeleting(false);
    }
  };

  // Reactivate or deactivate key
  const handleToggleActive = async (key: ApiKeyData) => {
    setActionLoading(key.id);

    try {
      const action = key.is_active ? "deactivate" : "reactivate";
      const response = await fetch(`/api/admin/api-keys/${key.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Errore durante l'aggiornamento");
      }

      // Update key in list
      setApiKeys((prev) =>
        prev.map((k) =>
          k.id === key.id
            ? {
                ...k,
                is_active: !k.is_active,
                fail_count: k.is_active ? k.fail_count : 0,
                disabled_until: k.is_active ? k.disabled_until : null,
              }
            : k
        )
      );
      router.refresh();
    } catch (err) {
      console.error("Error toggling key:", err);
    } finally {
      setActionLoading(null);
    }
  };

  // Get status display for a key
  const getKeyStatus = (key: ApiKeyData) => {
    if (!key.is_active) {
      return {
        label: "Disattivata",
        color: "text-gray-500 bg-gray-100 dark:bg-gray-700 dark:text-gray-400",
      };
    }
    if (key.disabled_until && new Date(key.disabled_until) > new Date()) {
      return {
        label: "Temp. disabilitata",
        color:
          "text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400",
      };
    }
    return {
      label: "Attiva",
      color:
        "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400",
    };
  };

  return (
    <>
      {/* Add new key form */}
      <div className="mb-8 rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Aggiungi nuova chiave API
        </h2>
        <form onSubmit={handleAddKey} className="flex gap-4">
          <div className="flex-1">
            <input
              type="password"
              value={newKey}
              onChange={(e) => {
                setNewKey(e.target.value);
                setAddError(null);
              }}
              placeholder="sk-or-v1-..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
              disabled={isAdding}
            />
            {addError && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {addError}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={isAdding}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {isAdding ? (
              <>
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
                Aggiunta...
              </>
            ) : (
              <>
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Aggiungi
              </>
            )}
          </button>
        </form>
      </div>

      {/* API Keys list */}
      <div className="rounded-xl bg-white shadow-sm dark:bg-gray-800">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Chiavi API ({apiKeys.length})
          </h2>
        </div>

        {apiKeys.length === 0 ? (
          <div className="p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Nessuna chiave API configurata
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
              Aggiungi la tua prima chiave OpenRouter per iniziare
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {apiKeys.map((key) => {
              const status = getKeyStatus(key);
              return (
                <div
                  key={key.id}
                  className="flex items-center justify-between px-6 py-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm text-gray-900 dark:text-white">
                        ****{key.lastFourChars}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}
                      >
                        {status.label}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        {key.provider}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        Errori: {key.fail_count}
                        {key.fail_count > 5 && " (soglia superata)"}
                      </span>
                      {key.last_used && (
                        <span>
                          Ultimo uso:{" "}
                          {new Date(key.last_used).toLocaleString("it-IT", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </span>
                      )}
                      {key.disabled_until &&
                        new Date(key.disabled_until) > new Date() && (
                          <span className="text-orange-600 dark:text-orange-400">
                            Disabilitata fino a:{" "}
                            {new Date(key.disabled_until).toLocaleString(
                              "it-IT",
                              {
                                dateStyle: "short",
                                timeStyle: "short",
                              }
                            )}
                          </span>
                        )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Reactivate/Deactivate button */}
                    <button
                      onClick={() => handleToggleActive(key)}
                      disabled={actionLoading === key.id}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                        key.is_active
                          ? "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                          : "text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                      } disabled:opacity-50`}
                      title={key.is_active ? "Disattiva" : "Riattiva"}
                    >
                      {actionLoading === key.id ? (
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
                      ) : key.is_active ? (
                        "Disattiva"
                      ) : (
                        "Riattiva"
                      )}
                    </button>
                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteClick(key)}
                      className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                      title="Elimina chiave"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <svg
                  className="h-6 w-6 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Conferma eliminazione
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Sei sicuro di voler eliminare la chiave ****
                  {deleteTarget.lastFourChars}?
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Questa azione non può essere annullata.
            </p>

            {deleteError && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {deleteError}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Annulla
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
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
                    Eliminazione...
                  </>
                ) : (
                  <>
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Elimina
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

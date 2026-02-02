import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { UserList } from "./user-list";

export const dynamic = 'force-dynamic';

export interface UserData {
  id: string;
  email: string;
  email_verified: boolean;
  created_at: Date;
  _count: {
    summaries: number;
  };
}

export default async function AdminUsersPage() {
  // Check admin access
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4 dark:from-gray-900 dark:to-gray-950">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg dark:bg-gray-800">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
              <svg
                className="h-8 w-8 text-yellow-600 dark:text-yellow-400"
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
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Configurazione mancante
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              ADMIN_EMAIL non configurato nel file .env
            </p>
          </div>
        </div>
      </div>
    );
  }

  const session = await getSession();

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/login?redirect=/admin/users");
  }

  // Check if user is admin
  if (session.email.toLowerCase() !== adminEmail.toLowerCase()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4 dark:from-gray-900 dark:to-gray-950">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg dark:bg-gray-800">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <svg
                className="h-8 w-8 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Accesso negato
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Questa pagina è riservata agli amministratori.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Fetch users with summary count
  const users = await prisma.user.findMany({
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      email: true,
      email_verified: true,
      created_at: true,
      _count: {
        select: {
          summaries: true,
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-4 py-12 dark:from-gray-900 dark:to-gray-950">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Gestione Utenti
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Visualizza e gestisci gli utenti registrati
          </p>
        </div>

        {/* User List */}
        <UserList initialUsers={users} adminEmail={adminEmail} />
      </div>
    </div>
  );
}

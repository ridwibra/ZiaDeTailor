"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User } from "lucide-react";
import { authClient } from "@/lib/auth-client";

type UserRole = "user" | "staff" | "admin";

type UserItem = {
  _id: string;
  name: string;
  email: string;
  image?: string;
  role: UserRole;
  createdAt?: string;
  emailVerified?: boolean;
};

const ROLE_OPTIONS: UserRole[] = ["user", "staff", "admin"];

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const { data: session, isPending } = authClient.useSession();
  const role = (session?.user as { role?: UserRole } | undefined)?.role;

  useEffect(() => {
    if (isPending) return;

    if (!session || (role !== "admin" && role !== "staff")) {
      router.replace("/unauthorized");
    }
  }, [isPending, session, role, router]);

  useEffect(() => {
    if (isPending) return;
    if (!session || (role !== "admin" && role !== "staff")) return;

    const loadUsers = async () => {
      try {
        setLoading(true);

        const res = await fetch("/api/users", {
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load users");
        }

        setUsers(data.users || []);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to load users",
        );
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [isPending, session, role]);

  const handleRoleChange = async (userId: string, role: UserRole) => {
    setSavingId(userId);

    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update role");
      }

      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role } : u)),
      );

      toast.success("User role updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setSavingId(null);
    }
  };

  if (isPending || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 pt-24 text-slate-600 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 dark:text-slate-300">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-6 py-4 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
          <span className="text-sm font-medium">Loading users...</span>
        </div>
      </div>
    );
  }

  if (!session || (role !== "admin" && role !== "staff")) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 px-4 py-6 pt-24 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-3xl border border-white/50 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 sm:p-8">
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm font-medium text-teal-600 transition hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
          >
            ← Back to Admin
          </Link>

          <p className="mt-3 text-sm font-semibold uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400">
            Admin Panel
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
            Users
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Manage user roles and account access.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="hidden border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 md:grid md:grid-cols-[1.5fr_2fr_1fr_1fr] md:px-6">
            <div>User</div>
            <div>Email</div>
            <div>Role</div>
            <div>Update Role</div>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {users.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-4 py-12 text-center dark:px-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl dark:bg-slate-800">
                  👤
                </div>
                <p className="max-w-sm text-sm text-slate-600 dark:text-slate-300">
                  No users found.
                </p>
              </div>
            ) : (
              users.map((user) => (
                <div
                  key={user._id}
                  className="grid grid-cols-1 gap-4 px-4 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 md:grid-cols-[1.5fr_2fr_1fr_1fr] md:items-center md:px-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-slate-600 dark:from-slate-700 dark:to-slate-800 dark:text-slate-300">
                      {user.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.image}
                          alt={user.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5" strokeWidth={2.2} />
                      )}
                    </div>

                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {user.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {user.emailVerified ? "Verified" : "Not verified"}
                      </p>
                    </div>
                  </div>

                  <div className="truncate text-sm text-slate-600 dark:text-slate-300">
                    {user.email}
                  </div>

                  <div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                        user.role === "admin"
                          ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                          : user.role === "staff"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>

                  <div>
                    <select
                      value={user.role}
                      disabled={savingId === user._id}
                      onChange={(e) =>
                        handleRoleChange(user._id, e.target.value as UserRole)
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

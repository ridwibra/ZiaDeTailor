"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { deleteMedia } from "@/utils/files/requests";
import { UserType } from "@/utils/types";
import { LogoutButton } from "@/components/auth/LogoutButton";
import MyAddresses from "@/components/MyAddresses";
import MyOrders from "@/components/MyOrders";

type ProfileSection =
  | "overview"
  | "orders"
  | "addresses"
  | "security"
  | "account";

type CustomUser = {
  id: string;
  email: string;
  name: string;
  avatar?: {
    image_url: string | null;
    public_id: string | null;
  } | null;
};

const sections: { id: ProfileSection; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "orders", label: "Orders" },
  { id: "addresses", label: "Addresses" },
  { id: "security", label: "Security" },
  { id: "account", label: "Account Management" },
];

function parseUserAgent(userAgent: string) {
  if (!userAgent) {
    return {
      browser: "Unknown browser",
      os: "Unknown device",
    };
  }

  const browserMatch =
    userAgent.match(/Edg\/([\d.]+)/) ||
    userAgent.match(/Chrome\/([\d.]+)/) ||
    userAgent.match(/Firefox\/([\d.]+)/) ||
    userAgent.match(/Safari\/([\d.]+)/);

  const osMatch = userAgent.match(/\(([^)]+)\)/)?.[1] || "Unknown device";

  return {
    browser: browserMatch
      ? browserMatch[0].replace("/", " ")
      : "Unknown browser",
    os: osMatch,
  };
}

const formatDate = (date: Date | string | undefined | null) => {
  if (!date) {
    return "-";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsedDate);
};

export default function AccountDashboardPage() {
  const router = useRouter();

  const [deleting, setDeleting] = useState(false);
  const [activeSection, setActiveSection] =
    useState<ProfileSection>("overview");

  const { data: sessionData, isPending, error } = authClient.useSession();

  const rawUserAgent = sessionData?.session?.userAgent ?? "";

  const { browser, os } = useMemo(
    () => parseUserAgent(rawUserAgent),
    [rawUserAgent],
  );

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Permanently delete your account? This cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);

      if (!sessionData) {
        throw new Error("No active session.");
      }

      const currentUser = sessionData.user as CustomUser;
      const publicId = currentUser.avatar?.public_id;

      if (publicId) {
        await deleteMedia(publicId);
      }

      const { error: deleteError } = await authClient.deleteUser();

      if (deleteError) {
        throw new Error(deleteError.message || "Failed to delete account.");
      }

      toast.success("Your account has been deleted.");
      router.push("/");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete account.",
      );
    } finally {
      setDeleting(false);
    }
  };

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-lg text-gray-600 dark:text-gray-300">
        Loading your account…
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-lg text-gray-600 dark:text-gray-300">
        Not signed in
      </div>
    );
  }

  const user = sessionData.user as typeof sessionData.user & UserType;
  const sessionDetails = sessionData.session;

  const statItems = [
    {
      label: "Role",
      value: user.role || "User",
    },
    {
      label: "Last Active",
      value: sessionDetails.createdAt
        ? formatDate(sessionDetails.createdAt)
        : "First session",
    },
    {
      label: "Session Expires",
      value: formatDate(sessionDetails.expiresAt),
    },
  ];

  const contentCard =
    "rounded-2xl border border-white/40 bg-white/80 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 px-4 py-6 pt-24 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-white/50 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400">
              Account Center
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
              My Account
            </h1>

            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Manage your account, orders, saved addresses, and security.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/editprofile"
              className="rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2"
            >
              Edit Profile
            </Link>

            <LogoutButton aria-label="Sign out of your account" />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-2xl border border-white/50 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white lg:mb-5">
              Navigation
            </h2>

            <nav className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {sections.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-teal-400 ${
                    activeSection === item.id
                      ? "bg-teal-500 text-white shadow-md"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>

          <main className="space-y-6">
            {activeSection === "overview" && (
              <section className={contentCard}>
                <div className="flex flex-col gap-6 md:flex-row md:items-start">
                  <div className="mx-auto md:mx-0">
                    <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-teal-400 shadow-lg sm:h-32 sm:w-32">
                      <Image
                        src={
                          user.avatar?.image_url ||
                          user.image ||
                          "/images/default-avatar.png"
                        }
                        alt={`${user.name}'s profile photo`}
                        fill
                        sizes="128px"
                        className="object-cover"
                      />
                    </div>
                  </div>

                  <div className="flex-1 space-y-3 text-center md:text-left">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                        {user.name}
                      </h2>

                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {user.email}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          user.emailVerified
                            ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300"
                            : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                        }`}
                      >
                        {user.emailVerified
                          ? "Email verified"
                          : "Email not verified"}
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        Member since {formatDate(user.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="my-6 h-px bg-slate-200 dark:bg-slate-700" />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {statItems.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60"
                    >
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        {item.label}
                      </p>

                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeSection === "orders" && (
              <section className={contentCard}>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Orders
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Track your order status, shipping updates, and confirm receipt
                  after delivery.
                </p>

                <MyOrders />
              </section>
            )}

            {activeSection === "addresses" && (
              <section className={contentCard}>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Addresses
                </h2>

                <MyAddresses />
              </section>
            )}

            {activeSection === "security" && (
              <section className={contentCard}>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Security
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Review information about your active session.
                </p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Device
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                      {os}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Browser
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                      {browser}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Session Started
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                      {formatDate(sessionDetails.createdAt)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Session Expires
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                      {formatDate(sessionDetails.expiresAt)}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {activeSection === "account" && (
              <section className={contentCard}>
                <h2 className="text-xl font-bold text-red-600 dark:text-red-400">
                  Account Management
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Deleting your account permanently removes your profile and
                  ends active access. This action cannot be undone.
                </p>

                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/20">
                  <p className="font-semibold text-red-700 dark:text-red-300">
                    Delete account
                  </p>

                  <p className="mt-1 text-sm text-red-600 dark:text-red-300">
                    Before deleting your account, make sure you no longer need
                    access to your account information or order history.
                  </p>

                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deleting ? "Deleting Account..." : "Delete Account"}
                  </button>
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

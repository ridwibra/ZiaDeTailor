"use client";

import { authClient } from "@/lib/auth-client";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { UserType } from "@/utils/types";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { deleteMedia } from "@/utils/files/requests";

type ProfileSection =
  | "overview"
  | "orders"
  | "addresses"
  | "payments"
  | "wishlist"
  | "returns"
  | "security"
  | "preferences"
  | "support"
  | "account";

function parseUserAgent(ua: string) {
  if (!ua) return { browser: "Unknown", os: "Unknown device" };

  const browserMatch =
    ua.match(/Edg\/([\d.]+)/) ||
    ua.match(/Chrome\/([\d.]+)/) ||
    ua.match(/Firefox\/([\d.]+)/) ||
    ua.match(/Safari\/([\d.]+)/);

  const osMatch = ua.match(/\(([^)]+)\)/)?.[1] || "Unknown device";

  return {
    browser: browserMatch
      ? browserMatch[0].replace("/", " ")
      : "Unknown browser",
    os: osMatch,
  };
}

const formatDate = (date: Date | string) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));

const sections: { id: ProfileSection; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "orders", label: "Orders" },
  { id: "addresses", label: "Addresses" },
  { id: "payments", label: "Payment Methods" },
  { id: "wishlist", label: "Wishlist" },
  { id: "returns", label: "Returns & Refunds" },
  { id: "security", label: "Security" },
  { id: "preferences", label: "Preferences" },
  { id: "support", label: "Support" },
  { id: "account", label: "Account Management" },
];

type CustomUser = {
  id: string;
  email: string;
  name: string;
  avatar?: {
    image_url: string | null;
    public_id: string | null;
  } | null;
};

export default function AccountDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { data: sessionData, isPending, error } = authClient.useSession();
  const [activeSection, setActiveSection] =
    useState<ProfileSection>("overview");

  const rawUserAgent = sessionData?.session?.userAgent ?? "";
  const { browser, os } = useMemo(
    () => parseUserAgent(rawUserAgent),
    [rawUserAgent],
  );

  const handleDelete = async () => {
    if (!confirm("Permanently delete your account? This cannot be undone."))
      return;

    setLoading(true);

    try {
      if (!sessionData) {
        throw new Error("No active session");
      }

      const user = sessionData.user as CustomUser;

      // Avatar may be null
      const publicId = user.avatar?.public_id;

      // Delete Cloudinary avatar FIRST
      if (publicId) {
        await deleteMedia(publicId);
      }

      // Delete BetterAuth user
      const { error } = await authClient.deleteUser();
      if (error) throw new Error(error.message || "Failed to delete account");

      toast.success("Your account has been successfully deleted.");
      router.push("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Deletion failed");
    } finally {
      setLoading(false);
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
      value: user.role,
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
              Manage your profile, preferences, and security settings in one
              place.
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
            <div className="mb-4 flex items-center justify-between lg:mb-5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Navigation
              </h2>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="rounded-lg border border-red-500 px-3 py-2 text-xs font-semibold text-red-600 transition disabled:opacity-50 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                {loading ? "Deleting..." : "Delete Account"}
              </button>
            </div>

            <nav className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {sections.map((item) => (
                <button
                  key={item.id}
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
                  Your recent orders will appear here. Implement fetching from
                  <span className="font-medium"> /api/orders</span>.
                </p>
              </section>
            )}

            {activeSection === "addresses" && (
              <section className={contentCard}>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Addresses
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Manage your shipping and billing addresses here.
                </p>
              </section>
            )}

            {activeSection === "payments" && (
              <section className={contentCard}>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Payment Methods
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Saved cards and payment options will be shown here.
                </p>
              </section>
            )}

            {activeSection === "wishlist" && (
              <section className={contentCard}>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Wishlist
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Products you’ve saved for later will appear here.
                </p>
              </section>
            )}

            {activeSection === "returns" && (
              <section className={contentCard}>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Returns & Refunds
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Track your return requests and refund status here.
                </p>
              </section>
            )}

            {activeSection === "security" && (
              <section className={contentCard}>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Security
                </h2>
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
                      Session Expires
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                      {formatDate(sessionDetails.expiresAt)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      IP Address
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                      Hidden for security
                    </p>
                  </div>
                </div>
              </section>
            )}

            {activeSection === "preferences" && (
              <section className={contentCard}>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Preferences
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Notification, language, and theme preferences will be managed
                  here.
                </p>
              </section>
            )}

            {activeSection === "support" && (
              <section className={contentCard}>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Support
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Contact support, view FAQs, and read policies here.
                </p>
              </section>
            )}

            {activeSection === "account" && (
              <section className={contentCard}>
                <h2 className="text-xl font-bold text-red-600 dark:text-red-400">
                  Account Management
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Export your data or delete your account. These actions are
                  irreversible.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
                    Export Data
                  </button>
                  <button className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700">
                    Delete Account
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

"use client";

import Link from "next/link";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useEffect, useReducer, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

type SalesItem = {
  _id: string;
  totalSales: number;
};

type Summary = {
  ordersPrice?: number;
  ordersCount?: number;
  productsCount?: number;
  usersCount?: number;
  salesData: SalesItem[];
};

type State = {
  loading: boolean;
  error: string;
  summary: Summary;
};

type Action =
  | { type: "FETCH_REQUEST" }
  | { type: "FETCH_SUCCESS"; payload: Summary }
  | { type: "FETCH_FAIL"; payload: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "FETCH_REQUEST":
      return {
        ...state,
        loading: true,
        error: "",
      };

    case "FETCH_SUCCESS":
      return {
        ...state,
        loading: false,
        summary: action.payload,
        error: "",
      };

    case "FETCH_FAIL":
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    default:
      return state;
  }
}

const navigationLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/banners", label: "Banners" },
  { href: "/admin/shipping", label: "Shipping" },
  { href: "/admin/users", label: "Users" },
];

export default function AdminPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const role = (
    session?.user as { role?: "user" | "staff" | "admin" } | undefined
  )?.role;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [{ loading, error, summary }, dispatch] = useReducer(reducer, {
    loading: true,
    summary: { salesData: [] },
    error: "",
  });

  useEffect(() => {
    if (isPending) return;

    if (!session || (role !== "admin" && role !== "staff")) {
      router.replace("/unauthorized");
    }
  }, [isPending, session, role, router]);

  useEffect(() => {
    if (isPending) return;
    if (!session || (role !== "admin" && role !== "staff")) return;

    const fetchData = async () => {
      try {
        dispatch({ type: "FETCH_REQUEST" });

        const res = await fetch("/api/summary", {
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || "Failed to load summary");
        }

        dispatch({
          type: "FETCH_SUCCESS",
          payload: data,
        });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Failed to load summary";

        dispatch({
          type: "FETCH_FAIL",
          payload: message,
        });

        toast.error(message);
      }
    };

    fetchData();
  }, [isPending, session, role]);

  const chartData = {
    labels: summary.salesData.map((item) => item._id),
    datasets: [
      {
        label: "Sales",
        data: summary.salesData.map((item) => item.totalSales),
        backgroundColor: "rgba(20, 184, 166, 0.8)",
        borderColor: "rgba(13, 148, 136, 1)",
        borderWidth: 1,
        borderRadius: 8,
        maxBarThickness: 46,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "#64748b",
          font: {
            size: 12,
            weight: 600 as const,
          },
        },
      },
      tooltip: {
        backgroundColor: "#0f172a",
        titleColor: "#f8fafc",
        bodyColor: "#e2e8f0",
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context: { raw: unknown }) => {
            const amount = Number(context.raw || 0);

            return `Sales: $${amount.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        border: {
          color: "#cbd5e1",
        },
        grid: {
          display: false,
        },
        ticks: {
          color: "#64748b",
          maxRotation: 0,
          autoSkip: true,
          font: {
            size: 11,
          },
        },
      },
      y: {
        beginAtZero: true,
        border: {
          display: false,
        },
        grid: {
          color: "rgba(148, 163, 184, 0.22)",
        },
        ticks: {
          color: "#64748b",
          font: {
            size: 11,
          },
          callback: (value: string | number) =>
            `$${Number(value).toLocaleString()}`,
        },
      },
    },
  };

  if (isPending || !session || (role !== "admin" && role !== "staff")) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 pt-24 text-slate-700 dark:bg-slate-950 dark:text-slate-200">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
          <span className="font-medium">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 pt-24 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-screen-2xl">
        <header className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400">
                Management Center
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Admin Dashboard
              </h1>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Monitor sales, orders, products, users, and storefront content.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((previous) => !previous)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-teal-500/15 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 md:hidden"
              aria-expanded={mobileMenuOpen}
              aria-controls="admin-navigation"
            >
              {mobileMenuOpen ? "Close menu" : "Admin menu"}
            </button>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
          <aside
            id="admin-navigation"
            className={`rounded-3xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:block md:self-start ${
              mobileMenuOpen ? "block" : "hidden"
            }`}
          >
            <nav aria-label="Admin navigation">
              <ul className="space-y-1">
                {navigationLinks.map((link) => {
                  const isDashboard = link.href === "/admin";

                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`block rounded-xl px-4 py-3 text-sm font-medium transition ${
                          isDashboard
                            ? "bg-teal-500 text-white shadow-sm hover:bg-teal-600"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                        }`}
                      >
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          <main className="min-w-0">
            {loading ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mx-auto flex w-fit items-center gap-3 text-slate-600 dark:text-slate-300">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
                  <span className="font-medium">Loading dashboard data...</span>
                </div>
              </div>
            ) : error ? (
              <div
                role="alert"
                className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700 shadow-sm dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
              >
                <h2 className="font-semibold">Unable to load the dashboard</h2>
                <p className="mt-1 text-sm">{error}</p>
              </div>
            ) : (
              <div className="space-y-6">
                <section
                  aria-label="Dashboard totals"
                  className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
                >
                  <DashboardCard
                    label="Total sales"
                    value={`$${(summary.ordersPrice ?? 0).toLocaleString()}`}
                    href="/admin/orders"
                    linkText="View sales"
                    accent="teal"
                  />

                  <DashboardCard
                    label="Orders"
                    value={(summary.ordersCount ?? 0).toLocaleString()}
                    href="/admin/orders"
                    linkText="View orders"
                    accent="blue"
                  />

                  <DashboardCard
                    label="Products"
                    value={(summary.productsCount ?? 0).toLocaleString()}
                    href="/admin/products"
                    linkText="View products"
                    accent="violet"
                  />

                  <DashboardCard
                    label="Users"
                    value={(summary.usersCount ?? 0).toLocaleString()}
                    href="/admin/users"
                    linkText="View users"
                    accent="orange"
                  />
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                  <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
                        Sales Report
                      </h2>

                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Sales performance from completed orders.
                      </p>
                    </div>

                    <span className="w-fit rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
                      {summary.salesData.length} data points
                    </span>
                  </div>

                  {summary.salesData.length > 0 ? (
                    <div className="h-72 w-full sm:h-80 lg:h-96">
                      <Bar options={chartOptions} data={chartData} />
                    </div>
                  ) : (
                    <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400">
                      No sales data is available yet.
                    </div>
                  )}
                </section>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

type DashboardCardProps = {
  label: string;
  value: string;
  href: string;
  linkText: string;
  accent: "teal" | "blue" | "violet" | "orange";
};

function DashboardCard({
  label,
  value,
  href,
  linkText,
  accent,
}: DashboardCardProps) {
  const accentClasses = {
    teal: "border-l-teal-500 text-teal-700 dark:text-teal-300",
    blue: "border-l-blue-500 text-blue-700 dark:text-blue-300",
    violet: "border-l-violet-500 text-violet-700 dark:text-violet-300",
    orange: "border-l-orange-500 text-orange-700 dark:text-orange-300",
  };

  return (
    <article
      className={`rounded-2xl border border-slate-200 border-l-4 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 ${accentClasses[accent]}`}
    >
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
        {value}
      </p>

      <Link
        href={href}
        className={`mt-4 inline-flex text-sm font-semibold underline underline-offset-4 transition hover:opacity-75 ${accentClasses[accent]}`}
      >
        {linkText}
      </Link>
    </article>
  );
}

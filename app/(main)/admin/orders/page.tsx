"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Eye, Package } from "lucide-react";

import { authClient } from "@/lib/auth-client";

type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

type FulfillmentStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

type OrderListItem = {
  _id: string;
  total: number;
  createdAt?: string;

  payment?: {
    method?: "paypal" | "card";
    status?: PaymentStatus;
  };

  fulfillment?: {
    status?: FulfillmentStatus;
  };

  user?: {
    name?: string;
    email?: string;
  } | null;
};

const formatMoney = (value: unknown) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : "$0.00";
};

const statusClassName = (status: string) => {
  switch (status) {
    case "delivered":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";

    case "shipped":
      return "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300";

    case "processing":
      return "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300";

    case "cancelled":
      return "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300";

    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  }
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const role = (
    session?.user as { role?: "user" | "staff" | "admin" } | undefined
  )?.role;

  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isPending && (!session || (role !== "admin" && role !== "staff"))) {
      router.replace("/unauthorized");
    }
  }, [isPending, role, router, session]);

  useEffect(() => {
    if (isPending || !session || (role !== "admin" && role !== "staff")) {
      return;
    }

    const loadOrders = async () => {
      try {
        setLoading(true);

        const response = await fetch("/api/orders", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load orders.");
        }

        setOrders(Array.isArray(data.orders) ? data.orders : []);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to load orders.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [isPending, role, session]);

  if (isPending || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 pt-24 dark:bg-slate-950">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-sm dark:bg-slate-900">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
          <span className="text-sm font-medium">Loading orders...</span>
        </div>
      </div>
    );
  }

  if (!session || (role !== "admin" && role !== "staff")) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 pt-24 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900 sm:p-8">
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </Link>

          <p className="mt-3 text-sm font-semibold uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400">
            Admin Panel
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
            Orders
          </h1>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
          <div className="hidden border-b border-slate-200 bg-slate-50 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 md:grid md:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
            <div>Customer</div>
            <div>Total</div>
            <div>Fulfillment</div>
            <div>Created</div>
            <div>Actions</div>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {orders.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
                <Package className="h-6 w-6" />
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  No orders found.
                </p>
              </div>
            ) : (
              orders.map((order) => {
                const status = order.fulfillment?.status || "pending";

                return (
                  <div
                    key={order._id}
                    className="grid grid-cols-1 gap-4 px-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 md:grid-cols-[1.5fr_1fr_1fr_1fr_1fr] md:items-center md:px-6"
                  >
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {order.user?.name || "Unknown user"}
                      </p>

                      <p className="text-xs text-slate-500">
                        {order.user?.email || "-"}
                      </p>
                    </div>

                    <div className="text-sm">{formatMoney(order.total)}</div>

                    <div>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClassName(
                          status,
                        )}`}
                      >
                        {status}
                      </span>

                      <p className="mt-1 text-xs text-slate-500">
                        {order.payment?.method === "paypal"
                          ? "PayPal"
                          : "Debit / Credit Card"}
                      </p>
                    </div>

                    <div className="text-sm">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString()
                        : "-"}
                    </div>

                    <Link
                      href={`/admin/orders/${order._id}`}
                      className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                    >
                      <Eye className="h-4 w-4" />
                      Manage
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

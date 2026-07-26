"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, Pencil, Trash2, Package, ArrowLeft } from "lucide-react";
import { authClient } from "@/lib/auth-client";

type OrderItem = {
  _id: string;
  totalPrice: number;
  isPaid: boolean;
  isDelivered: boolean;
  paidAt?: string;
  deliveredAt?: string;
  createdAt?: string;
  status?: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  user?: {
    name?: string;
    email?: string;
  };
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const role = (
    session?.user as { role?: "user" | "staff" | "admin" } | undefined
  )?.role;

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (isPending) return;

    if (!session || (role !== "admin" && role !== "staff")) {
      router.replace("/unauthorized");
    }
  }, [isPending, session, role, router]);

  useEffect(() => {
    if (isPending) return;
    if (!session || (role !== "admin" && role !== "staff")) return;

    const loadOrders = async () => {
      try {
        setLoading(true);

        const res = await fetch("/api/orders", {
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load orders");
        }

        setOrders(data.orders || []);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to load orders",
        );
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [isPending, session, role]);

  const handleDelete = async (orderId: string) => {
    const confirmed = window.confirm("Delete this order?");
    if (!confirmed) return;

    setDeletingId(orderId);

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete order");
      }

      setOrders((prev) => prev.filter((order) => order._id !== orderId));
      toast.success("Order deleted");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete order",
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (isPending || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 pt-24 text-slate-600 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 dark:text-slate-300">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-6 py-4 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 px-4 py-6 pt-24 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-3xl border border-white/50 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 sm:p-8">
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm font-medium text-teal-600 transition hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
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
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Review and manage customer orders.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="hidden border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 md:grid md:grid-cols-[1.5fr_1fr_1fr_1fr_1fr] md:px-6">
            <div>Customer</div>
            <div>Total</div>
            <div>Status</div>
            <div>Created</div>
            <div>Actions</div>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {orders.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-4 py-12 text-center dark:px-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl dark:bg-slate-800">
                  <Package className="h-5 w-5" />
                </div>
                <p className="max-w-sm text-sm text-slate-600 dark:text-slate-300">
                  No orders found.
                </p>
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order._id}
                  className="grid grid-cols-1 gap-4 px-4 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 md:grid-cols-[1.5fr_1fr_1fr_1fr_1fr] md:items-center md:px-6"
                >
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {order.user?.name || "Unknown user"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {order.user?.email || "-"}
                    </p>
                  </div>

                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    ${order.totalPrice.toFixed(2)}
                  </div>

                  <div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                        order.status === "delivered"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : order.status === "shipped"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                            : order.status === "paid"
                              ? "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300"
                              : order.status === "cancelled"
                                ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {order.status || "pending"}
                    </span>
                  </div>

                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString()
                      : "-"}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/orders/${order._id}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Link>

                    <Link
                      href={`/admin/orders/${order._id}/edit`}
                      className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-300"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleDelete(order._id)}
                      disabled={deletingId === order._id}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingId === order._id ? "Deleting..." : "Delete"}
                    </button>
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

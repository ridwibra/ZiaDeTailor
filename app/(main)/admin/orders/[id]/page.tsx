"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";

import { authClient } from "@/lib/auth-client";

type FulfillmentStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

type Order = {
  _id: string;
  total: number;
  createdAt?: string;
  payment?: {
    method?: "paypal" | "card";
    status?: string;
  };
  fulfillment?: {
    status?: FulfillmentStatus;
    trackingNumber?: string;
    carrier?: string;
    shippedAt?: string;
    deliveredAt?: string;
    customerConfirmedAt?: string;
    customerComment?: string;
  };
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  user?: {
    name?: string;
    email?: string;
  } | null;
  items?: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
    size?: { label?: string };
    color?: { name?: string };
  }>;
};

const statuses: FulfillmentStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const role = (
    session?.user as { role?: "user" | "staff" | "admin" } | undefined
  )?.role;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<FulfillmentStatus>("pending");
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  useEffect(() => {
    if (!isPending && (!session || (role !== "admin" && role !== "staff"))) {
      router.replace("/unauthorized");
    }
  }, [isPending, role, router, session]);

  useEffect(() => {
    if (isPending || !session || !params.id) {
      return;
    }

    const loadOrder = async () => {
      try {
        setLoading(true);

        const response = await fetch(`/api/orders/${params.id}`, {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load order.");
        }

        const loadedOrder = data.order as Order;

        setOrder(loadedOrder);
        setStatus(loadedOrder.fulfillment?.status || "pending");
        setCarrier(loadedOrder.fulfillment?.carrier || "");
        setTrackingNumber(loadedOrder.fulfillment?.trackingNumber || "");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to load order.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [isPending, params.id, session]);

  const saveChanges = async () => {
    try {
      setSaving(true);

      const response = await fetch(`/api/orders/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          carrier,
          trackingNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update order.");
      }

      setOrder((previous) =>
        previous
          ? {
              ...previous,
              fulfillment: data.order.fulfillment,
            }
          : previous,
      );

      toast.success("Order status updated.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update order.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (isPending || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-24">
        Loading order...
      </div>
    );
  }

  if (!order) {
    return <div className="mx-auto max-w-4xl px-4 py-24">Order not found.</div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pt-24">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-2 text-sm text-teal-600 underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to orders
      </Link>

      <h1 className="mt-4 text-2xl font-bold">Manage Order</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-xl border p-5">
            <h2 className="font-semibold">Customer</h2>
            <p className="mt-2">{order.user?.name || "Unknown user"}</p>
            <p className="text-sm text-slate-500">{order.user?.email}</p>
          </section>

          <section className="rounded-xl border p-5">
            <h2 className="font-semibold">Shipping Address</h2>
            <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              <p>{order.shippingAddress?.fullName}</p>
              <p>{order.shippingAddress?.street}</p>
              <p>
                {order.shippingAddress?.city}, {order.shippingAddress?.state}{" "}
                {order.shippingAddress?.postalCode}
              </p>
              <p>{order.shippingAddress?.country}</p>
              <p>{order.shippingAddress?.phone}</p>
            </div>
          </section>

          <section className="rounded-xl border p-5">
            <h2 className="font-semibold">Items</h2>

            <div className="mt-3 space-y-3">
              {order.items?.map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  className="flex justify-between gap-4 border-b pb-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-slate-500">
                      Size: {item.size?.label || "-"}
                      {item.color?.name ? ` · Color: ${item.color.name}` : ""}
                    </p>
                  </div>

                  <div className="text-right">
                    <p>Qty: {item.quantity}</p>
                    <p>${Number(item.total || 0).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-4 text-right text-lg font-bold">
              Total: ${Number(order.total || 0).toFixed(2)}
            </p>
          </section>

          {order.fulfillment?.customerConfirmedAt && (
            <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/30">
              <h2 className="font-semibold text-emerald-800 dark:text-emerald-200">
                Customer confirmed receipt
              </h2>

              <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                {new Date(
                  order.fulfillment.customerConfirmedAt,
                ).toLocaleString()}
              </p>

              {order.fulfillment.customerComment && (
                <p className="mt-3 whitespace-pre-wrap text-sm">
                  {order.fulfillment.customerComment}
                </p>
              )}
            </section>
          )}
        </div>

        <aside className="h-fit rounded-xl border p-5">
          <h2 className="font-semibold">Fulfillment</h2>

          <label className="mt-4 block text-sm font-medium">
            Status
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as FulfillmentStatus)
              }
              className="mt-1 w-full rounded-md border px-3 py-2"
            >
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </option>
              ))}
            </select>
          </label>

          <label className="mt-4 block text-sm font-medium">
            Carrier
            <input
              value={carrier}
              onChange={(event) => setCarrier(event.target.value)}
              placeholder="DHL, FedEx, UPS..."
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </label>

          <label className="mt-4 block text-sm font-medium">
            Tracking number
            <input
              value={trackingNumber}
              onChange={(event) => setTrackingNumber(event.target.value)}
              placeholder="Tracking number"
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </label>

          <button
            type="button"
            onClick={saveChanges}
            disabled={saving}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-black px-4 py-2 text-white disabled:opacity-60 dark:bg-white dark:text-black"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </aside>
      </div>
    </div>
  );
}

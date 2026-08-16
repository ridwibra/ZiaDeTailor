"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

type CustomerOrder = {
  _id: string;
  total: number;
  createdAt?: string;
  payment?: {
    method?: "paypal" | "card";
    status?: string;
  };
  fulfillment?: {
    status?: string;
    trackingNumber?: string;
    carrier?: string;
    deliveredAt?: string;
    customerConfirmedAt?: string;
    customerComment?: string;
  };
  items?: Array<{
    name: string;
    quantity: number;
    total: number;
  }>;
};

export default function MyOrders() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentByOrder, setCommentByOrder] = useState<Record<string, string>>(
    {},
  );
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);

        const response = await fetch("/api/orders?mine=true", {
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
  }, []);

  const confirmReceipt = async (orderId: string) => {
    try {
      setConfirmingId(orderId);

      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "confirm-receipt",
          comment: commentByOrder[orderId] || "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to confirm receipt.");
      }

      setOrders((previous) =>
        previous.map((order) =>
          order._id === orderId
            ? {
                ...order,
                fulfillment: {
                  ...order.fulfillment,
                  ...data.order.fulfillment,
                },
              }
            : order,
        ),
      );

      toast.success("Receipt confirmed. Thank you for your feedback.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to confirm receipt.",
      );
    } finally {
      setConfirmingId(null);
    }
  };

  if (loading) {
    return (
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Loading orders...
      </p>
    );
  }

  if (orders.length === 0) {
    return (
      <p className="text-sm text-slate-600 dark:text-slate-300">
        You have not placed any orders yet.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      {orders.map((order) => {
        const delivered = order.fulfillment?.status === "delivered";
        const confirmed = Boolean(order.fulfillment?.customerConfirmedAt);

        return (
          <article
            key={order._id}
            className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">Order #{order._id.slice(-8)}</p>
                <p className="text-xs text-slate-500">
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString()
                    : ""}
                </p>
              </div>

              <div className="text-right">
                <p className="font-semibold">
                  ${Number(order.total || 0).toFixed(2)}
                </p>
                <p className="text-xs capitalize text-slate-500">
                  {order.fulfillment?.status || "pending"}
                </p>
              </div>
            </div>

            <div className="mt-3 space-y-1 text-sm">
              {order.items?.map((item, index) => (
                <p key={`${item.name}-${index}`}>
                  {item.quantity} × {item.name}
                </p>
              ))}
            </div>

            {order.fulfillment?.trackingNumber && (
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                Tracking: {order.fulfillment.carrier || "Carrier"} —{" "}
                {order.fulfillment.trackingNumber}
              </p>
            )}

            {confirmed ? (
              <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm dark:bg-emerald-950/30">
                <p className="font-medium text-emerald-700 dark:text-emerald-300">
                  You confirmed receipt.
                </p>

                {order.fulfillment?.customerComment && (
                  <p className="mt-2 whitespace-pre-wrap">
                    {order.fulfillment.customerComment}
                  </p>
                )}
              </div>
            ) : delivered ? (
              <div className="mt-4">
                <label className="text-sm font-medium">
                  Confirm receipt and leave an optional comment
                  <textarea
                    value={commentByOrder[order._id] || ""}
                    onChange={(event) =>
                      setCommentByOrder((previous) => ({
                        ...previous,
                        [order._id]: event.target.value,
                      }))
                    }
                    maxLength={1000}
                    rows={3}
                    placeholder="Tell us about the delivery or product..."
                    className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500 dark:border-slate-600 dark:bg-slate-800"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => confirmReceipt(order._id)}
                  disabled={confirmingId === order._id}
                  className="mt-3 rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {confirmingId === order._id
                    ? "Confirming..."
                    : "Confirm receipt"}
                </button>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                You can confirm receipt after the order is marked delivered.
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}

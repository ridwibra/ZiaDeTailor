"use client";

import Link from "next/link";
import React, { useEffect, useReducer } from "react";
import { toast } from "sonner";

type Order = {
  _id: string;
  user?: { name?: string } | null;
  createdAt: string;
  totalPrice: number;
  isPaid: boolean;
  paidAt?: string;
  isDelivered: boolean;
  deliveredAt?: string;
};

type State = {
  loading: boolean;
  error: string;
  orders: Order[];
};

type Action =
  | { type: "FETCH_REQUEST" }
  | { type: "FETCH_SUCCESS"; payload: Order[] }
  | { type: "FETCH_FAIL"; payload: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "FETCH_REQUEST":
      return { ...state, loading: true, error: "" };
    case "FETCH_SUCCESS":
      return { ...state, loading: false, orders: action.payload, error: "" };
    case "FETCH_FAIL":
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}

export default function AdminOrderScreen() {
  const [{ loading, error, orders }, dispatch] = useReducer(reducer, {
    loading: true,
    orders: [],
    error: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        dispatch({ type: "FETCH_REQUEST" });

        const res = await fetch("/api/admin/orders");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || "Failed to load orders");
        }

        dispatch({ type: "FETCH_SUCCESS", payload: data });
      } catch (err: any) {
        const message = err.message || "Failed to load orders";
        dispatch({ type: "FETCH_FAIL", payload: message });
        toast.error(message);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="pt-24 mx-auto max-w-screen-2xl px-4 py-8">
      <div className="grid gap-6 md:grid-cols-4">
        <aside className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <ul className="space-y-3 text-sm">
            <li>
              <Link href="/admin/dashboard">Dashboard</Link>
            </li>
            <li>
              <Link href="/admin/orders" className="font-bold">
                Orders
              </Link>
            </li>
            <li>
              <Link href="/admin/products">Products</Link>
            </li>
            <li>
              <Link href="/admin/users">Users</Link>
            </li>
          </ul>
        </aside>

        <main className="md:col-span-3">
          <h1 className="mb-4 text-xl font-semibold">Admin Orders</h1>

          {loading ? (
            <div>Loading...</div>
          ) : error ? (
            <div className="rounded-md bg-red-50 px-4 py-3 text-red-600">
              {error}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
              <table className="min-w-full">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left">ID</th>
                    <th className="px-5 py-3 text-left">USER</th>
                    <th className="px-5 py-3 text-left">DATE</th>
                    <th className="px-5 py-3 text-left">TOTAL</th>
                    <th className="px-5 py-3 text-left">PAID</th>
                    <th className="px-5 py-3 text-left">DELIVERED</th>
                    <th className="px-5 py-3 text-left">ACTION</th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id} className="border-b">
                      <td className="px-5 py-4">
                        {order._id.substring(order._id.length - 4)}
                      </td>
                      <td className="px-5 py-4">
                        {order.user ? order.user.name : "DELETED USER"}
                      </td>
                      <td className="px-5 py-4">
                        {order.createdAt.substring(0, 10)}
                      </td>
                      <td className="px-5 py-4">
                        ${order.totalPrice.toFixed(2)}
                      </td>
                      <td className="px-5 py-4">
                        {order.isPaid
                          ? order.paidAt?.substring(0, 10)
                          : "not paid"}
                      </td>
                      <td className="px-5 py-4">
                        {order.isDelivered
                          ? order.deliveredAt?.substring(0, 10)
                          : "not delivered"}
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/order/${order._id}`}
                          className="text-blue-600 underline"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

AdminOrderScreen.auth = { adminOnly: true };

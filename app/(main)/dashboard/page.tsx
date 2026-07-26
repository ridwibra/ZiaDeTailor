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
import React, { useEffect, useReducer } from "react";
import { toast } from "sonner";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

export const options = {
  responsive: true,
  plugins: {
    legend: {
      position: "top" as const,
    },
  },
};

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
      return { ...state, loading: true, error: "" };
    case "FETCH_SUCCESS":
      return { ...state, loading: false, summary: action.payload, error: "" };
    case "FETCH_FAIL":
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}

export default function AdminDashboardScreen() {
  const [{ loading, error, summary }, dispatch] = useReducer(reducer, {
    loading: true,
    summary: { salesData: [] },
    error: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        dispatch({ type: "FETCH_REQUEST" });

        const res = await fetch("/api/admin/summary");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || "Failed to load summary");
        }

        dispatch({ type: "FETCH_SUCCESS", payload: data });
      } catch (err: any) {
        dispatch({
          type: "FETCH_FAIL",
          payload: err.message || "Failed to load summary",
        });
        toast.error(err.message || "Failed to load summary");
      }
    };

    fetchData();
  }, []);

  const data = {
    labels: summary.salesData.map((x) => x._id),
    datasets: [
      {
        label: "Sales",
        backgroundColor: "rgba(162, 222, 208, 1)",
        data: summary.salesData.map((x) => x.totalSales),
      },
    ],
  };

  return (
    <div className="mx-auto pt-24 max-w-screen-2xl px-4 py-8">
      <div className="grid gap-6 md:grid-cols-4">
        <aside className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <ul className="space-y-3 text-sm">
            <li>
              <Link href="/dashboard" className="font-bold">
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/dashboard/orders">Orders</Link>
            </li>
            <li>
              <Link href="/dashboard/products">Products</Link>
            </li>
            <li>
              <Link href="/dashboard/users">Users</Link>
            </li>
          </ul>
        </aside>

        <main className="md:col-span-3">
          <h1 className="mb-4 text-xl font-semibold">Admin Dashboard</h1>

          {loading ? (
            <div>Loading...</div>
          ) : error ? (
            <div className="rounded-md bg-red-50 px-4 py-3 text-red-600">
              {error}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <p className="text-3xl">${summary.ordersPrice ?? 0}</p>
                  <p className="text-sm text-gray-500">Sales</p>
                  <Link href="/admin/orders" className="text-sm underline">
                    View sales
                  </Link>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <p className="text-3xl">{summary.ordersCount ?? 0}</p>
                  <p className="text-sm text-gray-500">Orders</p>
                  <Link href="/admin/orders" className="text-sm underline">
                    View orders
                  </Link>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <p className="text-3xl">{summary.productsCount ?? 0}</p>
                  <p className="text-sm text-gray-500">Products</p>
                  <Link href="/admin/products" className="text-sm underline">
                    View products
                  </Link>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <p className="text-3xl">{summary.usersCount ?? 0}</p>
                  <p className="text-sm text-gray-500">Users</p>
                  <Link href="/admin/users" className="text-sm underline">
                    View users
                  </Link>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-xl font-semibold">Sales Report</h2>
                <Bar options={options} data={data} />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

AdminDashboardScreen.auth = { adminOnly: true };

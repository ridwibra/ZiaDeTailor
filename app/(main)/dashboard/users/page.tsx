"use client";

import Link from "next/link";
import React, { useEffect, useReducer } from "react";
import { toast } from "sonner";

type User = {
  _id: string;
  name: string;
  email: string;
  isAdmin: boolean;
};

type State = {
  loading: boolean;
  error: string;
  users: User[];
  successDelete: boolean;
  loadingDelete: boolean;
};

type Action =
  | { type: "FETCH_REQUEST" }
  | { type: "FETCH_SUCCESS"; payload: User[] }
  | { type: "FETCH_FAIL"; payload: string }
  | { type: "DELETE_REQUEST" }
  | { type: "DELETE_SUCCESS" }
  | { type: "DELETE_FAIL" }
  | { type: "DELETE_RESET" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "FETCH_REQUEST":
      return { ...state, loading: true, error: "" };
    case "FETCH_SUCCESS":
      return { ...state, loading: false, users: action.payload, error: "" };
    case "FETCH_FAIL":
      return { ...state, loading: false, error: action.payload };
    case "DELETE_REQUEST":
      return { ...state, loadingDelete: true };
    case "DELETE_SUCCESS":
      return { ...state, loadingDelete: false, successDelete: true };
    case "DELETE_FAIL":
      return { ...state, loadingDelete: false };
    case "DELETE_RESET":
      return { ...state, loadingDelete: false, successDelete: false };
    default:
      return state;
  }
}

export default function AdminUsersScreen() {
  const [{ loading, error, users, successDelete, loadingDelete }, dispatch] =
    useReducer(reducer, {
      loading: true,
      error: "",
      users: [],
      successDelete: false,
      loadingDelete: false,
    });

  useEffect(() => {
    const fetchData = async () => {
      try {
        dispatch({ type: "FETCH_REQUEST" });

        const res = await fetch("/api/admin/users");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || "Failed to load users");
        }

        dispatch({ type: "FETCH_SUCCESS", payload: data });
      } catch (err: any) {
        dispatch({
          type: "FETCH_FAIL",
          payload: err.message || "Failed to load users",
        });
      }
    };

    if (successDelete) {
      dispatch({ type: "DELETE_RESET" });
    } else {
      fetchData();
    }
  }, [successDelete]);

  const deleteHandler = async (userId: string) => {
    if (!window.confirm("Are you sure?")) return;

    try {
      dispatch({ type: "DELETE_REQUEST" });

      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to delete user");
      }

      dispatch({ type: "DELETE_SUCCESS" });
      toast.success("User deleted successfully");
    } catch (err: any) {
      dispatch({ type: "DELETE_FAIL" });
      toast.error(err.message || "Failed to delete user");
    }
  };

  return (
    <div className="pt-24 mx-auto max-w-screen-2xl px-4 py-8">
      <div className="grid gap-6 md:grid-cols-4">
        <aside className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <ul className="space-y-3 text-sm">
            <li>
              <Link href="/admin/dashboard">Dashboard</Link>
            </li>
            <li>
              <Link href="/admin/orders">Orders</Link>
            </li>
            <li>
              <Link href="/admin/products">Products</Link>
            </li>
            <li>
              <Link href="/admin/users" className="font-bold">
                Users
              </Link>
            </li>
          </ul>
        </aside>

        <main className="md:col-span-3">
          <h1 className="mb-4 text-xl font-semibold">Users</h1>

          {loadingDelete && (
            <div className="mb-2 text-sm text-gray-500">Deleting...</div>
          )}

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
                    <th className="px-5 py-3 text-left">NAME</th>
                    <th className="px-5 py-3 text-left">EMAIL</th>
                    <th className="px-5 py-3 text-left">ADMIN</th>
                    <th className="px-5 py-3 text-left">ACTIONS</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="border-b">
                      <td className="px-5 py-4">
                        {user._id.substring(user._id.length - 4)}
                      </td>
                      <td className="px-5 py-4">{user.name}</td>
                      <td className="px-5 py-4">{user.email}</td>
                      <td className="px-5 py-4">
                        {user.isAdmin ? "YES" : "NO"}
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/user/${user._id}`}
                          className="inline-block rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          className="ml-2 inline-block rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
                          onClick={() => deleteHandler(user._id)}
                        >
                          Delete
                        </button>
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

AdminUsersScreen.auth = { adminOnly: true };

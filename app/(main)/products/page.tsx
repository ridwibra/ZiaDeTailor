"use client";

import Link from "next/link";
import React, { useEffect, useReducer } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Product = {
  _id: string;
  name: string;
  price: number;
  category: string;
  countInStock: number;
  rating: number;
};

type State = {
  loading: boolean;
  error: string;
  products: Product[];
  loadingCreate: boolean;
  loadingDelete: boolean;
  successDelete: boolean;
};

type Action =
  | { type: "FETCH_REQUEST" }
  | { type: "FETCH_SUCCESS"; payload: Product[] }
  | { type: "FETCH_FAIL"; payload: string }
  | { type: "CREATE_REQUEST" }
  | { type: "CREATE_SUCCESS" }
  | { type: "CREATE_FAIL" }
  | { type: "DELETE_REQUEST" }
  | { type: "DELETE_SUCCESS" }
  | { type: "DELETE_FAIL" }
  | { type: "DELETE_RESET" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "FETCH_REQUEST":
      return { ...state, loading: true, error: "" };
    case "FETCH_SUCCESS":
      return { ...state, loading: false, products: action.payload, error: "" };
    case "FETCH_FAIL":
      return { ...state, loading: false, error: action.payload };
    case "CREATE_REQUEST":
      return { ...state, loadingCreate: true };
    case "CREATE_SUCCESS":
      return { ...state, loadingCreate: false };
    case "CREATE_FAIL":
      return { ...state, loadingCreate: false };
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

export default function AdminProdcutsScreen() {
  const router = useRouter();

  const [
    { loading, error, products, loadingCreate, successDelete, loadingDelete },
    dispatch,
  ] = useReducer(reducer, {
    loading: true,
    products: [],
    error: "",
    loadingCreate: false,
    loadingDelete: false,
    successDelete: false,
  });

  const createHandler = async () => {
    if (!window.confirm("Are you sure?")) return;

    try {
      dispatch({ type: "CREATE_REQUEST" });

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to create product");
      }

      dispatch({ type: "CREATE_SUCCESS" });
      toast.success("Product created successfully");
      router.push(`/admin/product/${data.product._id}`);
    } catch (err: any) {
      dispatch({ type: "CREATE_FAIL" });
      toast.error(err.message || "Failed to create product");
    }
  };

  const deleteHandler = async (productId: string) => {
    if (!window.confirm("Are you sure?")) return;

    try {
      dispatch({ type: "DELETE_REQUEST" });

      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to delete product");
      }

      dispatch({ type: "DELETE_SUCCESS" });
      toast.success("Product deleted successfully");
    } catch (err: any) {
      dispatch({ type: "DELETE_FAIL" });
      toast.error(err.message || "Failed to delete product");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        dispatch({ type: "FETCH_REQUEST" });

        const res = await fetch("/api/admin/products");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || "Failed to load products");
        }

        dispatch({ type: "FETCH_SUCCESS", payload: data });
      } catch (err: any) {
        dispatch({
          type: "FETCH_FAIL",
          payload: err.message || "Failed to load products",
        });
      }
    };

    if (successDelete) {
      dispatch({ type: "DELETE_RESET" });
    } else {
      fetchData();
    }
  }, [successDelete]);

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
              <Link href="/admin/products" className="font-bold">
                Products
              </Link>
            </li>
            <li>
              <Link href="/admin/users">Users</Link>
            </li>
          </ul>
        </aside>

        <main className="md:col-span-3">
          <div className="flex items-center justify-between">
            <h1 className="mb-4 text-xl font-semibold">Products</h1>
            {loadingDelete && (
              <div className="text-sm text-gray-500">Deleting item...</div>
            )}
            <button
              disabled={loadingCreate}
              onClick={createHandler}
              className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingCreate ? "Loading" : "Create"}
            </button>
          </div>

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
                    <th className="px-5 py-3 text-left">PRICE</th>
                    <th className="px-5 py-3 text-left">CATEGORY</th>
                    <th className="px-5 py-3 text-left">COUNT</th>
                    <th className="px-5 py-3 text-left">RATING</th>
                    <th className="px-5 py-3 text-left">ACTIONS</th>
                  </tr>
                </thead>

                <tbody>
                  {products.map((product) => (
                    <tr key={product._id} className="border-b">
                      <td className="px-5 py-4">
                        {product._id.substring(product._id.length - 4)}
                      </td>
                      <td className="px-5 py-4">{product.name}</td>
                      <td className="px-5 py-4">${product.price.toFixed(2)}</td>
                      <td className="px-5 py-4">{product.category}</td>
                      <td className="px-5 py-4">{product.countInStock}</td>
                      <td className="px-5 py-4">{product.rating}</td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/product/${product._id}`}
                          className="inline-block rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => deleteHandler(product._id)}
                          className="ml-2 inline-block rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
                          type="button"
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

AdminProdcutsScreen.auth = { adminOnly: true };

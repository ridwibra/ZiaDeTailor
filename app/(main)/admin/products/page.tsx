"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Package } from "lucide-react";
import { deleteMedia } from "@/utils/files/requests";

type ProductItem = {
  _id: string;
  name: string;
  slug: string;
  category?: string;
  subcategory?: string;
  countInStock?: number;
  images?: { url: string; public_id: string }[];
  createdAt?: string;
};

export default function AdminProductPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);

        const res = await fetch("/api/product", {
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load products");
        }

        setProducts(data.products || []);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to load products",
        );
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const handleDelete = async (productId: string) => {
    const confirmed = window.confirm("Delete this product?");
    if (!confirmed) return;

    setDeletingId(productId);

    try {
      // 1) Load product to get images
      const resProduct = await fetch(`/api/product/${productId}`, {
        cache: "no-store",
      });

      const dataProduct = await resProduct.json();

      if (!resProduct.ok) {
        throw new Error(dataProduct.error || "Failed to load product");
      }

      const product = dataProduct.product;

      // 2) Delete all images from Cloudinary on the frontend
      const images = product.images || [];

      for (const img of images) {
        if (img?.public_id) {
          try {
            await deleteMedia(img.public_id);
          } catch (cloudErr) {
            console.error(
              "Cloudinary delete failed for:",
              img.public_id,
              cloudErr,
            );
          }
        }
      }

      const resDelete = await fetch(`/api/product/${productId}`, {
        method: "DELETE",
      });

      const dataDelete = await resDelete.json();

      if (!resDelete.ok) {
        throw new Error(dataDelete.error || "Failed to delete product");
      }

      setProducts((prev) => prev.filter((p) => p._id !== productId));
      toast.success("Product deleted");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete product",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 px-4 py-6 pt-24 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-3xl border border-white/50 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 sm:p-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-sm font-medium text-teal-600 transition hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
            >
              ← Back to Admin
            </Link>

            <p className="mt-3 text-sm font-semibold uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400">
              Admin Panel
            </p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
              Products
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Manage your store products.
            </p>
          </div>

          <Link
            href="/products/newproduct"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-600"
          >
            <Plus className="h-4 w-4" />
            Add New Product
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="hidden border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr] md:px-6">
            <div>Product</div>
            <div>Category</div>
            <div>Subcategory</div>
            <div>Stock</div>
            <div>Actions</div>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {loading ? (
              <div className="flex items-center justify-center px-4 py-12 text-slate-600 dark:text-slate-300">
                Loading products...
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-4 py-12 text-center dark:px-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl dark:bg-slate-800">
                  <Package className="h-5 w-5" />
                </div>
                <p className="max-w-sm text-sm text-slate-600 dark:text-slate-300">
                  No products found.
                </p>
              </div>
            ) : (
              products.map((product) => (
                <div
                  key={product._id}
                  className="grid grid-cols-1 gap-4 px-4 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 md:grid-cols-[2fr_1fr_1fr_1fr_1fr] md:items-center md:px-6"
                >
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {product.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {product.slug}
                    </p>
                  </div>

                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    {product.category || "-"}
                  </div>

                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    {product.subcategory || "-"}
                  </div>

                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    {product.countInStock ?? 0}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/products/${product.slug}/editproduct`}
                      className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-300"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleDelete(product._id)}
                      disabled={deletingId === product._id}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingId === product._id ? "Deleting..." : "Delete"}
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

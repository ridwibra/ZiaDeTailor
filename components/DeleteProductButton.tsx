// components/DeleteProductButton.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { deleteMedia } from "@/utils/files/requests";
import { Trash2 } from "lucide-react";

type Role = "admin" | "staff" | "user";

export default function DeleteProductButton({
  productId,
  role,
}: {
  productId: string;
  role?: Role;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDeleteProduct = async () => {
    if (!confirm("Permanently delete this product? This cannot be undone.")) {
      return;
    }

    if (role !== "admin" && role !== "staff") {
      toast.error("Only admin or staff can delete products.");
      return;
    }

    setDeleting(true);
    try {
      // Use relative URL here (no BASE_URL)
      const res = await fetch(`/api/product/${productId}`);
      if (!res.ok) throw new Error("Failed to load product");
      const { product: prod } = await res.json();

      if (prod?.images?.length) {
        await Promise.all(
          prod.images.map((img: any) => deleteMedia(img.public_id)),
        );
      }

      // Use relative URL here too
      const deleteRes = await fetch(`/api/product/${productId}`, {
        method: "DELETE",
      });

      if (!deleteRes.ok) {
        throw new Error("Failed to delete product");
      }

      toast.success("Product and all images deleted.");
      router.push("/");
    } catch (err: any) {
      toast.error(err.message || "Deletion failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleDeleteProduct();
      }}
    >
      <button
        type="submit"
        disabled={deleting}
        className="px-3 py-1.5 rounded-md text-sm bg-red-600 text-white hover:bg-red-700 transition flex items-center gap-2 disabled:opacity-50"
      >
        <Trash2 className="w-4 h-4" />
        {deleting ? "Deleting..." : "Delete"}
      </button>
    </form>
  );
}

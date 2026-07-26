"use client";

import { useEffect, useState, ChangeEvent } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import dataURItoBlob from "@/utils/files/dataUrlToBlob";
import { deleteMedia, uploadMedia } from "@/utils/files/requests";
import { CATEGORY_MAP, CategoryKey, Subcategory } from "@/utils/categoryMap";
import { authClient } from "@/lib/auth-client";
import { UserType } from "@/utils/types";

type GalleryImage = {
  url: string;
  public_id?: string;
  isNew?: boolean;
};

export default function EditProductPage() {
  const router = useRouter();
  const { slug } = useParams();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [productId, setProductId] = useState<string>("");

  const [name, setName] = useState("");
  const [slugValue, setSlugValue] = useState("");
  const [description, setDescription] = useState("");

  const [category, setCategory] = useState<CategoryKey | "">("");
  const [subcategory, setSubcategory] = useState<string>("");
  const [countInStock, setCountInStock] = useState<number>(0);
  const [tags, setTags] = useState<string[]>([]);
  const [sizes, setSizes] = useState<{ size: string; price: number }[]>([]);
  const [colors, setColors] = useState<{ name: string; hex: string }[]>([]);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [authorized, setAuthorized] = useState(false);
  useEffect(() => {
    async function loadProduct() {
      try {
        console.log("EDIT PAGE slug param:", slug);
        const { data: session } = await authClient.getSession();
        const user = session?.user as UserType | undefined;
        const role = user?.role;

        if (role !== "admin" && role !== "staff") {
          toast.error("Only admin or staff can edit products.");
          router.push("/admin/products");
          return;
        }

        setAuthorized(true);

        const resAll = await fetch(`/api/product`, { cache: "no-store" });
        const dataAll = await resAll.json();

        if (!resAll.ok || !dataAll.products) {
          toast.error("Failed to load product list");
          return;
        }

        const productBySlug = dataAll.products.find(
          (p: any) => p.slug === slug,
        );

        if (!productBySlug) {
          toast.error("Product not found");
          router.push("/admin/products");
          return;
        }

        const id = productBySlug._id;
        setProductId(id);

        const res = await fetch(`/api/product/${id}`);
        const data = await res.json();

        if (!res.ok) {
          toast.error("Failed to load product");
          return;
        }

        const p = data.product;

        setName(p.name || "");
        setSlugValue(p.slug || "");
        setDescription(p.description || "");
        setCategory(p.category || "");
        setSubcategory(p.subcategory || "");
        setCountInStock(p.countInStock ?? 0);
        setTags(p.tags || []);
        setSizes(p.sizes || []);
        setColors(p.colors || []);
        setGallery(
          (p.images || []).map((img: any) => ({
            url: img.url,
            public_id: img.public_id || "",
            isNew: false,
          })),
        );
      } catch (err) {
        toast.error("Failed to load product");
      } finally {
        setInitialLoading(false);
      }
    }

    loadProduct();
  }, [slug, router]);
  const generateSlug = (value: string) => {
    const s = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setSlugValue(s);
  };

  const addColor = () => {
    setColors((prev) => [...prev, { name: "", hex: "#000000" }]);
  };

  const updateColor = (
    index: number,
    updated: { name: string; hex: string },
  ) => {
    setColors((prev) => prev.map((c, i) => (i === index ? updated : c)));
  };

  const removeColor = (index: number) => {
    setColors((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGalleryUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (gallery.length + files.length > 5) {
      toast.error("You can upload a maximum of 5 images.");
      return;
    }

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`"${file.name}" is not a supported format.`);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(`"${file.name}" is larger than 5MB.`);
        return;
      }
    }

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result;
        if (!result) return;

        setGallery((prev) => [
          ...prev,
          {
            url: result as string,
            isNew: true,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeGalleryImage = (index: number) => {
    setGallery((prev) => {
      const img = prev[index];
      if (!img.isNew && img.public_id) {
        setRemovedImages((r) => [...r, img.public_id!]);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const addSizeRow = () => {
    setSizes((prev) => [...prev, { size: "", price: 0 }]);
  };

  const updateSizeRow = (
    index: number,
    field: "size" | "price",
    value: string | number,
  ) => {
    setSizes((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: field === "price" ? Number(value) : String(value),
      };
      return updated;
    });
  };

  const updateProduct = async () => {
    const cleanTags = tags.map((tag) => tag.trim()).filter(Boolean);
    const cleanSizes = sizes.filter((row) => row.size.trim());
    const cleanColors = colors.filter((color) => color.name.trim());

    if (
      !name.trim() ||
      !slugValue.trim() ||
      !description.trim() ||
      !category ||
      !subcategory ||
      gallery.length === 0 ||
      cleanSizes.length === 0
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    if (countInStock < 0) {
      toast.error("Stock cannot be negative");
      return;
    }

    setLoading(true);

    const uploadedNewPublicIds: string[] = [];
    const deletedOldPublicIds = [...removedImages];

    try {
      const finalGallery: { url: string; public_id: string }[] = [];

      for (const img of gallery) {
        if (img.isNew) {
          const blob = dataURItoBlob(img.url);
          if (!blob) throw new Error("Failed to process image");

          const file = new File([blob], "gallery", { type: blob.type });
          const uploaded = await uploadMedia(file, "products");

          uploadedNewPublicIds.push(uploaded[0].public_id);

          finalGallery.push({
            url: uploaded[0].url,
            public_id: uploaded[0].public_id,
          });
        } else {
          finalGallery.push({
            url: img.url,
            public_id: img.public_id!,
          });
        }
      }

      const res = await fetch(`/api/product/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slugValue.trim(),
          description: description.trim(),
          images: finalGallery,
          category,
          subcategory,
          tags: cleanTags,
          sizes: cleanSizes,
          colors: cleanColors,
          countInStock,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || data.message || "Failed to update product",
        );
      }

      for (const public_id of deletedOldPublicIds) {
        try {
          await deleteMedia(public_id);
        } catch (err) {
          console.error("Failed to delete old Cloudinary image:", public_id);
        }
      }

      toast.success("Product updated successfully!");
      router.push(`/products/${slugValue}`);
    } catch (err: any) {
      for (const public_id of uploadedNewPublicIds) {
        try {
          await deleteMedia(public_id);
        } catch (cleanupErr) {
          console.error("Failed to cleanup uploaded image:", public_id);
        }
      }

      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 pt-32 text-lg font-medium text-slate-700 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 dark:text-slate-200">
        <div className="rounded-2xl border border-slate-200 bg-white/80 px-6 py-4 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
          Loading product...
        </div>
      </div>
    );
  }

  if (!authorized && !initialLoading) {
    return null;
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 px-4 py-6 pt-24 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-white/50 bg-white/80 shadow-xl backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
        <div className="border-b border-slate-200/80 px-6 py-8 dark:border-slate-800 sm:px-8">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-600 dark:text-teal-400">
              Product Management
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
              Edit Product
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Update details, gallery, sizes, colors, and categorization.
            </p>
          </div>
        </div>

        <div className="space-y-8 px-6 py-8 sm:px-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                Name <span className="text-red-600">*</span>
              </label>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-900"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  generateSlug(e.target.value);
                }}
                placeholder="Product name"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                Slug <span className="text-red-600">*</span>
              </label>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-900"
                value={slugValue}
                onChange={(e) => setSlugValue(e.target.value)}
                placeholder="product-name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
              Description <span className="text-red-600">*</span>
            </label>
            <textarea
              className="h-44 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-900"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write a detailed product description..."
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                Category <span className="text-red-600">*</span>
              </label>
              <select
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900"
                value={category}
                onChange={(e) => {
                  const selected = e.target.value as CategoryKey | "";
                  setCategory(selected);
                  setSubcategory("");
                }}
              >
                <option value="">Select category</option>
                {Object.keys(CATEGORY_MAP).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                Subcategory <span className="text-red-600">*</span>
              </label>
              <select
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                disabled={!category}
              >
                <option value="">Select subcategory</option>
                {category &&
                  CATEGORY_MAP[category].map((sub: Subcategory) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
              Tags{" "}
              <span className="font-normal text-slate-500">(optional)</span>
            </label>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-900"
              value={tags.join(", ")}
              onChange={(e) =>
                setTags(
                  e.target.value
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean),
                )
              }
              placeholder="summer, cotton, new-arrival"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
              Count In Stock
            </label>
            <input
              type="number"
              min={0}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-900"
              value={countInStock}
              onChange={(e) => setCountInStock(Number(e.target.value))}
            />
          </div>
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40 sm:p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Sizes & Prices
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Update the available sizes and pricing.
                </p>
              </div>
              <button
                type="button"
                onClick={addSizeRow}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black dark:bg-slate-700 dark:hover:bg-slate-600"
              >
                + Add Size
              </button>
            </div>

            <div className="space-y-3">
              {sizes.map((row, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 sm:flex-row sm:items-end"
                >
                  <div className="w-full flex-1 space-y-2">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Size <span className="text-red-600">*</span>
                    </label>
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900"
                      placeholder="S, M, L, XL"
                      value={row.size}
                      onChange={(e) =>
                        updateSizeRow(index, "size", e.target.value)
                      }
                    />
                  </div>

                  <div className="w-full flex-1 space-y-2">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Price <span className="text-red-600">*</span>
                    </label>
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900"
                      placeholder="0"
                      type="number"
                      value={row.price}
                      onChange={(e) =>
                        updateSizeRow(index, "price", Number(e.target.value))
                      }
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSizes((prev) => prev.filter((_, i) => i !== index))
                    }
                    className="inline-flex h-11 w-11 items-center justify-center self-start rounded-full text-xl font-bold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 sm:self-auto"
                    aria-label="Remove size row"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40 sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Gallery Images
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Max 5 images, 5MB each. JPG, PNG, WEBP only.
                </p>
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {gallery.length}/5 uploaded
              </span>
            </div>

            <label className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white px-4 py-8 text-center transition hover:border-teal-400 hover:bg-teal-50/40 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-teal-500 dark:hover:bg-slate-900">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Click to upload images
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Upload new images to replace or extend the current gallery.
              </span>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleGalleryUpload}
              />
            </label>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {gallery.map((img, index) => (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <Image
                    src={img.url}
                    alt={`Gallery image ${index + 1}`}
                    width={400}
                    height={300}
                    className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(index)}
                    className="absolute right-2 top-2 rounded-full bg-red-600 p-1.5 text-white opacity-0 shadow-lg transition group-hover:opacity-100"
                    aria-label="Remove image"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40 sm:p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Colors
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Optional color variants for the product.
                </p>
              </div>
              <button
                type="button"
                onClick={addColor}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black dark:bg-slate-700 dark:hover:bg-slate-600"
              >
                + Add Color
              </button>
            </div>

            <div className="space-y-3">
              {colors.map((color, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 sm:flex-row sm:items-end"
                >
                  <div className="w-full flex-1 space-y-2">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Color Name
                    </label>
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900"
                      placeholder="Navy Blue, Black, White"
                      value={color.name}
                      onChange={(e) =>
                        updateColor(index, { ...color, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="w-full flex-1 space-y-2">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Color
                    </label>
                    <input
                      type="color"
                      className="h-11 w-full cursor-pointer rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900"
                      value={color.hex}
                      onChange={(e) =>
                        updateColor(index, { ...color, hex: e.target.value })
                      }
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeColor(index)}
                    className="inline-flex h-11 w-11 items-center justify-center self-start rounded-full text-xl font-bold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 sm:self-auto"
                    aria-label="Remove color"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={updateProduct}
            disabled={loading}
            className="w-full rounded-2xl bg-teal-500 py-3.5 text-lg font-semibold text-white shadow-lg shadow-teal-500/20 transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Product"}
          </button>
        </div>
      </div>
    </div>
  );
}

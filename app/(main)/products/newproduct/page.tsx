"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import dataURItoBlob from "@/utils/files/dataUrlToBlob";
import { uploadMedia } from "@/utils/files/requests";
import { CATEGORY_MAP, CategoryKey, Subcategory } from "@/utils/categoryMap";

type GalleryImage = {
  url: string;
  public_id?: string;
  isNew?: boolean;
};

export default function CreatePostPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<CategoryKey | "">("");
  const [subcategory, setSubcategory] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [countInStock, setCountInStock] = useState<number>(0);
  const [sizes, setSizes] = useState<{ size: string; price: number }[]>([
    { size: "", price: 0 },
  ]);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [colors, setColors] = useState<{ name: string; hex: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const generateSlug = (value: string) => {
    const s = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setSlug(s);
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
        toast.error(
          `"${file.name}" is not a supported format. Allowed: JPG, PNG, WEBP.`,
        );
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(`"${file.name}" is larger than 5MB.`);
        return;
      }
    }

    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > 25 * 1024 * 1024) {
      toast.error("Total image size must not exceed 25MB.");
      return;
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
    setGallery((prev) => prev.filter((_, i) => i !== index));
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

  const createPost = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const cleanTags = tags.map((tag) => tag.trim()).filter(Boolean);
    const cleanSizes = sizes.filter((row) => row.size.trim());
    const cleanColors = colors.filter((color) => color.name.trim());

    if (
      !name.trim() ||
      !slug.trim() ||
      !description.trim() ||
      !category ||
      !subcategory ||
      gallery.length === 0
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    if (countInStock < 0) {
      toast.error("Stock cannot be negative");
      return;
    }

    if (cleanSizes.length === 0) {
      toast.error("Please add at least one size");
      return;
    }

    setLoading(true);

    try {
      const finalGallery: { url: string; public_id: string }[] = [];

      for (const img of gallery) {
        if (img.isNew) {
          const blob = dataURItoBlob(img.url);
          if (!blob) throw new Error("Failed to process image");

          const file = new File([blob], "gallery", { type: blob.type });
          const uploaded = await uploadMedia(file, "products");

          finalGallery.push({
            url: uploaded[0].url,
            public_id: uploaded[0].public_id,
          });
        }
      }

      const res = await fetch("/api/product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
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
          data.error || data.message || "Failed to create product",
        );
      }

      toast.success("Product created successfully!");
      router.push("/admin/products");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 px-4 py-6 pt-24 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-3xl border border-white/50 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 sm:p-8">
        <div className="mb-8 text-center">
          <div className="mb-6 mt-2 flex flex-col items-center z-10">
            <Image
              src="/images/logo.jpeg"
              alt="Logo"
              width={120}
              height={120}
              className="opacity-95 drop-shadow-xl"
            />
          </div>
          <h1 className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
            Add New Product
          </h1>
        </div>

        <form onSubmit={createPost} className="space-y-8">
          <div>
            <label className="mb-1 block font-semibold text-slate-800 dark:text-slate-200">
              Name
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                generateSlug(e.target.value);
              }}
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-slate-800 dark:text-slate-200">
              Slug
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-slate-800 dark:text-slate-200">
              Description
            </label>
            <textarea
              className="h-40 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-slate-800 dark:text-slate-200">
              Category
            </label>
            <select
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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

          <div>
            <label className="mb-1 block font-semibold text-slate-800 dark:text-slate-200">
              Subcategory
            </label>
            <select
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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

          <div>
            <label className="mb-1 block font-semibold text-slate-800 dark:text-slate-200">
              Tags (optional)
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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

          <div>
            <label className="mb-1 block font-semibold text-slate-800 dark:text-slate-200">
              Count In Stock
            </label>
            <input
              type="number"
              min={0}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={countInStock}
              onChange={(e) => setCountInStock(Number(e.target.value))}
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
              Sizes & Prices
            </label>

            <div className="space-y-3">
              {sizes.map((row, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60 sm:flex-row"
                >
                  <div className="w-full flex-1">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Size
                    </label>
                    <input
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      placeholder="S, M, L, XL"
                      value={row.size}
                      onChange={(e) =>
                        updateSizeRow(index, "size", e.target.value)
                      }
                    />
                  </div>

                  <div className="w-full flex-1">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Price
                    </label>
                    <input
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      placeholder="Price"
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
                    className="rounded-full px-3 py-2 text-xl font-bold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addSizeRow}
              className="rounded-xl bg-slate-900 px-4 py-2.5 font-semibold text-white transition hover:bg-black dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              + Add Size
            </button>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
              Gallery Images <span className="text-red-600">*</span>{" "}
              <span className="font-normal text-slate-500 dark:text-slate-400">
                (max 5 images, 5MB each)
              </span>
            </label>

            <label className="flex w-full cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:bg-slate-800">
              <span className="font-medium text-slate-600 dark:text-slate-300">
                Click to upload images
              </span>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleGalleryUpload}
              />
            </label>

            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {gallery.map((img, index) => (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
                >
                  <Image
                    src={img.url}
                    alt={`Gallery image ${index + 1}`}
                    width={400}
                    height={300}
                    className="h-32 w-full object-cover transition-transform group-hover:scale-105"
                  />

                  <button
                    type="button"
                    onClick={() => removeGalleryImage(index)}
                    className="absolute right-2 top-2 rounded-full bg-red-600 p-1.5 text-white opacity-0 transition group-hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
              Colors (optional)
            </label>

            <div className="space-y-3">
              {colors.map((color, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60 sm:flex-row"
                >
                  <div className="w-full flex-1">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Color Name
                    </label>
                    <input
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      placeholder="Navy Blue, Black, White"
                      value={color.name}
                      onChange={(e) =>
                        updateColor(index, { ...color, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="w-full flex-1">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Color
                    </label>
                    <input
                      type="color"
                      className="mt-1 h-10 w-full cursor-pointer rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900"
                      value={color.hex}
                      onChange={(e) =>
                        updateColor(index, { ...color, hex: e.target.value })
                      }
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeColor(index)}
                    className="rounded-full px-3 py-2 text-xl font-bold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addColor}
              className="rounded-xl bg-slate-900 px-4 py-2.5 font-semibold text-white transition hover:bg-black dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              + Add Color
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-teal-500 py-3 text-lg font-semibold text-white transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Product"}
          </button>
        </form>
      </div>
    </div>
  );
}

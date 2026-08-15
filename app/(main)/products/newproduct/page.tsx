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

type FieldErrors = {
  name?: string;
  slug?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  countInStock?: string;
  sizes?: string;
  gallery?: string;
  colors?: string;
  general?: string;
};

type ApiErrorResponse = {
  field?: string;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
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
  const [errors, setErrors] = useState<FieldErrors>({});

  const generateSlug = (value: string) => {
    const generatedSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    setSlug(generatedSlug);
  };

  const clearFieldError = (field: keyof FieldErrors) => {
    setErrors((previous) => {
      if (!previous[field]) return previous;

      const nextErrors = { ...previous };
      delete nextErrors[field];

      return nextErrors;
    });
  };

  const inputClass = (field: keyof FieldErrors) =>
    `w-full rounded-xl border bg-slate-50 p-3 text-slate-900 outline-none transition dark:bg-slate-800 dark:text-white ${
      errors[field]
        ? "border-red-500 ring-2 ring-red-500/20 focus:border-red-500 focus:ring-2 focus:ring-red-500/25 dark:border-red-500"
        : "border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700"
    }`;

  const sectionClass = (field: keyof FieldErrors) =>
    `space-y-3 rounded-2xl border p-4 ${
      errors[field]
        ? "border-red-500 bg-red-50/50 ring-2 ring-red-500/10 dark:border-red-500 dark:bg-red-950/20"
        : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60"
    }`;

  const mapApiErrors = (fieldErrors: Record<string, string>): FieldErrors => {
    const mappedErrors: FieldErrors = {};

    for (const [field, message] of Object.entries(fieldErrors)) {
      const frontendField = field === "images" ? "gallery" : field;

      if (
        frontendField === "name" ||
        frontendField === "slug" ||
        frontendField === "description" ||
        frontendField === "category" ||
        frontendField === "subcategory" ||
        frontendField === "countInStock" ||
        frontendField === "sizes" ||
        frontendField === "gallery" ||
        frontendField === "colors" ||
        frontendField === "general"
      ) {
        mappedErrors[frontendField] = message;
      }
    }

    return mappedErrors;
  };

  const setApiError = (data: ApiErrorResponse) => {
    if (data.fieldErrors && typeof data.fieldErrors === "object") {
      setErrors(mapApiErrors(data.fieldErrors));
      return;
    }

    if (data.field && data.field !== "general") {
      const field = data.field === "images" ? "gallery" : data.field;

      if (
        field === "name" ||
        field === "slug" ||
        field === "description" ||
        field === "category" ||
        field === "subcategory" ||
        field === "countInStock" ||
        field === "sizes" ||
        field === "gallery" ||
        field === "colors"
      ) {
        setErrors({
          [field]: data.message || data.error || "Please correct this field.",
        });
        return;
      }
    }

    setErrors({
      general:
        data.message || data.error || "Something went wrong. Please try again.",
    });
  };

  const addColor = () => {
    setColors((prev) => [...prev, { name: "", hex: "#000000" }]);
    clearFieldError("colors");
  };

  const updateColor = (
    index: number,
    updated: { name: string; hex: string },
  ) => {
    setColors((prev) => prev.map((c, i) => (i === index ? updated : c)));
    clearFieldError("colors");
  };

  const removeColor = (index: number) => {
    setColors((prev) => prev.filter((_, i) => i !== index));
    clearFieldError("colors");
  };

  const handleGalleryUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (gallery.length + files.length > 5) {
      toast.error("You can upload a maximum of 5 images.");
      e.target.value = "";
      return;
    }

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        toast.error(
          `"${file.name}" is not a supported format. Allowed: JPG, PNG, WEBP.`,
        );
        e.target.value = "";
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(`"${file.name}" is larger than 5MB.`);
        e.target.value = "";
        return;
      }
    }

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    if (totalSize > 25 * 1024 * 1024) {
      toast.error("Total image size must not exceed 25MB.");
      e.target.value = "";
      return;
    }

    clearFieldError("gallery");

    files.forEach((file) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const result = event.target?.result;

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

    e.target.value = "";
  };

  const removeGalleryImage = (index: number) => {
    setGallery((prev) => prev.filter((_, i) => i !== index));

    if (gallery.length <= 1) {
      setErrors((previous) => ({
        ...previous,
        gallery: "Please add at least one product image.",
      }));
    }
  };

  const addSizeRow = () => {
    setSizes((prev) => [...prev, { size: "", price: 0 }]);
    clearFieldError("sizes");
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

    clearFieldError("sizes");
  };

  const removeSizeRow = (index: number) => {
    setSizes((prev) => prev.filter((_, i) => i !== index));
    clearFieldError("sizes");
  };

  const validateForm = () => {
    const nextErrors: FieldErrors = {};

    const cleanSizes = sizes
      .map((row) => ({
        size: row.size.trim(),
        price: Number(row.price),
      }))
      .filter((row) => row.size);

    const cleanColors = colors
      .map((color) => ({
        name: color.name.trim(),
        hex: color.hex,
      }))
      .filter((color) => color.name);

    if (!name.trim()) {
      nextErrors.name = "Product name is required.";
    }

    if (!slug.trim()) {
      nextErrors.slug = "Product slug is required.";
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())) {
      nextErrors.slug =
        "Use lowercase letters, numbers, and single hyphens only.";
    }

    if (!description.trim()) {
      nextErrors.description = "Product description is required.";
    }

    if (!category) {
      nextErrors.category = "Please select a category.";
    }

    if (!subcategory) {
      nextErrors.subcategory = "Please select a subcategory.";
    }

    if (!Number.isInteger(countInStock) || countInStock < 0) {
      nextErrors.countInStock =
        "Count in stock must be a whole number that is zero or greater.";
    }

    if (gallery.length === 0) {
      nextErrors.gallery = "Please add at least one product image.";
    }

    if (cleanSizes.length === 0) {
      nextErrors.sizes = "Please add at least one size.";
    } else if (
      cleanSizes.some((row) => !Number.isFinite(row.price) || row.price < 0)
    ) {
      nextErrors.sizes =
        "Every size must include a valid price of zero or greater.";
    }

    if (
      colors.some(
        (color) => !color.name.trim() || !/^#[0-9A-Fa-f]{6}$/.test(color.hex),
      )
    ) {
      nextErrors.colors =
        "Every color row must include a name and a valid color.";
    }

    setErrors(nextErrors);

    return {
      isValid: Object.keys(nextErrors).length === 0,
      cleanSizes,
      cleanColors,
    };
  };

  const createPost = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const { isValid, cleanSizes, cleanColors } = validateForm();

    if (!isValid) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    const cleanTags = tags.map((tag) => tag.trim()).filter(Boolean);

    setLoading(true);
    setErrors({});

    try {
      const finalGallery: { url: string; public_id: string }[] = [];

      for (const img of gallery) {
        if (img.isNew) {
          const blob = dataURItoBlob(img.url);

          if (!blob) {
            throw new Error("Failed to process image.");
          }

          const file = new File([blob], "gallery", {
            type: blob.type,
          });

          const uploaded = await uploadMedia(file, "products");

          if (!uploaded?.[0]?.url || !uploaded?.[0]?.public_id) {
            throw new Error("Image upload failed. Please try again.");
          }

          finalGallery.push({
            url: uploaded[0].url,
            public_id: uploaded[0].public_id,
          });
        }
      }

      const res = await fetch("/api/product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

      const data = (await res.json()) as ApiErrorResponse;

      if (!res.ok) {
        setApiError(data);
        toast.error(data.message || data.error || "Failed to create product.");
        return;
      }

      toast.success("Product created successfully!");
      router.push("/admin/products");
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";

      setErrors({
        general: message,
      });

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };
  const RequiredMark = () => (
    <span className="ml-1 text-red-600 dark:text-red-400" aria-hidden="true">
      *
    </span>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 px-4 py-6 pt-24 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-3xl border border-white/50 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 sm:p-8">
        <div className="mb-8 text-center">
          <div className="z-10 mb-6 mt-2 flex flex-col items-center">
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

        {errors.general && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300"
          >
            {errors.general}
          </div>
        )}

        <form onSubmit={createPost} className="space-y-8" noValidate>
          <div>
            <label
              htmlFor="name"
              className="mb-1 block font-semibold text-slate-800 dark:text-slate-200"
            >
              Name <RequiredMark />
            </label>

            <input
              id="name"
              required
              className={inputClass("name")}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                generateSlug(e.target.value);
                clearFieldError("name");
                clearFieldError("slug");
              }}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
            />

            {errors.name && (
              <p
                id="name-error"
                className="mt-1 text-sm font-medium text-red-600 dark:text-red-400"
              >
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="slug"
              className="mb-1 block font-semibold text-slate-800 dark:text-slate-200"
            >
              Slug <RequiredMark />
            </label>

            <input
              id="slug"
              required
              className={inputClass("slug")}
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                clearFieldError("slug");
              }}
              aria-invalid={Boolean(errors.slug)}
              aria-describedby={errors.slug ? "slug-error" : undefined}
            />

            {errors.slug && (
              <p
                id="slug-error"
                className="mt-1 text-sm font-medium text-red-600 dark:text-red-400"
              >
                {errors.slug}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-1 block font-semibold text-slate-800 dark:text-slate-200"
            >
              Description <RequiredMark />
            </label>

            <textarea
              id="description"
              required
              className={`h-40 ${inputClass("description")}`}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                clearFieldError("description");
              }}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={
                errors.description ? "description-error" : undefined
              }
            />

            {errors.description && (
              <p
                id="description-error"
                className="mt-1 text-sm font-medium text-red-600 dark:text-red-400"
              >
                {errors.description}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="category"
              className="mb-1 block font-semibold text-slate-800 dark:text-slate-200"
            >
              Category <RequiredMark />
            </label>

            <select
              id="category"
              required
              className={inputClass("category")}
              value={category}
              onChange={(e) => {
                const selected = e.target.value as CategoryKey | "";

                setCategory(selected);
                setSubcategory("");
                clearFieldError("category");
                clearFieldError("subcategory");
              }}
              aria-invalid={Boolean(errors.category)}
              aria-describedby={errors.category ? "category-error" : undefined}
            >
              <option value="">Select category</option>

              {Object.keys(CATEGORY_MAP).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {errors.category && (
              <p
                id="category-error"
                className="mt-1 text-sm font-medium text-red-600 dark:text-red-400"
              >
                {errors.category}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="subcategory"
              className="mb-1 block font-semibold text-slate-800 dark:text-slate-200"
            >
              Subcategory <RequiredMark />
            </label>

            <select
              id="subcategory"
              required
              className={inputClass("subcategory")}
              value={subcategory}
              onChange={(e) => {
                setSubcategory(e.target.value);
                clearFieldError("subcategory");
              }}
              disabled={!category}
              aria-invalid={Boolean(errors.subcategory)}
              aria-describedby={
                errors.subcategory ? "subcategory-error" : undefined
              }
            >
              <option value="">Select subcategory</option>

              {category &&
                CATEGORY_MAP[category].map((sub: Subcategory) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
            </select>

            {errors.subcategory && (
              <p
                id="subcategory-error"
                className="mt-1 text-sm font-medium text-red-600 dark:text-red-400"
              >
                {errors.subcategory}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block font-semibold text-slate-800 dark:text-slate-200">
              Tags{" "}
              <span className="font-normal text-slate-500">(optional)</span>
            </label>

            <input
              id="tags"
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
            <label
              htmlFor="countInStock"
              className="mb-1 block font-semibold text-slate-800 dark:text-slate-200"
            >
              Count In Stock <RequiredMark />
            </label>

            <input
              id="countInStock"
              type="number"
              min={0}
              required
              className={inputClass("countInStock")}
              value={countInStock}
              onChange={(e) => {
                setCountInStock(Number(e.target.value));
                clearFieldError("countInStock");
              }}
              aria-invalid={Boolean(errors.countInStock)}
              aria-describedby={
                errors.countInStock ? "count-in-stock-error" : undefined
              }
            />

            {errors.countInStock && (
              <p
                id="count-in-stock-error"
                className="mt-1 text-sm font-medium text-red-600 dark:text-red-400"
              >
                {errors.countInStock}
              </p>
            )}
          </div>

          <div
            className={sectionClass("sizes")}
            role="group"
            aria-labelledby="sizes-label"
            aria-required="true"
            aria-describedby={errors.sizes ? "sizes-error" : undefined}
          >
            <label
              id="sizes-label"
              className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
            >
              Sizes & Prices <RequiredMark />
            </label>

            {errors.sizes && (
              <p
                id="sizes-error"
                className="text-sm font-medium text-red-600 dark:text-red-400"
              >
                {errors.sizes}
              </p>
            )}

            <div className="space-y-3">
              {sizes.map((row, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60 sm:flex-row"
                >
                  <div className="w-full flex-1">
                    <label
                      htmlFor={`size-${index}`}
                      className="text-xs font-medium text-slate-600 dark:text-slate-300"
                    >
                      Size
                    </label>

                    <input
                      id={`size-${index}`}
                      required
                      className={`mt-1 w-full rounded-xl border bg-white p-2.5 text-slate-900 outline-none transition dark:bg-slate-900 dark:text-white ${
                        errors.sizes
                          ? "border-red-500 ring-2 ring-red-500/15 focus:border-red-500 focus:ring-red-500/20"
                          : "border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700"
                      }`}
                      placeholder="S, M, L, XL"
                      value={row.size}
                      onChange={(e) =>
                        updateSizeRow(index, "size", e.target.value)
                      }
                      aria-invalid={Boolean(errors.sizes)}
                      aria-describedby={
                        errors.sizes ? "sizes-error" : undefined
                      }
                    />
                  </div>

                  <div className="w-full flex-1">
                    <label
                      htmlFor={`size-price-${index}`}
                      className="text-xs font-medium text-slate-600 dark:text-slate-300"
                    >
                      Price
                    </label>

                    <input
                      id={`size-price-${index}`}
                      className={`mt-1 w-full rounded-xl border bg-white p-2.5 text-slate-900 outline-none transition dark:bg-slate-900 dark:text-white ${
                        errors.sizes
                          ? "border-red-500 ring-2 ring-red-500/15 focus:border-red-500 focus:ring-red-500/20"
                          : "border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700"
                      }`}
                      placeholder="Price"
                      type="number"
                      min={0}
                      required
                      value={row.price}
                      onChange={(e) =>
                        updateSizeRow(index, "price", Number(e.target.value))
                      }
                      aria-invalid={Boolean(errors.sizes)}
                      aria-describedby={
                        errors.sizes ? "sizes-error" : undefined
                      }
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeSizeRow(index)}
                    className="rounded-full px-3 py-2 text-xl font-bold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                    aria-label={`Remove size ${index + 1}`}
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

          <div className={sectionClass("gallery")}>
            <label
              className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
              htmlFor="gallery"
            >
              Gallery Images <RequiredMark />
              <span className="font-normal text-slate-500 dark:text-slate-400">
                {" "}
                (max 5 images, 5MB each)
              </span>
            </label>

            {errors.gallery && (
              <p
                id="gallery-error"
                className="text-sm font-medium text-red-600 dark:text-red-400"
              >
                {errors.gallery}
              </p>
            )}

            <label
              className={`flex w-full cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed p-4 transition ${
                errors.gallery
                  ? "border-red-500 bg-red-50 hover:bg-red-100 dark:border-red-500 dark:bg-red-950/20"
                  : "border-slate-300 bg-slate-50 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:bg-slate-800"
              }`}
            >
              <span className="font-medium text-slate-600 dark:text-slate-300">
                Click to upload images
              </span>

              <input
                id="gallery"
                type="file"
                multiple
                required={gallery.length === 0}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleGalleryUpload}
                aria-invalid={Boolean(errors.gallery)}
                aria-describedby={errors.gallery ? "gallery-error" : undefined}
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
                    className="absolute right-2 top-2 rounded-full bg-red-600 p-1.5 text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100"
                    aria-label={`Remove gallery image ${index + 1}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className={sectionClass("colors")}>
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
              Colors{" "}
              <span className="font-normal text-slate-500">(optional)</span>
            </label>

            {errors.colors && (
              <p
                id="colors-error"
                className="text-sm font-medium text-red-600 dark:text-red-400"
              >
                {errors.colors}
              </p>
            )}

            <div className="space-y-3">
              {colors.map((color, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60 sm:flex-row"
                >
                  <div className="w-full flex-1">
                    <label
                      htmlFor={`color-name-${index}`}
                      className="text-xs font-medium text-slate-600 dark:text-slate-300"
                    >
                      Color Name
                    </label>

                    <input
                      id={`color-name-${index}`}
                      className={`mt-1 w-full rounded-xl border bg-white p-2.5 text-slate-900 outline-none transition dark:bg-slate-900 dark:text-white ${
                        errors.colors
                          ? "border-red-500 ring-2 ring-red-500/15 focus:border-red-500 focus:ring-red-500/20"
                          : "border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700"
                      }`}
                      placeholder="Navy Blue, Black, White"
                      value={color.name}
                      onChange={(e) =>
                        updateColor(index, {
                          ...color,
                          name: e.target.value,
                        })
                      }
                      aria-invalid={Boolean(errors.colors)}
                      aria-describedby={
                        errors.colors ? "colors-error" : undefined
                      }
                    />
                  </div>

                  <div className="w-full flex-1">
                    <label
                      htmlFor={`color-hex-${index}`}
                      className="text-xs font-medium text-slate-600 dark:text-slate-300"
                    >
                      Color
                    </label>

                    <input
                      id={`color-hex-${index}`}
                      type="color"
                      className={`mt-1 h-10 w-full cursor-pointer rounded-xl border bg-white p-1 dark:bg-slate-900 ${
                        errors.colors
                          ? "border-red-500 ring-2 ring-red-500/15"
                          : "border-slate-200 dark:border-slate-700"
                      }`}
                      value={color.hex}
                      onChange={(e) =>
                        updateColor(index, {
                          ...color,
                          hex: e.target.value,
                        })
                      }
                      aria-invalid={Boolean(errors.colors)}
                      aria-describedby={
                        errors.colors ? "colors-error" : undefined
                      }
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeColor(index)}
                    className="rounded-full px-3 py-2 text-xl font-bold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                    aria-label={`Remove color ${index + 1}`}
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

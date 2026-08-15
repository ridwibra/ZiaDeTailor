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

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [productId, setProductId] = useState("");

  const [name, setName] = useState("");
  const [slugValue, setSlugValue] = useState("");
  const [description, setDescription] = useState("");

  const [category, setCategory] = useState<CategoryKey | "">("");
  const [subcategory, setSubcategory] = useState("");
  const [countInStock, setCountInStock] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [sizes, setSizes] = useState<{ size: string; price: number }[]>([]);
  const [colors, setColors] = useState<{ name: string; hex: string }[]>([]);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [removedImages, setRemovedImages] = useState<string[]>([]);

  const [authorized, setAuthorized] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const clearFieldError = (field: keyof FieldErrors) => {
    setErrors((previous) => {
      if (!previous[field]) return previous;

      const nextErrors = { ...previous };
      delete nextErrors[field];

      return nextErrors;
    });
  };

  const inputClass = (field: keyof FieldErrors) =>
    `w-full rounded-2xl border bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 ${
      errors[field]
        ? "border-red-500 ring-4 ring-red-500/15 focus:border-red-500 focus:bg-white focus:ring-red-500/20 dark:border-red-500 dark:focus:bg-slate-900"
        : "border-slate-200 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 dark:border-slate-700 dark:focus:bg-slate-900"
    }`;

  const sectionClass = (field: keyof FieldErrors) =>
    `space-y-4 rounded-3xl border p-4 sm:p-5 ${
      errors[field]
        ? "border-red-500 bg-red-50/50 ring-4 ring-red-500/10 dark:border-red-500 dark:bg-red-950/20"
        : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/40"
    }`;

  const mapApiErrors = (apiErrors: Record<string, string>): FieldErrors => {
    const mappedErrors: FieldErrors = {};

    for (const [field, message] of Object.entries(apiErrors)) {
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

  useEffect(() => {
    async function loadProduct() {
      try {
        const { data: session } = await authClient.getSession();
        const user = session?.user as UserType | undefined;
        const role = user?.role;

        if (role !== "admin" && role !== "staff") {
          toast.error("Only admin or staff can edit products.");
          router.replace("/admin/products");
          return;
        }

        setAuthorized(true);

        const resAll = await fetch("/api/product", {
          cache: "no-store",
        });

        const dataAll = await resAll.json();

        if (!resAll.ok || !Array.isArray(dataAll.products)) {
          throw new Error(
            dataAll.message || dataAll.error || "Failed to load product list.",
          );
        }

        const productBySlug = dataAll.products.find(
          (product: { _id: string; slug: string }) => product.slug === slug,
        );

        if (!productBySlug) {
          toast.error("Product not found.");
          router.replace("/admin/products");
          return;
        }

        const id = productBySlug._id;
        setProductId(id);

        const res = await fetch(`/api/product/${id}`, {
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok || !data.product) {
          throw new Error(
            data.message || data.error || "Failed to load product.",
          );
        }

        const product = data.product;

        setName(product.name || "");
        setSlugValue(product.slug || "");
        setDescription(product.description || "");
        setCategory(product.category || "");
        setSubcategory(product.subcategory || "");
        setCountInStock(product.countInStock ?? 0);
        setTags(product.tags || []);
        setSizes(
          product.sizes?.length ? product.sizes : [{ size: "", price: 0 }],
        );
        setColors(product.colors || []);

        setGallery(
          (product.images || []).map(
            (image: { url: string; public_id?: string }) => ({
              url: image.url,
              public_id: image.public_id || "",
              isNew: false,
            }),
          ),
        );
      } catch (error: unknown) {
        console.error("Failed to load product:", error);

        toast.error(
          error instanceof Error ? error.message : "Failed to load product.",
        );
      } finally {
        setInitialLoading(false);
      }
    }

    if (slug) {
      loadProduct();
    } else {
      setInitialLoading(false);
    }
  }, [slug, router]);

  const generateSlug = (value: string) => {
    const generatedSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    setSlugValue(generatedSlug);
  };

  const addColor = () => {
    setColors((prev) => [...prev, { name: "", hex: "#000000" }]);
    clearFieldError("colors");
  };

  const updateColor = (
    index: number,
    updated: { name: string; hex: string },
  ) => {
    setColors((prev) =>
      prev.map((color, i) => (i === index ? updated : color)),
    );
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
        toast.error(`"${file.name}" is not a supported format.`);
        e.target.value = "";
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(`"${file.name}" is larger than 5MB.`);
        e.target.value = "";
        return;
      }
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
    setGallery((prev) => {
      const image = prev[index];

      if (!image.isNew && image.public_id) {
        setRemovedImages((removed) => [...removed, image.public_id!]);
      }

      const updatedGallery = prev.filter((_, i) => i !== index);

      if (updatedGallery.length === 0) {
        setErrors((previous) => ({
          ...previous,
          gallery: "Please add at least one product image.",
        }));
      }

      return updatedGallery;
    });
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

    if (!slugValue.trim()) {
      nextErrors.slug = "Product slug is required.";
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slugValue.trim())) {
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

  const updateProduct = async () => {
    const { isValid, cleanSizes, cleanColors } = validateForm();

    if (!isValid) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    if (!productId) {
      setErrors({
        general: "Product ID is missing. Please reload the page.",
      });
      toast.error("Product ID is missing.");
      return;
    }

    const cleanTags = tags.map((tag) => tag.trim()).filter(Boolean);

    setLoading(true);
    setErrors({});

    const uploadedNewPublicIds: string[] = [];
    const deletedOldPublicIds = [...removedImages];

    try {
      const finalGallery: { url: string; public_id: string }[] = [];

      for (const image of gallery) {
        if (image.isNew) {
          const blob = dataURItoBlob(image.url);

          if (!blob) {
            throw new Error("Failed to process image.");
          }

          const file = new File([blob], "gallery", {
            type: blob.type || "image/jpeg",
          });

          const uploaded = await uploadMedia(file, "products");
          const uploadedImage = uploaded?.[0];

          if (!uploadedImage?.url || !uploadedImage?.public_id) {
            throw new Error("Image upload failed. Please try again.");
          }

          uploadedNewPublicIds.push(uploadedImage.public_id);

          finalGallery.push({
            url: uploadedImage.url,
            public_id: uploadedImage.public_id,
          });
        } else if (image.public_id) {
          finalGallery.push({
            url: image.url,
            public_id: image.public_id,
          });
        } else {
          throw new Error("An existing image is missing its Cloudinary ID.");
        }
      }

      const response = await fetch(`/api/product/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
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

      const data = (await response.json()) as ApiErrorResponse;

      if (!response.ok) {
        setApiError(data);

        throw new Error(
          data.message || data.error || "Failed to update product.",
        );
      }

      for (const publicId of deletedOldPublicIds) {
        try {
          await deleteMedia(publicId);
        } catch (error) {
          console.error(
            "Failed to delete old Cloudinary image:",
            publicId,
            error,
          );
        }
      }

      toast.success("Product updated successfully!");
      router.push(`/products/${slugValue.trim()}`);
      router.refresh();
    } catch (error: unknown) {
      for (const publicId of uploadedNewPublicIds) {
        try {
          await deleteMedia(publicId);
        } catch (cleanupError) {
          console.error(
            "Failed to clean up uploaded Cloudinary image:",
            publicId,
            cleanupError,
          );
        }
      }

      const message =
        error instanceof Error ? error.message : "Something went wrong.";

      toast.error(message);
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

  if (!authorized) {
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
          {errors.general && (
            <div
              role="alert"
              className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
            >
              {errors.general}
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
              >
                Name <span className="text-red-600">*</span>
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
                placeholder="Product name"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "name-error" : undefined}
              />

              {errors.name && (
                <p
                  id="name-error"
                  className="text-sm font-medium text-red-600 dark:text-red-400"
                >
                  {errors.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="slug"
                className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
              >
                Slug <span className="text-red-600">*</span>
              </label>

              <input
                id="slug"
                required
                className={inputClass("slug")}
                value={slugValue}
                onChange={(e) => {
                  setSlugValue(e.target.value);
                  clearFieldError("slug");
                }}
                placeholder="product-name"
                aria-invalid={Boolean(errors.slug)}
                aria-describedby={errors.slug ? "slug-error" : undefined}
              />

              {errors.slug && (
                <p
                  id="slug-error"
                  className="text-sm font-medium text-red-600 dark:text-red-400"
                >
                  {errors.slug}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="description"
              className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
            >
              Description <span className="text-red-600">*</span>
            </label>

            <textarea
              id="description"
              required
              className={`h-44 ${inputClass("description")}`}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                clearFieldError("description");
              }}
              placeholder="Write a detailed product description..."
              aria-invalid={Boolean(errors.description)}
              aria-describedby={
                errors.description ? "description-error" : undefined
              }
            />

            {errors.description && (
              <p
                id="description-error"
                className="text-sm font-medium text-red-600 dark:text-red-400"
              >
                {errors.description}
              </p>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="category"
                className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
              >
                Category <span className="text-red-600">*</span>
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
                aria-describedby={
                  errors.category ? "category-error" : undefined
                }
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
                  className="text-sm font-medium text-red-600 dark:text-red-400"
                >
                  {errors.category}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="subcategory"
                className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
              >
                Subcategory <span className="text-red-600">*</span>
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
                  className="text-sm font-medium text-red-600 dark:text-red-400"
                >
                  {errors.subcategory}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="tags"
              className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
            >
              Tags{" "}
              <span className="font-normal text-slate-500">(optional)</span>
            </label>

            <input
              id="tags"
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
            <label
              htmlFor="countInStock"
              className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
            >
              Count In Stock <span className="text-red-600">*</span>
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
                className="text-sm font-medium text-red-600 dark:text-red-400"
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
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2
                  id="sizes-label"
                  className="text-sm font-semibold text-slate-800 dark:text-slate-200"
                >
                  Sizes & Prices <span className="text-red-600">*</span>
                </h2>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Update the available sizes and pricing.
                </p>

                {errors.sizes && (
                  <p
                    id="sizes-error"
                    className="mt-2 text-sm font-medium text-red-600 dark:text-red-400"
                  >
                    {errors.sizes}
                  </p>
                )}
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
                    <label
                      htmlFor={`size-${index}`}
                      className="text-xs font-medium text-slate-600 dark:text-slate-300"
                    >
                      Size <span className="text-red-600">*</span>
                    </label>

                    <input
                      id={`size-${index}`}
                      required
                      className={`w-full rounded-xl border bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition dark:bg-slate-800 dark:text-white ${
                        errors.sizes
                          ? "border-red-500 ring-4 ring-red-500/15 focus:border-red-500 focus:bg-white focus:ring-red-500/20 dark:border-red-500 dark:focus:bg-slate-900"
                          : "border-slate-200 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 dark:border-slate-700 dark:focus:bg-slate-900"
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

                  <div className="w-full flex-1 space-y-2">
                    <label
                      htmlFor={`size-price-${index}`}
                      className="text-xs font-medium text-slate-600 dark:text-slate-300"
                    >
                      Price <span className="text-red-600">*</span>
                    </label>

                    <input
                      id={`size-price-${index}`}
                      type="number"
                      min={0}
                      required
                      className={`w-full rounded-xl border bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition dark:bg-slate-800 dark:text-white ${
                        errors.sizes
                          ? "border-red-500 ring-4 ring-red-500/15 focus:border-red-500 focus:bg-white focus:ring-red-500/20 dark:border-red-500 dark:focus:bg-slate-900"
                          : "border-slate-200 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 dark:border-slate-700 dark:focus:bg-slate-900"
                      }`}
                      placeholder="0"
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
                    className="inline-flex h-11 w-11 items-center justify-center self-start rounded-full text-xl font-bold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 sm:self-auto"
                    aria-label={`Remove size row ${index + 1}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div
            className={sectionClass("gallery")}
            role="group"
            aria-labelledby="gallery-label"
            aria-required="true"
            aria-describedby={errors.gallery ? "gallery-error" : undefined}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2
                  id="gallery-label"
                  className="text-sm font-semibold text-slate-800 dark:text-slate-200"
                >
                  Gallery Images <span className="text-red-600">*</span>
                </h2>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Max 5 images, 5MB each. JPG, PNG, WEBP only.
                </p>

                {errors.gallery && (
                  <p
                    id="gallery-error"
                    className="mt-2 text-sm font-medium text-red-600 dark:text-red-400"
                  >
                    {errors.gallery}
                  </p>
                )}
              </div>

              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {gallery.length}/5 uploaded
              </span>
            </div>

            <label
              className={`flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition ${
                errors.gallery
                  ? "border-red-500 bg-red-50 hover:bg-red-100 dark:border-red-500 dark:bg-red-950/20 dark:hover:bg-red-950/30"
                  : "border-slate-300 bg-white hover:border-teal-400 hover:bg-teal-50/40 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-teal-500 dark:hover:bg-slate-900"
              }`}
            >
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Click to upload images
              </span>

              <span className="text-xs text-slate-500 dark:text-slate-400">
                Upload new images to replace or extend the current gallery.
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

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {gallery.map((image, index) => (
                <div
                  key={`${image.url}-${index}`}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <Image
                    src={image.url}
                    alt={`Gallery image ${index + 1}`}
                    width={400}
                    height={300}
                    className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  <button
                    type="button"
                    onClick={() => removeGalleryImage(index)}
                    className="absolute right-2 top-2 rounded-full bg-red-600 p-1.5 text-white opacity-0 shadow-lg transition group-hover:opacity-100 focus:opacity-100"
                    aria-label={`Remove image ${index + 1}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className={sectionClass("colors")}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Colors{" "}
                  <span className="font-normal text-slate-500 dark:text-slate-400">
                    (optional)
                  </span>
                </h2>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Optional color variants for the product.
                </p>

                {errors.colors && (
                  <p
                    id="colors-error"
                    className="mt-2 text-sm font-medium text-red-600 dark:text-red-400"
                  >
                    {errors.colors}
                  </p>
                )}
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
                    <label
                      htmlFor={`color-name-${index}`}
                      className="text-xs font-medium text-slate-600 dark:text-slate-300"
                    >
                      Color Name
                    </label>

                    <input
                      id={`color-name-${index}`}
                      className={`w-full rounded-xl border bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition dark:bg-slate-800 dark:text-white ${
                        errors.colors
                          ? "border-red-500 ring-4 ring-red-500/15 focus:border-red-500 focus:bg-white focus:ring-red-500/20 dark:border-red-500 dark:focus:bg-slate-900"
                          : "border-slate-200 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 dark:border-slate-700 dark:focus:bg-slate-900"
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

                  <div className="w-full flex-1 space-y-2">
                    <label
                      htmlFor={`color-hex-${index}`}
                      className="text-xs font-medium text-slate-600 dark:text-slate-300"
                    >
                      Color
                    </label>

                    <input
                      id={`color-hex-${index}`}
                      type="color"
                      className={`h-11 w-full cursor-pointer rounded-xl border bg-white p-1 dark:bg-slate-900 ${
                        errors.colors
                          ? "border-red-500 ring-4 ring-red-500/15"
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
                    className="inline-flex h-11 w-11 items-center justify-center self-start rounded-full text-xl font-bold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 sm:self-auto"
                    aria-label={`Remove color ${index + 1}`}
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

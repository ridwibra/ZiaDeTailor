"use client";

import { ChangeEvent, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import dataURItoBlob from "@/utils/files/dataUrlToBlob";
import { deleteMedia, uploadMedia } from "@/utils/files/requests";

type BannerImage = {
  url: string;
  public_id: string;
};

type BannerData = {
  _id: string;
  title: string;
  subtitle?: string;
  link?: string;
  order?: number;
  active?: boolean;
  image: BannerImage;
};

type FieldErrors = {
  title?: string;
  subtitle?: string;
  link?: string;
  order?: string;
  active?: string;
  image?: string;
  general?: string;
};

type ApiErrorResponse = {
  field?: string;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
};

type NewImagePreview = {
  url: string;
  size?: string;
};

export default function EditBannerPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [link, setLink] = useState("");
  const [order, setOrder] = useState(0);
  const [active, setActive] = useState(true);

  const [currentImage, setCurrentImage] = useState<BannerImage | null>(null);
  const [newImage, setNewImage] = useState<NewImagePreview | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
    `w-full rounded-lg border p-3 outline-none transition ${
      errors[field]
        ? "border-red-500 ring-2 ring-red-500/20 focus:border-red-500 focus:ring-red-500/25"
        : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
    }`;

  const mapApiErrors = (fieldErrors: Record<string, string>): FieldErrors => {
    const mapped: FieldErrors = {};

    for (const [field, message] of Object.entries(fieldErrors)) {
      if (
        field === "title" ||
        field === "subtitle" ||
        field === "link" ||
        field === "order" ||
        field === "active" ||
        field === "image" ||
        field === "general"
      ) {
        mapped[field] = message;
      }
    }

    return mapped;
  };

  const setApiError = (data: ApiErrorResponse) => {
    if (data.fieldErrors && typeof data.fieldErrors === "object") {
      setErrors(mapApiErrors(data.fieldErrors));
      return;
    }

    if (
      data.field === "title" ||
      data.field === "subtitle" ||
      data.field === "link" ||
      data.field === "order" ||
      data.field === "active" ||
      data.field === "image"
    ) {
      setErrors({
        [data.field]: data.message || data.error || "Invalid value.",
      });

      return;
    }

    setErrors({
      general:
        data.message || data.error || "Something went wrong. Please try again.",
    });
  };

  useEffect(() => {
    const fetchBanner = async () => {
      if (!id) {
        setErrors({
          general: "Banner ID is missing.",
        });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const response = await fetch(`/api/banner/${id}`, {
          cache: "no-store",
        });

        const data = (await response.json()) as ApiErrorResponse & {
          banner?: BannerData;
        };

        if (!response.ok || !data.banner) {
          throw new Error(
            data.message || data.error || "Failed to load banner.",
          );
        }

        const banner = data.banner;

        setTitle(banner.title || "");
        setSubtitle(banner.subtitle || "");
        setLink(banner.link || "");
        setOrder(banner.order ?? 0);
        setActive(Boolean(banner.active));
        setCurrentImage(banner.image || null);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Failed to load banner.";

        setErrors({
          general: message,
        });

        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchBanner();
  }, [id]);

  const validateForm = () => {
    const nextErrors: FieldErrors = {};

    if (!title.trim()) {
      nextErrors.title = "Banner title is required.";
    } else if (title.trim().length > 120) {
      nextErrors.title = "Banner title cannot exceed 120 characters.";
    }

    if (subtitle.trim().length > 240) {
      nextErrors.subtitle = "Banner subtitle cannot exceed 240 characters.";
    }

    if (!Number.isInteger(order) || order < 0) {
      nextErrors.order =
        "Banner order must be a whole number that is zero or greater.";
    }

    if (!newImage?.url && !currentImage?.url) {
      nextErrors.image = "Banner image is required.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleBannerImage = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB.");
      input.value = "";
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      toast.error("Image must be JPG, PNG, or WEBP.");
      input.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = (readerEvent) => {
      const result = readerEvent.target?.result;

      if (typeof result !== "string") return;

      setNewImage({
        url: result,
        size: formatFileSize(file.size),
      });

      clearFieldError("image");
    };

    reader.readAsDataURL(file);
    input.value = "";
  };

  const handleRemoveNewImage = () => {
    setNewImage(null);

    if (!currentImage?.url) {
      setErrors((previous) => ({
        ...previous,
        image: "Banner image is required.",
      }));
    }
  };

  const updateBanner = async () => {
    if (!id) {
      setErrors({
        general: "Banner ID is missing.",
      });
      toast.error("Banner ID is missing.");
      return;
    }

    if (!validateForm()) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setSaving(true);
    setErrors({});

    let uploadedNewPublicId: string | null = null;

    try {
      let imagePayload = currentImage;

      if (newImage?.url) {
        const blob = dataURItoBlob(newImage.url);

        if (!blob) {
          throw new Error("Failed to process the banner image.");
        }

        const file = new File([blob], "banner", {
          type: blob.type || "image/jpeg",
        });

        const uploadResponse = await uploadMedia(file, "banners");
        const uploadedImage = uploadResponse?.[0];

        if (!uploadedImage?.url || !uploadedImage?.public_id) {
          throw new Error("Image upload failed. Please try again.");
        }

        imagePayload = {
          url: uploadedImage.url,
          public_id: uploadedImage.public_id,
        };

        uploadedNewPublicId = uploadedImage.public_id;
      }

      if (!imagePayload?.url || !imagePayload.public_id) {
        setErrors({
          image: "Banner image is required.",
        });

        throw new Error("Banner image is required.");
      }

      const response = await fetch(`/api/banner/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          subtitle: subtitle.trim(),
          link: link.trim(),
          order,
          active,
          image: imagePayload,
        }),
      });

      const data = (await response.json()) as ApiErrorResponse;

      if (!response.ok) {
        setApiError(data);

        throw new Error(
          data.message || data.error || "Failed to update banner.",
        );
      }

      if (
        newImage?.url &&
        currentImage?.public_id &&
        currentImage.public_id !== imagePayload.public_id
      ) {
        try {
          await deleteMedia(currentImage.public_id);
        } catch (cleanupError) {
          console.warn("Failed to delete old banner image:", cleanupError);
        }
      }

      toast.success("Banner updated successfully!");
      router.push("/admin/banners");
      router.refresh();
    } catch (error: unknown) {
      if (uploadedNewPublicId) {
        try {
          await deleteMedia(uploadedNewPublicId);
        } catch (cleanupError) {
          console.error(
            "Failed to clean up newly uploaded banner image:",
            cleanupError,
          );
        }
      }

      const message =
        error instanceof Error ? error.message : "Something went wrong.";

      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6 pt-24">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/admin/banners" className="text-sm text-blue-600 underline">
          ← Back to banners
        </Link>
      </div>

      <h1 className="mb-6 text-center text-3xl font-bold">Edit Banner</h1>

      {errors.general && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          {errors.general}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium">
            Title <span className="text-red-600">*</span>
          </label>

          <input
            id="title"
            required
            maxLength={120}
            className={inputClass("title")}
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              clearFieldError("title");
            }}
            placeholder="Summer Collection"
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? "title-error" : undefined}
          />

          {errors.title && (
            <p id="title-error" className="mt-1 text-sm text-red-600">
              {errors.title}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="subtitle" className="mb-1 block text-sm font-medium">
            Subtitle <span className="text-gray-500">(optional)</span>
          </label>

          <input
            id="subtitle"
            maxLength={240}
            className={inputClass("subtitle")}
            value={subtitle}
            onChange={(event) => {
              setSubtitle(event.target.value);
              clearFieldError("subtitle");
            }}
            placeholder="Bold • Elegant • Authentic"
            aria-invalid={Boolean(errors.subtitle)}
            aria-describedby={errors.subtitle ? "subtitle-error" : undefined}
          />

          {errors.subtitle && (
            <p id="subtitle-error" className="mt-1 text-sm text-red-600">
              {errors.subtitle}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="link" className="mb-1 block text-sm font-medium">
            Link <span className="text-gray-500">(optional)</span>
          </label>

          <input
            id="link"
            className={inputClass("link")}
            value={link}
            onChange={(event) => {
              setLink(event.target.value);
              clearFieldError("link");
            }}
            placeholder="/collections/summer"
            aria-invalid={Boolean(errors.link)}
            aria-describedby={errors.link ? "link-error" : undefined}
          />

          {errors.link && (
            <p id="link-error" className="mt-1 text-sm text-red-600">
              {errors.link}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="order" className="mb-1 block text-sm font-medium">
            Order <span className="text-red-600">*</span>
          </label>

          <input
            id="order"
            type="number"
            min={0}
            step={1}
            required
            className={inputClass("order")}
            value={order}
            onChange={(event) => {
              setOrder(Number(event.target.value));
              clearFieldError("order");
            }}
            placeholder="0"
            aria-invalid={Boolean(errors.order)}
            aria-describedby={errors.order ? "order-error" : undefined}
          />

          {errors.order && (
            <p id="order-error" className="mt-1 text-sm text-red-600">
              {errors.order}
            </p>
          )}
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium">
            Active <span className="text-red-600">*</span>
          </span>

          <button
            type="button"
            onClick={() => {
              setActive((previous) => !previous);
              clearFieldError("active");
            }}
            className={`rounded-lg px-4 py-2 font-semibold text-white transition ${
              active
                ? "bg-green-600 hover:bg-green-700"
                : "bg-gray-500 hover:bg-gray-600"
            }`}
            aria-pressed={active}
            aria-describedby={errors.active ? "active-error" : undefined}
          >
            {active ? "Active" : "Inactive"}
          </button>

          {errors.active && (
            <p id="active-error" className="mt-1 text-sm text-red-600">
              {errors.active}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="banner-image"
            className="mb-1 block text-sm font-medium"
          >
            Banner Image <span className="text-red-600">*</span>
          </label>

          {errors.image && (
            <p id="image-error" className="mb-2 text-sm text-red-600">
              {errors.image}
            </p>
          )}

          <div
            className={`flex items-start gap-4 rounded-lg border p-3 ${
              errors.image ? "border-red-500 bg-red-50" : "border-transparent"
            }`}
          >
            <div className="relative">
              {newImage ? (
                <>
                  <Image
                    src={newImage.url}
                    alt="New banner preview"
                    width={200}
                    height={120}
                    className="h-28 w-48 rounded-lg border object-cover"
                  />

                  <button
                    type="button"
                    onClick={handleRemoveNewImage}
                    className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                    aria-label="Remove newly selected banner image"
                  >
                    ✕
                  </button>
                </>
              ) : currentImage ? (
                <Image
                  src={currentImage.url}
                  alt="Current banner"
                  width={200}
                  height={120}
                  className="h-28 w-48 rounded-lg border object-cover"
                />
              ) : (
                <div className="flex h-28 w-48 items-center justify-center rounded-lg border-2 border-dashed text-gray-400">
                  No image
                </div>
              )}
            </div>

            <div className="flex-1">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border bg-gray-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-700">
                {currentImage || newImage ? "Change Image" : "Upload Image"}

                <input
                  id="banner-image"
                  type="file"
                  required={!currentImage && !newImage}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleBannerImage}
                  aria-invalid={Boolean(errors.image)}
                  aria-describedby={errors.image ? "image-error" : undefined}
                />
              </label>

              {newImage?.size && (
                <p className="mt-2 text-xs text-gray-500">
                  Size: {newImage.size}
                </p>
              )}

              <p className="mt-1 text-xs text-gray-500">
                JPG, PNG, WEBP — maximum 5MB.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={updateBanner}
          disabled={saving}
          className="w-full rounded-lg bg-blue-600 py-3 text-lg font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Updating..." : "Update Banner"}
        </button>
      </div>
    </div>
  );
}

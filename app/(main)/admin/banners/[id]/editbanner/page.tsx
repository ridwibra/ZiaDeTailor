"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import dataURItoBlob from "@/utils/files/dataUrlToBlob";
import { uploadMedia, deleteMedia } from "@/utils/files/requests";

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

export default function EditBannerPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [link, setLink] = useState("");
  const [order, setOrder] = useState(0);
  const [active, setActive] = useState(true);

  const [currentImage, setCurrentImage] = useState<BannerImage | null>(null);
  const [newImage, setNewImage] = useState<{
    url: string;
    size?: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  useEffect(() => {
    const fetchBanner = async () => {
      if (!id) return;

      try {
        setLoading(true);

        const res = await fetch(`/api/banner/${id}`, {
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load banner");
        }

        const banner: BannerData = data.banner;

        setTitle(banner.title || "");
        setSubtitle(banner.subtitle || "");
        setLink(banner.link || "");
        setOrder(banner.order ?? 0);
        setActive(Boolean(banner.active));
        setCurrentImage(banner.image || null);
      } catch (err: any) {
        toast.error(err.message || "Failed to load banner");
      } finally {
        setLoading(false);
      }
    };

    fetchBanner();
  }, [id]);

  const handleBannerImage = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0]) return;

    const file = event.target.files[0];
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      toast.error("Image must be JPG, PNG, or WEBP");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setNewImage({
          url: e.target.result as string,
          size: formatFileSize(file.size),
        });
      }
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveNewImage = () => {
    if (newImage?.url) URL.revokeObjectURL(newImage.url);
    setNewImage(null);
  };

  const updateBanner = async () => {
    if (!id) return;

    setSaving(true);

    try {
      let imagePayload = currentImage;
      let uploadedNewPublicId: string | null = null;

      if (newImage?.url) {
        const blob = dataURItoBlob(newImage.url);
        if (!blob) throw new Error("Failed to process image");

        const file = new File([blob], "banner", { type: blob.type });
        const uploadResponse = await uploadMedia(file, "banners");

        imagePayload = {
          url: uploadResponse[0].url,
          public_id: uploadResponse[0].public_id,
        };

        uploadedNewPublicId = uploadResponse[0].public_id;
      }

      if (!imagePayload) {
        throw new Error("Banner image is required");
      }

      const res = await fetch(`/api/banner/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          subtitle,
          link,
          order,
          active,
          image: imagePayload,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update banner");
      }

      if (newImage?.url && currentImage?.public_id) {
        try {
          await deleteMedia(currentImage.public_id);
        } catch (cleanupErr) {
          console.warn("Failed to delete old banner image:", cleanupErr);
        }
      }

      toast.success("Banner updated successfully!");
      router.push("/admin/banners");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
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
    <div className="max-w-2xl mx-auto p-6 pt-24">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/admin/banners" className="text-sm text-blue-600 underline">
          ← Back to banners
        </Link>
      </div>

      <h1 className="text-3xl text-center font-bold mb-6">Edit Banner</h1>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            className="w-full border rounded-lg p-3"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summer Collection"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Subtitle</label>
          <input
            className="w-full border rounded-lg p-3"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Bold • Elegant • Authentic"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Link (optional)
          </label>
          <input
            className="w-full border rounded-lg p-3"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="/collections/summer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Order</label>
          <input
            type="number"
            className="w-full border rounded-lg p-3"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
            placeholder="0"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">Active</label>
          <button
            type="button"
            onClick={() => setActive(!active)}
            className={`px-4 py-2 rounded-lg text-white font-semibold transition ${
              active
                ? "bg-green-600 hover:bg-green-700"
                : "bg-gray-500 hover:bg-gray-600"
            }`}
          >
            {active ? "Active" : "Inactive"}
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Banner Image</label>

          <div className="flex items-start gap-4">
            <div className="relative">
              {newImage ? (
                <>
                  <Image
                    src={newImage.url}
                    alt="New banner preview"
                    width={200}
                    height={120}
                    className="rounded-lg w-48 h-28 object-cover border"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveNewImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
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
                  className="rounded-lg w-48 h-28 object-cover border"
                />
              ) : (
                <div className="w-48 h-28 rounded-lg border-2 border-dashed flex items-center justify-center text-gray-400">
                  No image
                </div>
              )}
            </div>

            <div className="flex-1">
              <label className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg shadow-sm border bg-gray-600 hover:bg-gray-700 text-white cursor-pointer">
                {currentImage || newImage ? "Change Image" : "Upload Image"}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleBannerImage}
                />
              </label>

              {newImage?.size && (
                <p className="mt-2 text-xs text-gray-500">
                  Size: {newImage.size}
                </p>
              )}

              <p className="mt-1 text-xs text-gray-500">
                JPG, PNG, WEBP — max 5MB
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={updateBanner}
          disabled={saving}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg disabled:opacity-50"
        >
          {saving ? "Updating..." : "Update Banner"}
        </button>
      </div>
    </div>
  );
}

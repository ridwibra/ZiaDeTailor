"use client";

import { useState, ChangeEvent } from "react";
import Image from "next/image";
import { toast } from "sonner";
import dataURItoBlob from "@/utils/files/dataUrlToBlob";
import { uploadMedia } from "@/utils/files/requests";

export default function NewBannerPage() {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [link, setLink] = useState("");
  const [order, setOrder] = useState(0);
  const [active, setActive] = useState(true);

  const [bannerImage, setBannerImage] = useState<{
    url: string;
    size?: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} bytes`;
    else if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    else return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  // Remove banner image
  const handleRemoveBannerImage = () => {
    if (bannerImage?.url) URL.revokeObjectURL(bannerImage.url);
    setBannerImage(null);
  };

  // Handle banner image upload
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
        setBannerImage({
          url: e.target.result as string,
          size: formatFileSize(file.size),
        });
      }
    };

    reader.readAsDataURL(file);
  };

  // Submit banner
  const createBanner = async () => {
    if (!bannerImage?.url) {
      toast.error("Please upload a banner image");
      return;
    }

    setLoading(true);

    try {
      // Convert preview to Blob
      const blob = dataURItoBlob(bannerImage.url);
      if (!blob) throw new Error("Failed to process image");

      // Upload to Cloudinary
      const file = new File([blob], "banner", { type: blob.type });
      const uploadResponse = await uploadMedia(file, "banners");

      const uploaded_image = {
        url: uploadResponse[0].url,
        public_id: uploadResponse[0].public_id,
      };

      // Send to API
      const res = await fetch("/api/banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subtitle,
          link,
          order,
          active,
          image: uploaded_image,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create banner");
      }

      toast.success("Banner created successfully!");
      window.location.href = "/admin/banners";
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 pt-24">
      <h1 className="text-3xl text-center font-bold mb-6">New Banner</h1>

      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            className="w-full border rounded-lg p-3"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summer Collection"
          />
        </div>

        {/* Subtitle */}
        <div>
          <label className="block text-sm font-medium mb-1">Subtitle</label>
          <input
            className="w-full border rounded-lg p-3"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Bold • Elegant • Authentic"
          />
        </div>

        {/* Link */}
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

        {/* Order */}
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

        {/* Active Toggle */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">Active</label>
          <button
            type="button"
            onClick={() => setActive(!active)}
            className={`px-4 py-2 rounded-lg text-white font-semibold transition
              ${active ? "bg-green-600 hover:bg-green-700" : "bg-gray-500 hover:bg-gray-600"}
            `}
          >
            {active ? "Active" : "Inactive"}
          </button>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium mb-1">Banner Image</label>

          <div className="flex items-start gap-4">
            {/* Preview */}
            <div className="relative">
              {bannerImage ? (
                <>
                  <Image
                    src={bannerImage.url}
                    alt="Banner preview"
                    width={200}
                    height={120}
                    className="rounded-lg w-48 h-28 object-cover border"
                  />

                  <button
                    type="button"
                    onClick={handleRemoveBannerImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    ✕
                  </button>
                </>
              ) : (
                <div className="w-48 h-28 rounded-lg border-2 border-dashed flex items-center justify-center text-gray-400">
                  No image
                </div>
              )}
            </div>

            {/* Upload Button */}
            <div className="flex-1">
              <label className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg shadow-sm border bg-gray-600 hover:bg-gray-700 text-white cursor-pointer">
                {bannerImage ? "Change Image" : "Upload Image"}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleBannerImage}
                />
              </label>

              {bannerImage?.size && (
                <p className="mt-2 text-xs text-gray-500">
                  Size: {bannerImage.size}
                </p>
              )}

              <p className="mt-1 text-xs text-gray-500">
                JPG, PNG, WEBP — max 5MB
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={createBanner}
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Banner"}
        </button>
      </div>
    </div>
  );
}

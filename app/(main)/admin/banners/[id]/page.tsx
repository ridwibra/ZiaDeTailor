"use client";

import { useEffect, useState, ChangeEvent } from "react";
import Image from "next/image";
import { toast } from "sonner";
import dataURItoBlob from "@/utils/files/dataUrlToBlob";
import { deleteMedia, uploadMedia } from "@/utils/files/requests";
import { useRouter, useParams } from "next/navigation";

export default function EditBannerPage() {
  const router = useRouter();
  const { id } = useParams();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [link, setLink] = useState("");
  const [order, setOrder] = useState(0);
  const [active, setActive] = useState(true);

  const [bannerImage, setBannerImage] = useState<{
    url: string;
    public_id?: string;
    size?: string;
    isNew?: boolean;
  } | null>(null);

  const [initialImagePublicId, setInitialImagePublicId] = useState("");
  const [loading, setLoading] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} bytes`;
    else if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    else return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  // Load existing banner
  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const res = await fetch(`/api/banner/${id}`);
        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "Failed to load banner");
          return;
        }

        const banner = data.banner;

        setTitle(banner.title || "");
        setSubtitle(banner.subtitle || "");
        setLink(banner.link || "");
        setOrder(banner.order ?? 0);
        setActive(banner.active ?? true);

        setBannerImage({
          url: banner.image.url,
          public_id: banner.image.public_id,
          isNew: false,
        });

        setInitialImagePublicId(banner.image.public_id);
      } catch (err: any) {
        toast.error(err.message || "Something went wrong");
      }
    };

    fetchBanner();
  }, [id]);

  const handleRemoveBannerImage = () => {
    if (bannerImage?.url && bannerImage.isNew) {
      URL.revokeObjectURL(bannerImage.url);
    }
    setBannerImage(null);
  };

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
          isNew: true,
        });
      }
    };

    reader.readAsDataURL(file);
  };

  const updateBanner = async () => {
    if (!bannerImage?.url) {
      toast.error("Please upload a banner image");
      return;
    }

    setLoading(true);

    try {
      let finalImage = {
        url: bannerImage.url,
        public_id: bannerImage.public_id || "",
      };

      //If new image uploaded
      if (bannerImage.isNew) {
        if (initialImagePublicId) {
          await deleteMedia(initialImagePublicId);
        }

        const blob = dataURItoBlob(bannerImage.url);
        if (!blob) throw new Error("Failed to process image");

        const file = new File([blob], "banner", { type: blob.type });
        const uploadResponse = await uploadMedia(file, "banners");

        finalImage = {
          url: uploadResponse[0].url,
          public_id: uploadResponse[0].public_id,
        };
      }

      const res = await fetch(`/api/banner/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subtitle,
          link,
          order,
          active,
          image: finalImage,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update banner");
      }

      toast.success("Banner updated successfully!");
      router.push("/admin/banners");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl text-center font-bold mb-6">Edit Banner</h1>

      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            className="w-full border rounded-lg p-3"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Subtitle */}
        <div>
          <label className="block text-sm font-medium mb-1">Subtitle</label>
          <input
            className="w-full border rounded-lg p-3"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
          />
        </div>

        {/* Link */}
        <div>
          <label className="block text-sm font-medium mb-1">Link</label>
          <input
            className="w-full border rounded-lg p-3"
            value={link}
            onChange={(e) => setLink(e.target.value)}
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
          />
        </div>

        {/* Active Toggle */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">Active</label>
          <button
            type="button"
            onClick={() => setActive(!active)}
            className={`px-4 py-2 rounded-lg text-white font-semibold transition
              ${
                active
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-gray-500 hover:bg-gray-600"
              }
            `}
          >
            {active ? "Active" : "Inactive"}
          </button>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium mb-1">Banner Image</label>

          <div className="flex items-start gap-4">
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

        <button
          onClick={updateBanner}
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg disabled:opacity-50"
        >
          {loading ? "Updating..." : "Update Banner"}
        </button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { deleteMedia } from "@/utils/files/requests";
import {
  Plus,
  Pencil,
  Trash2,
  Image as ImageIcon,
  ArrowLeft,
} from "lucide-react";

type BannerItem = {
  _id: string;
  title: string;
  subtitle?: string;
  order?: number | null;
  active?: boolean;
  link?: string;
  image: {
    url: string;
    public_id: string;
  };
  createdBy?: {
    name?: string;
    email?: string;
    role?: string;
  };
  createdAt?: string;
};

export default function BannersPage() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await fetch("/api/banner");
        const data = await res.json();

        if (res.ok && data.banners) {
          setBanners(data.banners);
        }
      } catch (err) {
        console.error("Failed to load banners:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  const deleteBanner = async (id: string, public_id: string) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;

    try {
      // 1. Delete Cloudinary image
      await deleteMedia(public_id);

      // 2. Delete banner from DB
      const res = await fetch(`/api/banner/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to delete banner");
        return;
      }

      toast.success("Banner deleted successfully");

      // 3. Update UI
      setBanners((prev) => prev.filter((b) => b._id !== id));
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 px-4 py-6 pt-24 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-3xl border border-white/50 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 sm:p-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-sm font-medium text-teal-600 transition hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Admin
            </Link>

            <p className="mt-3 text-sm font-semibold uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400">
              Admin Panel
            </p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
              Banners
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Manage homepage banners.
            </p>
          </div>

          <Link
            href="/admin/banners/newbanner"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-600"
          >
            <Plus className="h-4 w-4" />
            Add New Banner
          </Link>
        </div>

        {banners.length === 0 ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-col items-center gap-3 px-4 py-12 text-center dark:px-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl dark:bg-slate-800">
                <ImageIcon className="h-5 w-5" />
              </div>
              <p className="max-w-sm text-sm text-slate-600 dark:text-slate-300">
                No banners found.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {banners.map((banner) => (
              <div
                key={banner._id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
              >
                {/* Image */}
                <div className="relative h-40 w-full bg-slate-100 dark:bg-slate-800">
                  <Image
                    src={banner.image.url}
                    alt={banner.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 300px"
                    className="object-cover"
                  />
                </div>

                {/* Content */}
                <div className="p-5">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {banner.title}
                  </h2>

                  {banner.subtitle && (
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {banner.subtitle}
                    </p>
                  )}

                  <div className="mt-3 text-sm text-slate-700 dark:text-slate-300 space-y-1">
                    <p>
                      <span className="font-medium text-slate-900 dark:text-white">
                        Order:
                      </span>{" "}
                      {banner.order ?? "None"}
                    </p>

                    <p>
                      <span className="font-medium text-slate-900 dark:text-white">
                        Active:
                      </span>{" "}
                      {banner.active ? (
                        <span className="text-emerald-600 font-semibold">
                          Yes
                        </span>
                      ) : (
                        <span className="text-red-600 font-semibold">No</span>
                      )}
                    </p>

                    {banner.link && (
                      <p>
                        <span className="font-medium text-slate-900 dark:text-white">
                          Link:
                        </span>{" "}
                        <a
                          href={banner.link}
                          target="_blank"
                          className="text-blue-600 underline"
                        >
                          {banner.link}
                        </a>
                      </p>
                    )}

                    {banner.createdBy && (
                      <div className="mt-3 p-3 rounded-md border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                        <p className="font-medium text-slate-900 dark:text-white mb-1">
                          Created By:
                        </p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-tight">
                          {banner.createdBy.name}
                          <br />
                          <span className="text-slate-600 dark:text-slate-400">
                            {banner.createdBy.email}
                          </span>
                          <br />
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {banner.createdBy.role}
                          </span>
                        </p>
                      </div>
                    )}

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      Created: {new Date(banner.createdAt!).toLocaleString()}
                    </p>
                  </div>

                  {/* Buttons */}
                  <div className="mt-4 flex items-center justify-between">
                    <Link
                      href={`/admin/banners/${banner._id}/editbanner`}
                      className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-300"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Link>

                    <button
                      onClick={() =>
                        deleteBanner(banner._id, banner.image.public_id)
                      }
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

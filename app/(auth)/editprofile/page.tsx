"use client";

import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Save, Upload, Trash2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { deleteMedia, uploadMedia } from "@/utils/files/requests";
import DotLoaderSpinner from "@/components/shared/DotLoader";
import { UserType } from "@/utils/types";

type AvatarState = {
  url: string;
  size?: string;
  type?: string;
} | null;

type AvatarValue = {
  image_url: string;
  public_id: string | null;
} | null;

export default function EditProfilePage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user as (UserType & { id: string }) | undefined;

  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [avatar, setAvatar] = useState<AvatarState>(null);
  const [loading, setLoading] = useState(false);
  const [currentPublicId, setCurrentPublicId] = useState<string | null>(null);
  const [shouldRemoveAvatar, setShouldRemoveAvatar] = useState(false);

  useEffect(() => {
    if (!user) return;

    setName(user.name || "");
    setImage(user.avatar?.image_url || "");
    setCurrentPublicId(user.avatar?.public_id ?? null);
  }, [user]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const handleAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.[0]) return;

    const file = event.target.files[0];
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (file.size > 5 * 1024 * 1024) {
      toast.error("The selected photo is larger than 5MB");
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      toast.error("The selected photo must be JPG, PNG, or WEBP");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setAvatar({
          url: e.target.result as string,
          size: formatFileSize(file.size),
          type: file.type,
        });
        setShouldRemoveAvatar(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatar(null);
    setImage("");
    setShouldRemoveAvatar(true);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const nameParts = name.trim().split(/\s+/).filter(Boolean);
    if (nameParts.length < 2) {
      toast.error("Please enter at least two names");
      return;
    }

    setLoading(true);

    try {
      if (shouldRemoveAvatar) {
        if (currentPublicId) {
          try {
            await deleteMedia(currentPublicId);
          } catch {
            console.error("Failed to delete old avatar:", currentPublicId);
          }
        }

        const { error } = await authClient.updateUser({
          name,
          avatar: null,
          image: null,
        } as any);

        if (error) throw new Error(error.message || "Update failed");

        toast.success("Profile updated successfully");
        router.push("/profile");
        router.refresh();
        return;
      }

      let newAvatar: AvatarValue = null;

      if (avatar?.url) {
        const blob = await fetch(avatar.url).then((res) => res.blob());
        const file = new File([blob], "avatar", { type: blob.type });

        const uploadResponse = await uploadMedia(file, "avatars");

        const uploadedUrl = uploadResponse[0]?.url || "";
        const uploadedPublicId = uploadResponse[0]?.public_id || null;

        newAvatar = {
          image_url: uploadedUrl,
          public_id: uploadedPublicId,
        };

        if (currentPublicId) {
          try {
            await deleteMedia(currentPublicId);
          } catch {
            console.error("Failed to delete old avatar:", currentPublicId);
          }
        }
      }

      const { error } = await authClient.updateUser({
        name,
        avatar: newAvatar ?? user?.avatar ?? null,
        image: newAvatar?.image_url ?? user?.image ?? null,
      } as any);

      if (error) throw new Error(error.message || "Update failed");

      toast.success("Profile updated successfully");
      router.push("/profile");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setLoading(false);
    }
  };

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center text-gray-600 dark:text-gray-300">
        Loading...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center text-gray-600 dark:text-gray-300">
        Not Signed In
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 px-4 py-6 pt-24 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/profile"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Profile
        </Link>

        <div className="rounded-3xl border border-white/50 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 sm:p-8">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400">
              Account Settings
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
              Edit Profile
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Update your name and profile photo. Old images are deleted
              automatically.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Profile Picture
              </label>

              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="relative mx-auto h-28 w-28 overflow-hidden rounded-full border-4 border-teal-400 shadow-lg sm:mx-0">
                  <Image
                    src={avatar?.url || image || "/images/default-avatar.png"}
                    alt="Profile preview"
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap gap-3">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-teal-500 dark:hover:bg-teal-600">
                      <Upload className="h-4 w-4" />
                      {avatar ? "Change Image" : "Upload Image"}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleAvatar}
                      />
                    </label>

                    {(avatar || image) && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                    <p>JPG, PNG or WEBP, max 5MB.</p>
                    {avatar?.size && (
                      <p className="mt-1">Selected file: {avatar.size}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <DotLoaderSpinner loading />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

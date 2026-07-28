// app/(auth)/register/page.tsx
"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import Image from "next/image";
import { Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import dataURItoBlob from "@/utils/files/dataUrlToBlob";
import { uploadMedia } from "@/utils/files/requests";
import { authClient } from "@/lib/auth-client";
import DotLoaderSpinner from "@/components/shared/DotLoader";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatar, setAvatar] = useState<{
    url: string;
    size?: string;
    type?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0]) return;

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
      }
    };
    reader.readAsDataURL(file);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} bytes`;
    else if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    else return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setPasswordMatch(e.target.value === confirmPassword);
  };

  const handleConfirmPasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    setPasswordMatch(e.target.value === password);
  };

  const handleRemoveAvatar = () => {
    setAvatar(null);
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setAvatar(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // --- VALIDATION (same as your original) ---
    const nameParts = name.trim().split(/\s+/).filter(Boolean);
    if (nameParts.length < 2) {
      toast.error("Please enter at least two names");
      return;
    }

    if (!email || !password || !confirmPassword) {
      toast.error("Please fill all required fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const passwordRegex =
      /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

    if (!passwordRegex.test(password)) {
      toast.error("Password does not meet requirements");
      return;
    }

    setLoading(true);

    try {
      let uploaded_image: { image_url: string; public_id: string } | null =
        null;

      // --- CLOUDINARY UPLOAD (same as original) ---
      if (avatar?.url) {
        const blob = dataURItoBlob(avatar.url);
        if (!blob) throw new Error("Failed to process image");

        const file = new File([blob], "avatar", { type: blob.type });

        const uploadResponse = await uploadMedia(file, "avatars");

        uploaded_image = {
          image_url: uploadResponse[0].url,
          public_id: uploadResponse[0].public_id,
        };
      }

      const { data, error } = await authClient.signUp.email({
        name,
        email,
        password,
        image: uploaded_image?.image_url,

        avatar: uploaded_image,
        callbackURL: "/dashboard",
      } as any);

      if (error) throw new Error(error.message || "Registration failed");

      toast.success("Welcome! Please check your email to verify your account.");
      resetForm();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Registration failed",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md pt-10 mx-auto mt-10 bg-white dark:bg-gray-900 p-6 rounded-xl shadow">
      {loading && <DotLoaderSpinner loading={loading} />}
      {/* Logo */}
      <div className="mb-6 flex flex-col items-center z-10">
        <Image
          src="/images/logo.jpeg"
          alt="CrowdLang Logo"
          width={120}
          height={120}
          className="opacity-95 drop-shadow-xl"
        />
      </div>
      <h1 className="text-2xl font-bold mb-6">Create Account</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* NAME */}
        <div>
          <label className="block mb-1 text-sm font-medium">Name</label>
          <input
            type="text"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-md border dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
          />
        </div>

        {/* EMAIL */}
        <div>
          <label className="block mb-1 text-sm font-medium">Email</label>
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-md border dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
          />
        </div>

        {/* PASSWORD FIELD */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Password <span className="text-red-500">*</span>
          </label>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordMatch(e.target.value === confirmPassword);
              }}
              placeholder="Enter password"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
         bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
         outline-none transition pr-10"
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 
         hover:text-gray-700 dark:hover:text-gray-300"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Password Strength Indicators */}
          {password && (
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              {[
                { valid: password.length >= 8, label: "8+ characters" },
                { valid: /\d/.test(password), label: "Number" },
                {
                  valid: /[!@#$%^&*]/.test(password),
                  label: "Special character",
                },
                { valid: /[a-z]/.test(password), label: "Lowercase letter" },
                { valid: /[A-Z]/.test(password), label: "Uppercase letter" },
              ].map((item, i) => (
                <span
                  key={i}
                  className={`flex items-center ${
                    item.valid
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {item.valid ? (
                    <CheckCircle2 size={14} className="mr-1" />
                  ) : (
                    <XCircle size={14} className="mr-1" />
                  )}
                  {item.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* CONFIRM PASSWORD FIELD */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Confirm Password <span className="text-red-500">*</span>
          </label>

          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setPasswordMatch(password === e.target.value);
              }}
              placeholder="Re-enter password"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
         bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
         outline-none transition pr-10"
              required
            />

            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 
         hover:text-gray-700 dark:hover:text-gray-300"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Password Match Indicator */}
          {confirmPassword && (
            <div
              className={`mt-2 flex items-center text-sm ${
                passwordMatch
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {passwordMatch ? (
                <CheckCircle2 size={16} className="mr-1" />
              ) : (
                <XCircle size={16} className="mr-1" />
              )}
              {passwordMatch ? "Passwords match" : "Passwords do not match"}
            </div>
          )}
        </div>

        {/* Avatar Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Profile Picture
          </label>

          <div className="flex items-start gap-4">
            {/* Preview or Placeholder */}
            <div className="relative">
              {avatar ? (
                <>
                  <Image
                    src={avatar.url}
                    alt="Profile preview"
                    width={96}
                    height={96}
                    className="rounded-full w-24 h-24 object-cover border-2 border-gray-300 dark:border-gray-600"
                  />

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                    aria-label="Remove profile picture"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </>
              ) : (
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                  <span className="text-gray-400 dark:text-gray-500 text-xs">
                    No image
                  </span>
                </div>
              )}
            </div>

            {/* Upload Button + Info */}
            <div className="flex-1">
              <label className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg shadow-sm transition-all duration-200 border border-gray-600 dark:border-gray-500 bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white cursor-pointer active:scale-[0.98] hover:shadow-md">
                {avatar ? (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                      />
                    </svg>
                    Change Image
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3V15"
                      />
                    </svg>
                    Upload Image
                  </>
                )}

                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatar}
                />
              </label>

              {avatar?.size && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Size: {avatar.size}
                </p>
              )}

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                JPG, PNG or WEBP (max 5MB)
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center py-3 px-6 text-lg font-semibold rounded-xl transition-all duration-200 ease-in-out
      ${
        loading
          ? "bg-indigo-400 dark:bg-indigo-600 cursor-not-allowed"
          : "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 hover:shadow-lg transform hover:-translate-y-0.5"
      }
      text-white focus:outline-none focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-800
      border border-transparent hover:border-indigo-500 dark:hover:border-indigo-400`}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Creating account...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
                Create Account
              </>
            )}
          </button>
        </div>
        <div className="mt-5 text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="
      text-blue-600 dark:text-blue-400
      hover:text-blue-700 dark:hover:text-blue-300
      hover:underline
      font-medium
      focus-visible:outline-none
      focus-visible:ring-2
      focus-visible:ring-blue-500
      rounded-sm
    "
          >
            Sign in
          </Link>
        </div>
      </form>
    </div>
  );
}

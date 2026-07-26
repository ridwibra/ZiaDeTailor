"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, XCircle, Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import DotLoaderSpinner from "@/components/shared/DotLoader";

export default function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [loading, setLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [password, setPassword] = useState("");
  const [confPassword, setConfPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const router = useRouter();

  const passwordMatch = password === confPassword;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setResetError("This reset link is invalid or has expired.");
      return;
    }

    if (!passwordMatch) {
      setResetError("Passwords must match");
      return;
    }

    const passwordRegex =
      /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

    if (!passwordRegex.test(password)) {
      setResetError("Password does not meet complexity requirements.");
      return;
    }

    try {
      setLoading(true);
      setResetError("");

      const { error } = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (error) {
        const errorMessage = error.message?.toLowerCase() || "";
        const isTokenError =
          errorMessage.includes("token") || errorMessage.includes("input");

        throw new Error(
          isTokenError
            ? "This reset link is invalid or has already been used. Please request a new password reset."
            : error.message || "Failed to reset password.",
        );
      }

      toast.success("Password reset successful!");
      setTimeout(() => router.push("/login"), 2000);
    } catch (error) {
      setResetError(
        error instanceof Error ? error.message : "An error occurred",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 min-h-screen w-full flex flex-col items-center justify-center px-4 py-10 bg-[#f7f9fc] dark:bg-[#0f172a] relative">
      {loading && <DotLoaderSpinner loading={loading} />}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(0,200,255,0.12),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 -z-10 bg-[url('/noise.png')] opacity-[0.04] mix-blend-overlay pointer-events-none" />

      <div className="mb-6 mt-2 flex flex-col items-center z-10">
        <Image
          src="/images/logo.jpeg"
          alt="Logo"
          width={120}
          height={120}
          className="opacity-95 drop-shadow-xl"
        />
      </div>

      <div className="w-full max-w-md bg-white dark:bg-[#1e293b]/80 border border-[#e5e7eb] dark:border-[#334155] shadow-xl rounded-3xl p-8 z-10">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-[#1f2937] dark:text-white">
            Reset Password
          </h1>
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-300 hover:underline text-sm font-medium mt-2"
          >
            Return to login
          </Link>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-[#1f2937] dark:text-[#e2e8f0] mb-1">
              New Password*
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
                className={`w-full px-4 py-3 rounded-xl bg-[#f3f4f6] dark:bg-[#1e293b] text-[#1f2937] dark:text-white border ${resetError ? "border-red-500" : "border-[#e5e7eb]"} outline-none focus:ring-2 focus:ring-teal-500 transition-all pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b]"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {password && (
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                {[
                  password.length >= 8,
                  /\d/.test(password),
                  /[!@#$%^&*]/.test(password),
                  /[a-z]/.test(password),
                  /[A-Z]/.test(password),
                ].map((valid, i) => (
                  <span
                    key={i}
                    className={`flex items-center gap-1 ${valid ? "text-green-600" : "text-red-600"}`}
                  >
                    {valid ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    {
                      [
                        "8+ chars",
                        "Number",
                        "Special",
                        "Lowercase",
                        "Uppercase",
                      ][i]
                    }
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1f2937] dark:text-[#e2e8f0] mb-1">
              Confirm Password*
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confPassword}
                onChange={(e) => setConfPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                className={`w-full px-4 py-3 rounded-xl bg-[#f3f4f6] dark:bg-[#1e293b] text-[#1f2937] dark:text-white border ${!passwordMatch && confPassword ? "border-red-500" : "border-[#e5e7eb]"} outline-none focus:ring-2 focus:ring-teal-500 transition-all pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b]"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {!passwordMatch && confPassword && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                Passwords do not match
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !passwordMatch || password.length < 8}
            className="w-full py-3 rounded-xl text-black font-semibold bg-gradient-to-r from-teal-400 to-cyan-500 hover:opacity-90 disabled:opacity-50 flex items-center justify-center transition-all"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>

          {resetError && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 text-sm border border-red-200">
              {resetError}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

// app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import DotLoaderSpinner from "@/components/shared/DotLoader";

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loginError, setLoginError] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setEmailError("");
    setPasswordError("");
    setLoginError("");

    if (!email) return setEmailError("Email is required");
    if (!isValidEmail(email)) return setEmailError("Invalid email address");
    if (!password) return setPasswordError("Password is required");

    setLoading(true);

    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result.error) {
        setLoginError(result.error.message || "Login failed.");
      } else {
        toast.success("Login successful!");
        router.push("/");
      }
    } catch (error) {
      setLoginError(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="
        min-h-screen w-full 
        flex flex-col items-center 
        justify-center 
        px-4 py-10 
        bg-[#f7f9fc] 
        dark:bg-[#0f172a]
        relative
      "
    >
      {loading && <DotLoaderSpinner loading={loading} />}
      {/* Glow + Noise */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(0,200,255,0.12),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 -z-10 bg-[url('/noise.png')] opacity-[0.04] mix-blend-overlay pointer-events-none" />

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

      {/* Card */}
      <div
        className="
          w-full max-w-md 
          bg-white 
          dark:bg-[#1e293b]/80 
          border border-[#e5e7eb] dark:border-[#334155] 
          shadow-xl 
          rounded-3xl 
          p-8 
          z-10
        "
      >
        {loading && <DotLoaderSpinner loading={loading} />}

        <h1 className="text-3xl font-bold text-center text-[#1f2937] dark:text-white mb-6">
          Welcome Back
        </h1>

        <form onSubmit={onSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-[#1f2937] dark:text-[#e2e8f0] mb-1"
            >
              Email Address*
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={`
                w-full px-4 py-3 rounded-xl 
                bg-[#f3f4f6] dark:bg-[#1e293b] 
                text-[#1f2937] dark:text-white 
                border 
                ${
                  emailError
                    ? "border-red-500 focus:ring-red-500"
                    : "border-[#e5e7eb] dark:border-[#334155]"
                }
                placeholder-[#94a3b8]
                focus:ring-2 focus:ring-teal-500 
                outline-none transition-all
              `}
            />

            {emailError && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {emailError}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-[#1f2937] dark:text-[#e2e8f0] mb-1"
            >
              Password*
            </label>

            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`
                  w-full px-4 py-3 rounded-xl 
                  bg-[#f3f4f6] dark:bg-[#1e293b] 
                  text-[#1f2937] dark:text-white 
                  border 
                  ${
                    passwordError
                      ? "border-red-500 focus:ring-red-500"
                      : "border-[#e5e7eb] dark:border-[#334155]"
                  }
                  placeholder-[#94a3b8]
                  focus:ring-2 focus:ring-teal-500 
                  outline-none transition-all
                  pr-10
                `}
              />

              <button
                type="button"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="
                  absolute right-3 top-1/2 -translate-y-1/2 
                  text-[#64748b] dark:text-[#94a3b8] 
                  hover:text-[#1f2937] dark:hover:text-white
                  transition
                "
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {passwordError && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {passwordError}
              </p>
            )}
          </div>

          {/* Forgot Password */}
          <div className="flex justify-end">
            <Link
              href="/forgot"
              className="text-sm font-medium text-teal-600 dark:text-teal-300 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="
              w-full py-3 rounded-xl 
              text-black text-base font-semibold 
              flex items-center justify-center 
              transition-all duration-200
              bg-gradient-to-r from-teal-400 to-cyan-500
              hover:opacity-90
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          {/* Error */}
          {loginError && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 text-sm">
              {loginError}
            </div>
          )}

          {/* Social Login — ONLY GOOGLE */}
          <div className="mt-8">
            <p className="text-center text-[#475569] dark:text-[#cbd5e1] mb-4 tracking-wide">
              or continue with
            </p>

            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => authClient.signIn.social({ provider: "google" })}
                className="
                  py-2.5 rounded-xl 
                  bg-[#f3f4f6] dark:bg-[#1e293b] 
                  border border-[#e5e7eb] dark:border-[#334155] 
                  text-[#1f2937] dark:text-white 
                  hover:bg-[#e2e8f0] dark:hover:bg-[#334155] 
                  transition text-sm
                "
              >
                Google
              </button>
            </div>
          </div>

          {/* Register */}
          <div className="text-center text-sm text-[#64748b] dark:text-[#cbd5e1] mt-6">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-teal-600 dark:text-teal-300 hover:underline font-medium"
            >
              Register
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

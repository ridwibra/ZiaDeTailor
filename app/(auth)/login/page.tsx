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

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const togglePasswordVisibility = () => {
    setShowPassword((previous) => !previous);
  };

  const handleGoogleSignIn = async () => {
    setEmailError("");
    setPasswordError("");
    setLoginError("");
    setLoading(true);

    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
      });

      if (result?.error) {
        throw new Error(
          result.error.message || "Unable to start Google sign-in.",
        );
      }

      /*
        Better Auth redirects the browser to Google.
        Do not set loading to false here: the user should leave this page.
      */
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to start Google sign-in.";

      console.error("Google sign-in error:", error);

      setLoginError(message);
      toast.error(message);
      setLoading(false);
    }
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setEmailError("");
    setPasswordError("");
    setLoginError("");

    if (!email.trim()) {
      setEmailError("Email is required.");
      return;
    }

    if (!isValidEmail(email.trim())) {
      setEmailError("Invalid email address.");
      return;
    }

    if (!password) {
      setPasswordError("Password is required.");
      return;
    }

    setLoading(true);

    try {
      const result = await authClient.signIn.email({
        email: email.trim(),
        password,
      });

      if (result.error) {
        setLoginError(result.error.message || "Login failed.");
        return;
      }

      toast.success("Login successful!");
      router.push("/");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.";

      console.error("Email sign-in error:", error);
      setLoginError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center bg-[#f7f9fc] px-4 py-10 dark:bg-[#0f172a]">
      {loading ? <DotLoaderSpinner loading={loading} /> : null}

      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(0,200,255,0.12),transparent_70%)]" />

      <div className="pointer-events-none absolute inset-0 -z-10 bg-[url('/noise.png')] opacity-[0.04] mix-blend-overlay" />

      <div className="z-10 mb-6 flex flex-col items-center">
        <Image
          src="/images/logo.jpeg"
          alt="Zia Detailor logo"
          width={120}
          height={120}
          priority
          className="opacity-95 drop-shadow-xl"
        />
      </div>

      <section className="z-10 w-full max-w-md rounded-3xl border border-[#e5e7eb] bg-white p-8 shadow-xl dark:border-[#334155] dark:bg-[#1e293b]/80">
        <h1 className="mb-6 text-center text-3xl font-bold text-[#1f2937] dark:text-white">
          Welcome Back
        </h1>

        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-semibold text-[#1f2937] dark:text-[#e2e8f0]"
            >
              Email Address*
            </label>

            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setEmailError("");
                setLoginError("");
              }}
              placeholder="you@example.com"
              disabled={loading}
              className={`w-full rounded-xl border bg-[#f3f4f6] px-4 py-3 text-[#1f2937] outline-none transition-all placeholder:text-[#94a3b8] focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#1e293b] dark:text-white ${
                emailError
                  ? "border-red-500 focus:ring-red-500"
                  : "border-[#e5e7eb] dark:border-[#334155]"
              }`}
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? "email-error" : undefined}
            />

            {emailError ? (
              <p
                id="email-error"
                className="mt-1 text-sm text-red-600 dark:text-red-400"
              >
                {emailError}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-semibold text-[#1f2937] dark:text-[#e2e8f0]"
            >
              Password*
            </label>

            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setPasswordError("");
                  setLoginError("");
                }}
                placeholder="••••••••"
                disabled={loading}
                className={`w-full rounded-xl border bg-[#f3f4f6] px-4 py-3 pr-10 text-[#1f2937] outline-none transition-all placeholder:text-[#94a3b8] focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#1e293b] dark:text-white ${
                  passwordError
                    ? "border-red-500 focus:ring-red-500"
                    : "border-[#e5e7eb] dark:border-[#334155]"
                }`}
                aria-invalid={Boolean(passwordError)}
                aria-describedby={passwordError ? "password-error" : undefined}
              />

              <button
                type="button"
                onClick={togglePasswordVisibility}
                disabled={loading}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] transition hover:text-[#1f2937] disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#94a3b8] dark:hover:text-white"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            {passwordError ? (
              <p
                id="password-error"
                className="mt-1 text-sm text-red-600 dark:text-red-400"
              >
                {passwordError}
              </p>
            ) : null}
          </div>

          <div className="flex justify-end">
            <Link
              href="/forgot"
              className="text-sm font-medium text-teal-600 hover:underline dark:text-teal-300"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-teal-400 to-cyan-500 py-3 text-base font-semibold text-black transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          {loginError ? (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
            >
              {loginError}
            </div>
          ) : null}

          <div className="mt-8">
            <p className="mb-4 text-center tracking-wide text-[#475569] dark:text-[#cbd5e1]">
              or continue with
            </p>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full rounded-xl border border-[#e5e7eb] bg-[#f3f4f6] py-2.5 text-sm text-[#1f2937] transition hover:bg-[#e2e8f0] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#334155] dark:bg-[#1e293b] dark:text-white dark:hover:bg-[#334155]"
            >
              {loading ? "Redirecting to Google..." : "Continue with Google"}
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-[#64748b] dark:text-[#cbd5e1]">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-teal-600 hover:underline dark:text-teal-300"
            >
              Register
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}

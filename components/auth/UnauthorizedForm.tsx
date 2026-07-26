"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function UnauthorizedPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const message = searchParams.get("message");

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace("/");
    }, 5000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-screen-md items-center justify-center px-4">
      <div className="w-full rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-red-600">Access Denied</h1>
        {message && (
          <div className="mt-3 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
            {message}
          </div>
        )}
        <p className="mt-4 text-sm text-gray-500">
          You do not have permission to view this page.
        </p>
        <button
          onClick={() => router.push("/")}
          className="mt-6 rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-900"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}

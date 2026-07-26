// components/LogoutButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login"); // Redirect after successful sign-out [1, 2]
        },
      },
    });
  };

  return (
    <button onClick={handleLogout} className="border px-3 py-2 rounded">
      Logout
    </button>
  );
}

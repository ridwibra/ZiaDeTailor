import UnauthorizedPage from "@/components/auth/UnauthorizedForm";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <UnauthorizedPage />
    </Suspense>
  );
}

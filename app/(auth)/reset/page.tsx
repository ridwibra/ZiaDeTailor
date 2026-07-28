// app/(auth)/reset/page.tsx
import ResetForm from "@/components/auth/ResetForm";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <ResetForm />
    </Suspense>
  );
}

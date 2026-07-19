import { Suspense } from "react";
import ResetPasswordPageClient from "./page-client";

function ResetPasswordLoadingFallback() {
  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-50">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <p role="status" aria-live="polite" className="text-sm text-slate-300">
          Loading reset-password form...
        </p>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoadingFallback />}>
      <ResetPasswordPageClient />
    </Suspense>
  );
}

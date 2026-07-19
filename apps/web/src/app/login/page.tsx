import { Suspense } from "react";
import LoginPageClient from "./page-client";

function LoginLoadingFallback() {
  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-50">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <p role="status" aria-live="polite" className="text-sm text-slate-300">
          Loading login form...
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoadingFallback />}>
      <LoginPageClient />
    </Suspense>
  );
}

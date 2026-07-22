"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthProvider";
import { Button, Card } from "@bidra/ui";

export default function AccountPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-50">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <Card className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
          <h1 className="text-2xl font-semibold">Account</h1>
          {loading ? <p className="mt-4 text-slate-300">Loading session...</p> : null}
          {!loading && user ? (
            <div className="mt-4 space-y-2 text-slate-200">
              <p>{user.name || "No name set"}</p>
              <p>{user.email}</p>
              <p>{user.emailVerified ? "Email verified" : "Email not verified"}</p>
              <p>Session: {user.sessionId || "unknown"}</p>
            </div>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" className="rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white" onClick={() => router.push("/account/security")}>
              Security
            </button>
            <button type="button" className="rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white" onClick={() => router.push("/account/sessions")}>
              Sessions
            </button>
            <Button
              className="bg-rose-600 text-white"
              onClick={async () => {
                await signOut();
                router.push("/login");
              }}
            >
              Sign out
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}

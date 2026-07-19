"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthProvider";
import { Button, Card } from "@bidra/ui";

export default function AccountSecurityPage() {
  const router = useRouter();
  const { user, logoutAll, revokeOtherSessions } = useAuth();

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-50">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <Card className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
          <h1 className="text-2xl font-semibold">Security</h1>
          <p className="mt-2 text-sm text-slate-300">Signed in as {user?.email || "unknown"}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button className="bg-slate-700 text-white" onClick={() => void revokeOtherSessions()}>
              Revoke other sessions
            </Button>
            <Button className="bg-rose-600 text-white" onClick={() => void logoutAll()}>
              Log out everywhere
            </Button>
          </div>
          <p className="mt-4 text-sm text-slate-300">
            <button type="button" className="text-emerald-300 underline underline-offset-4" onClick={() => router.push("/account/sessions")}>
              Manage sessions
            </button>
          </p>
        </Card>
      </div>
    </main>
  );
}

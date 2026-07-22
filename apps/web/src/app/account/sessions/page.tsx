"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthProvider";
import { Button, Card } from "@bidra/ui";

export default function AccountSessionsPage() {
  const router = useRouter();
  const { sessions, reloadSessions, revokeSession, loading, user } = useAuth();

  useEffect(() => {
    void reloadSessions();
  }, [reloadSessions]);

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-50">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <Card className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
          <h1 className="text-2xl font-semibold">Sessions</h1>
          <p className="mt-2 text-sm text-slate-300">Signed in as {user?.email || "unknown"}</p>
          {loading ? <p className="mt-4 text-slate-300">Loading...</p> : null}
          <div className="mt-4 space-y-3">
            {sessions.map((session) => (
              <div key={session.id} className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-100">{session.deviceName || "Unknown device"}</p>
                    <p className="text-sm text-slate-400">Last active: {session.lastActivityAt}</p>
                    <p className="text-sm text-slate-400">Expires: {session.expiresAt}</p>
                  </div>
                  <Button className="bg-rose-600 text-white" onClick={() => void revokeSession(session.id)}>
                    Revoke
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-300">
            <button type="button" className="text-emerald-300 underline underline-offset-4" onClick={() => router.push("/account/security")}>
              Back to security
            </button>
          </p>
        </Card>
      </div>
    </main>
  );
}

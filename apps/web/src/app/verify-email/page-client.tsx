"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Button, Card, Input } from "@bidra/ui";
import { authService } from "@/services/authService";
import { getQueryToken } from "../auth-route-utils";

export default function VerifyEmailPageClient() {
  const searchParams = useSearchParams();
  const token = getQueryToken(searchParams.get("token"));
  const [manualToken, setManualToken] = useState(token);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }

    (async () => {
      setLoading(true);
      const result = await authService.verifyEmail(token);
      setLoading(false);
      setMessage(result.error ? result.error.message : result.message);
    })();
  }, [token]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const result = await authService.verifyEmail(manualToken);
    setLoading(false);
    setMessage(result.error ? result.error.message : result.message);
  };

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-50">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <Card className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
          <h1 className="text-2xl font-semibold">Verify email</h1>
          <form className="mt-6 flex flex-col gap-3" onSubmit={handleSubmit}>
            <Input value={manualToken} onChange={(event) => setManualToken(event.currentTarget.value)} placeholder="Verification token" />
            <Button type="submit" disabled={loading} className="bg-emerald-500 text-white">
              {loading ? "Verifying..." : "Verify email"}
            </Button>
          </form>
          {message ? <p className="mt-4 text-sm text-emerald-300">{message}</p> : null}
          <p className="mt-4 text-sm text-slate-300">
            <button type="button" className="text-emerald-300 underline underline-offset-4" onClick={() => window.location.assign("/login")}>
              Back to login
            </button>
          </p>
        </Card>
      </div>
    </main>
  );
}

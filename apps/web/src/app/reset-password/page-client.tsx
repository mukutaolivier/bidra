"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, Card, Input } from "@bidra/ui";
import { authService } from "@/services/authService";
import { getQueryToken } from "../auth-route-utils";

export default function ResetPasswordPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = getQueryToken(searchParams.get("token"));
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const result = await authService.resetPassword(token, newPassword);
    setLoading(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    setMessage(result.message);
    router.push("/login");
  };

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-50">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <Card className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
          <h1 className="text-2xl font-semibold">Reset password</h1>
          <form className="mt-6 flex flex-col gap-3" onSubmit={handleSubmit}>
            <Input value={token} readOnly placeholder="Reset token" />
            <Input
              value={newPassword}
              onChange={(event) => setNewPassword(event.currentTarget.value)}
              type="password"
              placeholder="New password"
              required
            />
            <Button type="submit" disabled={loading || !token} className="bg-emerald-500 text-white">
              {loading ? "Updating..." : "Reset password"}
            </Button>
          </form>
          {message ? <p className="mt-4 text-sm text-emerald-300">{message}</p> : null}
          <p className="mt-4 text-sm text-slate-300">
            <button type="button" className="text-emerald-300 underline underline-offset-4" onClick={() => router.push("/login")}>
              Back to login
            </button>
          </p>
        </Card>
      </div>
    </main>
  );
}

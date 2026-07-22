"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input } from "@bidra/ui";
import { authService } from "@/services/authService";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const result = await authService.forgotPassword(email);
    setLoading(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    setMessage(result.message);
  };

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-50">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <Card className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
          <h1 className="text-2xl font-semibold">Forgot password</h1>
          <form className="mt-6 flex flex-col gap-3" onSubmit={handleSubmit}>
            <Input value={email} onChange={(event) => setEmail(event.currentTarget.value)} type="email" placeholder="Email" required />
            <Button type="submit" disabled={loading} className="bg-emerald-500 text-white">
              {loading ? "Sending..." : "Send reset link"}
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

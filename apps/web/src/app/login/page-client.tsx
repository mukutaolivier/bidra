"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, Card, Input } from "@bidra/ui";
import { authService } from "@/services/authService";
import { getSafeReturnTo } from "../auth-route-utils";

export default function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = getSafeReturnTo(searchParams.get("returnTo"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const result = await authService.signIn(email, password, rememberMe);

    setLoading(false);

    if (result.error) {
      setErrorMessage(result.error.message);
      return;
    }

    router.push(returnTo);
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-50">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <Card className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
          <h1 className="text-2xl font-semibold">Login</h1>
          <p className="mt-2 text-sm text-slate-300">Sign in with your Bidra account.</p>

          <form className="mt-6 flex flex-col gap-3" onSubmit={handleSubmit}>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.currentTarget.value)}
              required
            />
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.currentTarget.checked)}
              />
              Remember me
            </label>
            <Button type="submit" disabled={loading} className="bg-emerald-500 text-white">
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          {errorMessage ? <p className="mt-4 text-sm text-rose-300">{errorMessage}</p> : null}

          <div className="mt-4 flex flex-col gap-2 text-sm text-slate-300">
            <button type="button" className="text-left text-emerald-300 underline underline-offset-4" onClick={() => router.push("/register")}>
              Create an account
            </button>
            <button type="button" className="text-left text-emerald-300 underline underline-offset-4" onClick={() => router.push("/forgot-password")}>
              Forgot password?
            </button>
          </div>
        </Card>
      </div>
    </main>
  );
}

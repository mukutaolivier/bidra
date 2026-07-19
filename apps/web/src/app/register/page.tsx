"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, Card, Input } from "@bidra/ui";
import { authService } from "@/services/authService";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setMessage(null);

    const result = await authService.signUp(email, password, name);

    setLoading(false);

    if (result.error) {
      setErrorMessage(result.error.message);
      return;
    }

    setMessage("Account created. Check your email to verify the account.");
    router.push("/login");
  };

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-50">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <Card className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
          <h1 className="text-2xl font-semibold">Register</h1>
          <form className="mt-6 flex flex-col gap-3" onSubmit={handleSubmit}>
            <Input value={name} onChange={(event) => setName(event.currentTarget.value)} placeholder="Full name" required />
            <Input value={email} onChange={(event) => setEmail(event.currentTarget.value)} type="email" placeholder="Email" required />
            <Input value={password} onChange={(event) => setPassword(event.currentTarget.value)} type="password" placeholder="Password" required />
            <Button type="submit" disabled={loading} className="bg-emerald-500 text-white">
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>
          {errorMessage ? <p className="mt-4 text-sm text-rose-300">{errorMessage}</p> : null}
          {message ? <p className="mt-4 text-sm text-emerald-300">{message}</p> : null}
          <p className="mt-4 text-sm text-slate-300">
            Already have an account?{" "}
            <button type="button" className="text-emerald-300 underline underline-offset-4" onClick={() => router.push("/login")}>
              Sign in
            </button>
          </p>
        </Card>
      </div>
    </main>
  );
}

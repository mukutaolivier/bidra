"use client";

import { useRouter } from "next/navigation";
import { Button, Card } from "@bidra/ui";

export default function HomePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-50">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <Card className="rounded-xl border border-slate-800 bg-slate-900 p-8 shadow-lg">
          <h1 className="text-3xl font-semibold">Bidra</h1>
          <p className="mt-2 text-slate-300">
            Norwegian community contribution platform
          </p>
          <div className="mt-6 flex gap-3">
            <Button className="bg-emerald-500 text-white" onClick={() => router.push("/login")}>
              Open auth flow
            </Button>
            <Button className="bg-slate-700 text-white" onClick={() => router.push("/account")}>
              Account
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
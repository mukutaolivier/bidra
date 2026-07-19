"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@bidra/ui";
import { authService } from "@/services/authService";

export default function LogoutPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Signing out...");

  useEffect(() => {
    (async () => {
      await authService.signOut();
      setMessage("Signed out successfully.");
      router.push("/login");
    })();
  }, [router]);

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-50">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <Card className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
          <h1 className="text-2xl font-semibold">Logout</h1>
          <p className="mt-4 text-slate-300">{message}</p>
          <div className="mt-6 flex gap-3">
            <Button className="bg-slate-700 text-white" onClick={() => router.push("/")}>Home</Button>
            <Button className="bg-emerald-500 text-white" onClick={() => router.push("/login")}>
              Login
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}

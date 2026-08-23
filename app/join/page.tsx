"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Mark } from "@/components/ui";

export default function JoinPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"in" | "up">("up");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch(
      mode === "up" ? "/api/auth/signup" : "/api/auth/login",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      },
    );
    const json = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    setBusy(false);
    if (!res.ok) {
      setError(json?.error ?? "Could not enter.");
      return;
    }
    router.push("/home");
    router.refresh();
  }

  return (
    <main className="gutter mx-auto flex min-h-dvh max-w-[440px] flex-col justify-center">
      <a href="/" className="mb-12 flex items-center gap-3">
        <Mark className="h-5" />
        <span className="font-display text-[13px] font-semibold uppercase tracking-[0.65px]">
          Rosso
        </span>
      </a>
      <p className="font-display text-[11px] font-semibold uppercase tracking-[1.1px] text-muted">
        {mode === "up" ? "Create a seat" : "Enter the garage"}
      </p>
      <h1 className="mt-3 font-display text-[36px] font-medium tracking-[-0.36px]">
        {mode === "up" ? "Take a seat." : "Welcome back."}
      </h1>
      <form onSubmit={onSubmit} className="mt-10 space-y-5">
        <Field
          label="Username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <Field
          label="Password"
          type="password"
          autoComplete={mode === "up" ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error ? <p className="text-[13px] text-primary">{error}</p> : null}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Entering…" : mode === "up" ? "Create seat" : "Enter"}
        </Button>
      </form>
      <button
        type="button"
        className="mt-8 cursor-pointer font-display text-[13px] font-semibold uppercase tracking-[0.65px] text-body hover:text-ink"
        onClick={() => {
          setMode(mode === "up" ? "in" : "up");
          setError("");
        }}
      >
        {mode === "up" ? "Already have a seat — enter" : "Need a seat — create one"}
      </button>
    </main>
  );
}

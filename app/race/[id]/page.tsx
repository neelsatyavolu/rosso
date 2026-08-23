"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Mark } from "@/components/ui";
import type { PublicUser } from "@/lib/types";

type DuelView = {
  id: string;
  kind: string;
  ranked: boolean;
  status: "waiting" | "countdown" | "live" | "done";
  hostId: string;
  guestId: string | null;
  startAt: number | null;
  endsAt: number | null;
  countdownAt: number | null;
  hostScore: number;
  guestScore: number;
  winnerId: string | null;
  ratingDelta: { host: number; guest: number } | null;
  yourIndex: number;
  problem: { prompt: string; index: number } | null;
};

type Payload = {
  duel: DuelView;
  host: PublicUser | null;
  guest: PublicUser | null;
  youAreHost: boolean;
};

export default function RacePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [payload, setPayload] = useState<Payload | null>(null);
  const [value, setValue] = useState("");
  const [now, setNow] = useState(Date.now());
  const [wrong, setWrong] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const submitting = useRef(false);
  const payloadRef = useRef(payload);
  const pending = useRef<string | null>(null);
  payloadRef.current = payload;

  useEffect(() => {
    let gone = false;
    let timer: number;
    const tick = async () => {
      const res = await fetch(`/api/duels/${id}`, { cache: "no-store" });
      if (!res.ok) {
        router.push("/grid");
        return;
      }
      const json = (await res.json()) as Payload;
      if (gone) return;
      setPayload(json);
      setNow(Date.now());
      timer = window.setTimeout(
        tick,
        json.duel.status === "live" ? 400 : 900,
      );
    };
    void tick();
    const clock = window.setInterval(() => setNow(Date.now()), 200);
    return () => {
      gone = true;
      window.clearTimeout(timer);
      window.clearInterval(clock);
    };
  }, [id, router]);

  useEffect(() => {
    if (payload?.duel.status === "live") inputRef.current?.focus();
  }, [payload?.duel.status, payload?.duel.problem?.index]);

  async function submit(raw: string) {
    pending.current = raw;
    if (submitting.current) return;
    submitting.current = true;
    try {
      while (pending.current) {
        const current = payloadRef.current;
        const sending = pending.current;
        pending.current = null;
        if (!current?.duel.problem || sending === "") break;
        const res = await fetch(`/api/duels/${id}/answer`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            index: current.duel.problem.index,
            value: sending,
          }),
        });
        const json = (await res.json()) as {
          duel?: DuelView;
          correct?: boolean;
        };
        if (json.duel) {
          setPayload((p) => (p ? { ...p, duel: json.duel! } : p));
        }
        if (json.correct) {
          setValue((v) => (v === sending ? "" : v));
        }
      }
    } finally {
      submitting.current = false;
    }
  }

  async function act(action: "accept" | "decline" | "cancel") {
    await fetch(`/api/duels/${id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action }),
    });
  }

  if (!payload) {
    return (
      <main className="flex min-h-full items-center justify-center text-body">
        Forming up on the grid…
      </main>
    );
  }

  const { duel, host, guest, youAreHost } = payload;
  const you = youAreHost ? host : guest;
  const them = youAreHost ? guest : host;
  const youScore = youAreHost ? duel.hostScore : duel.guestScore;
  const themScore = youAreHost ? duel.guestScore : duel.hostScore;

  const remain = duel.endsAt
    ? Math.max(0, Math.ceil((duel.endsAt - now) / 1000))
    : 60;
  const count =
    duel.startAt && duel.status === "countdown"
      ? Math.max(1, Math.ceil((duel.startAt - now) / 1000))
      : 0;

  if (duel.status === "waiting") {
    return (
      <main className="mx-auto flex min-h-full max-w-xl flex-col justify-center px-4">
        <Mark className="h-6" />
        <h1 className="mt-8 font-display text-[36px] font-medium tracking-[-0.36px]">
          {youAreHost ? "Waiting on the other side of the garage." : "You’ve been called to the grid."}
        </h1>
        <p className="mt-4 text-body">
          {youAreHost
            ? `${guest?.username ?? "Your friend"} has to accept. Ranked. Same problems.`
            : `${host?.username} wants a 60-second lap.`}
        </p>
        <div className="mt-10 flex gap-4">
          {youAreHost ? (
            <Button variant="outline" onClick={() => act("cancel")}>
              Withdraw
            </Button>
          ) : (
            <>
              <Button onClick={() => act("accept")}>Accept</Button>
              <Button variant="outline" onClick={() => act("decline")}>
                Decline
              </Button>
            </>
          )}
        </div>
      </main>
    );
  }

  if (duel.status === "countdown") {
    return (
      <main className="flex min-h-full flex-col items-center justify-center">
        <p className="font-display text-[11px] font-semibold uppercase tracking-[1.1px] text-muted">
          Get ready — same problems, fastest wins
        </p>
        <div className="mt-8 font-display text-[140px] font-bold leading-none tracking-[-1.6px] text-primary">
          {count}
        </div>
        <p className="mt-6 text-body">
          {you?.username} vs {them?.username ?? "PACE"}
        </p>
      </main>
    );
  }

  if (duel.status === "done") {
    const youWon = duel.winnerId === (youAreHost ? duel.hostId : duel.guestId);
    const draw = duel.winnerId === null;
    const delta = youAreHost
      ? duel.ratingDelta?.host
      : duel.ratingDelta?.guest;
    return (
      <main className="mx-auto flex min-h-full max-w-2xl flex-col justify-center px-4">
        <p className="font-display text-[11px] font-semibold uppercase tracking-[1.1px] text-muted">
          Chequered flag
        </p>
        <h1 className="mt-4 font-display text-[56px] font-medium tracking-[-1.12px]">
          {draw ? "Dead heat." : youWon ? "You take it." : "Second."}
        </h1>
        <div className="mt-10 grid grid-cols-2 gap-px bg-hairline">
          <div className="bg-canvas p-6">
            <div className="font-display text-[80px] font-bold leading-none tracking-[-1.6px] text-primary tabular">
              {youScore}
            </div>
            <div className="mt-2 text-body">{you?.username ?? "You"}</div>
          </div>
          <div className="bg-canvas p-6">
            <div className="font-display text-[80px] font-bold leading-none tracking-[-1.6px] tabular">
              {themScore}
            </div>
            <div className="mt-2 text-body">{them?.username ?? "PACE"}</div>
          </div>
        </div>
        {typeof delta === "number" ? (
          <p className="mt-8 text-body">
            Elo {delta >= 0 ? "+" : ""}
            {delta}
          </p>
        ) : (
          <p className="mt-8 text-body">Unranked lap.</p>
        )}
        <div className="mt-10 flex flex-wrap gap-4">
          <Button onClick={() => router.push("/grid")}>Back to grid</Button>
          <Button variant="outline" onClick={() => router.push("/home")}>
            Garage
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-full flex-col">
      <header className="flex items-center justify-between border-b border-hairline px-4 py-4 md:px-8">
        <div className="font-display tabular text-[48px] font-bold leading-none tracking-[-1px] md:text-[64px]">
          {remain}s
        </div>
        <div className="flex items-baseline gap-6 text-right">
          <div>
            <div className="font-display text-[11px] font-semibold uppercase tracking-[1.1px] text-muted">
              You
            </div>
            <div className="font-display tabular text-[40px] font-bold leading-none text-primary">
              {youScore}
            </div>
          </div>
          <div className="font-display text-[11px] uppercase tracking-[1.1px] text-muted">
            vs
          </div>
          <div>
            <div className="font-display text-[11px] font-semibold uppercase tracking-[1.1px] text-muted">
              {them?.username ?? "PACE"}
            </div>
            <div className="font-display tabular text-[40px] font-bold leading-none">
              {themScore}
            </div>
          </div>
        </div>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="font-display text-[64px] font-medium leading-none tracking-[-1.6px] md:text-[96px]">
          {duel.problem?.prompt ?? "—"}
        </div>
        <input
          ref={inputRef}
          aria-label="Your answer"
          inputMode="numeric"
          autoComplete="off"
          value={value}
          onChange={(e) => {
            const next = e.target.value.replace(/[^\d-]/g, "");
            setValue(next);
            if (next !== "") void submit(next);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (!value) return;
              setWrong(true);
              window.setTimeout(() => setWrong(false), 180);
              void submit(value);
            }
          }}
          className={`mt-12 w-full max-w-md border-b bg-transparent pb-3 text-center font-display text-[40px] font-bold tabular outline-none ${wrong ? "border-primary text-primary" : "border-hairline text-ink"}`}
        />
        <p className="mt-6 text-[13px] text-body">
          Type the answer — it advances when you’re right.
        </p>
      </div>
    </main>
  );
}

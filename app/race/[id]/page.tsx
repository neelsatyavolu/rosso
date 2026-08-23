"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Mark } from "@/components/ui";
import type { PublicUser } from "@/lib/types";

type ProblemBit = { prompt: string; answer: number; index: number };

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
  problem: ProblemBit | null;
  ahead: ProblemBit[];
};

type Payload = {
  duel: DuelView;
  host: PublicUser | null;
  guest: PublicUser | null;
  youAreHost: boolean;
};

type Live = {
  prompt: string;
  answer: number;
  index: number;
  youScore: number;
  queue: ProblemBit[];
};

export default function RacePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [payload, setPayload] = useState<Payload | null>(null);
  const [live, setLive] = useState<Live | null>(null);
  const [value, setValue] = useState("");
  const [now, setNow] = useState(Date.now());
  const [wrong, setWrong] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const liveRef = useRef<Live | null>(null);
  const postChain = useRef(Promise.resolve());
  liveRef.current = live;

  useEffect(() => {
    let gone = false;
    let timer = 0;
    const tick = async () => {
      const res = await fetch(`/api/duels/${id}`, { cache: "no-store" });
      if (res.status === 401 || res.status === 403 || res.status === 404) {
        router.push("/grid");
        return;
      }
      if (!res.ok) {
        timer = window.setTimeout(tick, 600);
        return;
      }
      const json = (await res.json()) as Payload;
      if (gone) return;
      setPayload(json);
      const local = liveRef.current;
      if (json.duel.status === "live" && json.duel.ahead.length) {
        const localIndex = local?.index ?? -1;
        if (!local || json.duel.yourIndex > localIndex) {
          const queue = json.duel.ahead;
          const first = queue[0];
          setLive({
            prompt: first.prompt,
            answer: first.answer,
            index: first.index,
            youScore: json.youAreHost
              ? json.duel.hostScore
              : json.duel.guestScore,
            queue,
          });
        } else if (local && json.duel.ahead[0]) {
          const rest = json.duel.ahead.filter((p) => p.index >= local.index);
          if (rest.length > local.queue.length) {
            setLive({ ...local, queue: rest });
          }
        }
      }
      if (json.duel.status !== "live") setLive(null);
      setNow(Date.now());
      timer = window.setTimeout(
        tick,
        json.duel.status === "live" ? 500 : 900,
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
  }, [payload?.duel.status, live?.index]);

  async function act(action: "accept" | "decline" | "cancel") {
    await fetch(`/api/duels/${id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action }),
    });
  }

  function postAnswer(index: number, raw: string) {
    postChain.current = postChain.current.then(async () => {
      const res = await fetch(`/api/duels/${id}/answer`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ index, value: raw }),
      });
      const json = (await res.json().catch(() => null)) as {
        duel?: DuelView;
      } | null;
      if (json?.duel) {
        setPayload((p) => (p ? { ...p, duel: json.duel! } : p));
      }
    });
  }

  function tryAdvance(raw: string) {
    const cur = liveRef.current;
    if (!cur || raw === "") return;
    if (Number(raw) !== cur.answer) return;
    const rest = cur.queue.slice(1);
    const next = rest[0];
    const solvedIndex = cur.index;
    setValue("");
    setLive({
      prompt: next?.prompt ?? cur.prompt,
      answer: next?.answer ?? cur.answer,
      index: next?.index ?? cur.index + 1,
      youScore: cur.youScore + 1,
      queue: rest,
    });
    postAnswer(solvedIndex, raw);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  if (!payload) {
    return (
      <main className="gutter flex min-h-dvh items-center justify-center text-body">
        Forming up on the grid…
      </main>
    );
  }

  const { duel, host, guest, youAreHost } = payload;
  const you = youAreHost ? host : guest;
  const them = youAreHost ? guest : host;
  const youScore = live
    ? Math.max(
        live.youScore,
        youAreHost ? duel.hostScore : duel.guestScore,
      )
    : youAreHost
      ? duel.hostScore
      : duel.guestScore;
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
      <main className="gutter mx-auto flex min-h-dvh max-w-xl flex-col justify-center">
        <Mark className="h-6" />
        <h1 className="mt-8 font-display text-[36px] font-medium tracking-[-0.36px]">
          {youAreHost
            ? "Waiting on the other side of the garage."
            : "You’ve been called to the grid."}
        </h1>
        <p className="mt-4 text-body">
          {youAreHost
            ? `${guest?.username ?? "Your friend"} has to accept. Ranked. Same problems.`
            : `${host?.username} wants a 60-second lap.`}
        </p>
        <div className="mt-10 flex gap-4">
          {youAreHost ? (
            <Button variant="outline" onClick={() => void act("cancel")}>
              Withdraw
            </Button>
          ) : (
            <>
              <Button onClick={() => void act("accept")}>Accept</Button>
              <Button variant="outline" onClick={() => void act("decline")}>
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
      <main className="gutter flex min-h-dvh flex-col items-center justify-center">
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
      <main className="gutter mx-auto flex min-h-dvh max-w-2xl flex-col justify-center">
        <p className="font-display text-[11px] font-semibold uppercase tracking-[1.1px] text-muted">
          Chequered flag
        </p>
        <h1 className="mt-4 font-display text-[56px] font-medium tracking-[-1.12px]">
          {draw ? "Dead heat." : youWon ? "You take it." : "Second."}
        </h1>
        <div className="mt-10 grid grid-cols-2 gap-px bg-hairline">
          <div className="bg-canvas p-6">
            <div className="font-display tabular text-[80px] font-bold leading-none tracking-[-1.6px] text-primary">
              {youScore}
            </div>
            <div className="mt-2 text-body">{you?.username ?? "You"}</div>
          </div>
          <div className="bg-canvas p-6">
            <div className="font-display tabular text-[80px] font-bold leading-none tracking-[-1.6px]">
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
    <main className="flex min-h-dvh flex-col">
      <header className="gutter-x flex items-center justify-between border-b border-hairline pt-[max(20px,env(safe-area-inset-top,0px))] pb-5">
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
      <div className="gutter-x flex flex-1 flex-col items-center justify-center pb-[max(32px,env(safe-area-inset-bottom,0px))]">
        <div className="font-display text-[64px] font-medium leading-none tracking-[-1.6px] md:text-[96px]">
          {live?.prompt ?? duel.problem?.prompt ?? "—"}
        </div>
        <input
          ref={inputRef}
          aria-label="Your answer"
          inputMode="numeric"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          value={value}
          onChange={(e) => {
            const next = e.target.value.replace(/[^\d-]/g, "");
            setValue(next);
            tryAdvance(next);
          }}
          onKeyDown={(e) => {
            if (e.key !== "Enter" || !value) return;
            if (live && Number(value) === live.answer) {
              tryAdvance(value);
              return;
            }
            setWrong(true);
            window.setTimeout(() => setWrong(false), 180);
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

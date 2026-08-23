"use client";

import { useRouter } from "next/navigation";
import { Shell } from "@/components/shell";
import { Button } from "@/components/ui";
import { useGarage } from "@/lib/use-garage";

export default function GridPage() {
  const data = useGarage();
  const router = useRouter();

  async function start(action: "queue" | "practice", friendId?: string) {
    const res = await fetch("/api/duels", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(
        friendId ? { action: "challenge", friendId } : { action },
      ),
    });
    const json = (await res.json()) as { duel?: { id: string } };
    if (json.duel) router.push(`/race/${json.duel.id}`);
  }

  if (!data) {
    return (
      <Shell>
        <p className="text-body">Rolling to the grid…</p>
      </Shell>
    );
  }

  return (
    <Shell username={data.me.username}>
      <p className="font-display text-[11px] font-semibold uppercase tracking-[1.1px] text-muted">
        Grid
      </p>
      <h1 className="mt-3 max-w-3xl font-display text-[36px] font-medium tracking-[-0.36px] md:text-[56px]">
        A 60-second sprint. Same problems. Most correct wins.
      </h1>
      <p className="mt-6 max-w-xl text-body">
        Ranked matches count toward Elo (K=32). Practice against PACE does not.
        Queue waits 10 seconds, then PACE rolls out if nobody else is looking.
      </p>
      <div className="mt-12 flex flex-wrap gap-4">
        <Button onClick={() => start("queue")}>
          Find a match
        </Button>
        <Button variant="outline" onClick={() => start("practice")}>
          Practice lap
        </Button>
      </div>

      <section className="mt-20">
        <p className="font-display text-[11px] font-semibold uppercase tracking-[1.1px] text-muted">
          Challenge the stable
        </p>
        {data.friends.length === 0 ? (
          <p className="mt-4 text-body">Add friends first — then put them on the grid.</p>
        ) : (
          <ul className="mt-4 max-w-xl divide-y divide-hairline border-y border-hairline">
            {data.friends.map((f) => (
              <li key={f.id} className="flex items-center justify-between py-4">
                <span>
                  <span
                    className={`mr-3 inline-block h-2 w-2 ${f.online ? "bg-success" : "bg-hairline"}`}
                  />
                  {f.username}
                </span>
                <Button
                  variant={f.online ? "primary" : "outline"}
                  onClick={() => start("queue", f.id)}
                >
                  Challenge
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Shell>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { Button, Spec } from "@/components/ui";
import { useGarage } from "@/lib/use-garage";

export default function HomePage() {
  const data = useGarage();
  const router = useRouter();

  async function accept(id: string) {
    await fetch(`/api/duels/${id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "accept" }),
    });
    router.push(`/race/${id}`);
  }

  if (!data) return null;

  return (
    <>
      <p className="font-display text-[11px] font-semibold uppercase tracking-[1.1px] text-muted">
        Garage
      </p>
      <h1 className="mt-3 font-display text-[36px] font-medium tracking-[-0.36px] md:text-[56px]">
        {data.me.username}
      </h1>
      <div className="mt-10 grid gap-px border-y border-hairline bg-hairline md:grid-cols-4">
        <div className="bg-canvas pr-6">
          <Spec value={data.me.rating} label="Elo" accent />
        </div>
        <div className="bg-canvas pr-6">
          <Spec value={data.me.wins} label="Wins" />
        </div>
        <div className="bg-canvas pr-6">
          <Spec value={data.me.losses} label="Losses" />
        </div>
        <div className="bg-canvas pr-6">
          <Spec value={data.me.draws} label="Draws" />
        </div>
      </div>

      {data.challenges.length > 0 ? (
        <section className="mt-16">
          <p className="font-display text-[11px] font-semibold uppercase tracking-[1.1px] text-muted">
            Incoming challenges
          </p>
          <ul className="mt-4 divide-y divide-hairline border-y border-hairline">
            {data.challenges.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between py-4"
              >
                <span>
                  {c.host.username}
                  <span className="ml-3 text-body">{c.host.rating}</span>
                </span>
                <Button onClick={() => accept(c.id)}>Accept</Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-16 flex flex-wrap gap-4">
        <Button href="/grid">Go to grid</Button>
        <Button href="/friends" variant="outline">
          Open stable
        </Button>
      </section>

      <section className="mt-16">
        <p className="font-display text-[11px] font-semibold uppercase tracking-[1.1px] text-muted">
          Stable online
        </p>
        {data.friends.filter((f) => f.online).length === 0 ? (
          <p className="mt-4 text-body">
            No friends on the timing screens. Add drivers in the stable.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-hairline border-y border-hairline">
            {data.friends
              .filter((f) => f.online)
              .map((f) => (
                <li key={f.id} className="flex items-center justify-between py-4">
                  <span>
                    <span className="mr-3 inline-block h-2 w-2 bg-success" />
                    {f.username}
                  </span>
                  <span className="tabular text-body">{f.rating}</span>
                </li>
              ))}
          </ul>
        )}
      </section>
    </>
  );
}

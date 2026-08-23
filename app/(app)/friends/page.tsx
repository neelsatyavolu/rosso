"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field } from "@/components/ui";
import { useGarage } from "@/lib/use-garage";
import type { PublicUser } from "@/lib/types";

export default function FriendsPage() {
  const data = useGarage();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<PublicUser[]>([]);
  const [note, setNote] = useState("");

  async function search(e: FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/friends?q=${encodeURIComponent(q)}`);
    const json = (await res.json()) as { users: PublicUser[] };
    setHits(json.users);
  }

  async function add(userId: string) {
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const json = (await res.json()) as { error?: string };
    setNote(json.error ?? "Request sent.");
  }

  async function respond(id: string, accept: boolean) {
    await fetch("/api/friends", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, accept }),
    });
  }

  async function challenge(friendId: string) {
    const res = await fetch("/api/duels", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "challenge", friendId }),
    });
    const json = (await res.json()) as { duel?: { id: string }; error?: string };
    if (json.duel) router.push(`/race/${json.duel.id}`);
    else setNote(json.error ?? "Could not challenge.");
  }

  if (!data) return null;

  return (
    <>
      <p className="font-display text-[11px] font-semibold uppercase tracking-[1.1px] text-muted">
        Stable
      </p>
      <h1 className="mt-3 font-display text-[36px] font-medium tracking-[-0.36px] md:text-[56px]">
        Find drivers.
      </h1>
      <form onSubmit={search} className="mt-10 flex max-w-xl items-end gap-4">
        <div className="flex-1">
          <Field
            label="Search username"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Button type="submit">Search</Button>
      </form>
      {note ? <p className="mt-4 text-[13px] text-body">{note}</p> : null}

      {hits.length > 0 ? (
        <ul className="mt-8 max-w-xl divide-y divide-hairline border-y border-hairline">
          {hits.map((u) => (
            <li key={u.id} className="flex items-center justify-between py-4">
              <span>
                {u.username}
                <span className="ml-3 text-body">{u.rating}</span>
              </span>
              <Button variant="outline" onClick={() => add(u.id)}>
                Add
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {data.incoming.length > 0 ? (
        <section className="mt-16 max-w-xl">
          <p className="font-display text-[11px] font-semibold uppercase tracking-[1.1px] text-muted">
            Requests
          </p>
          <ul className="mt-4 divide-y divide-hairline border-y border-hairline">
            {data.incoming.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-4">
                <span>{r.from.username}</span>
                <div className="flex gap-3">
                  <Button onClick={() => respond(r.id, true)}>Accept</Button>
                  <Button variant="ghost" onClick={() => respond(r.id, false)}>
                    Decline
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-16 max-w-xl">
        <p className="font-display text-[11px] font-semibold uppercase tracking-[1.1px] text-muted">
          Your stable
        </p>
        {data.friends.length === 0 ? (
          <p className="mt-4 text-body">
            Empty. Search a username and send a request.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-hairline border-y border-hairline">
            {data.friends.map((f) => (
              <li key={f.id} className="flex items-center justify-between py-4">
                <span>
                  <span
                    className={`mr-3 inline-block h-2 w-2 ${f.online ? "bg-success" : "bg-hairline"}`}
                  />
                  {f.username}
                  <span className="ml-3 text-body">{f.rating}</span>
                </span>
                <Button onClick={() => challenge(f.id)}>1v1</Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useGarage } from "@/lib/use-garage";
import { useTabOptional } from "@/lib/tabs";
import type { PublicUser } from "@/lib/types";

type Row = PublicUser & { position: number };

export default function TowerPage() {
  const data = useGarage();
  const tab = useTabOptional()?.tab;
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    if (tab && tab !== "/tower") return;
    let gone = false;
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((j: { rows: Row[] }) => {
        if (!gone) setRows(j.rows);
      });
    return () => {
      gone = true;
    };
  }, [tab]);

  if (!data) return null;

  return (
    <>
      <p className="font-display text-[11px] font-semibold uppercase tracking-[1.1px] text-muted">
        Timing tower
      </p>
      <h1 className="mt-3 font-display text-[36px] font-medium tracking-[-0.36px] md:text-[56px]">
        The order.
      </h1>
      <ol className="mt-12 divide-y divide-hairline border-y border-hairline">
        {(rows ?? []).map((r) => (
          <li
            key={r.id}
            className="grid grid-cols-[72px_1fr_auto] items-center py-4 md:grid-cols-[96px_1fr_120px_120px]"
          >
            <span
              className={`font-display tabular text-[32px] font-bold leading-none tracking-[-0.5px] md:text-[40px] ${r.position <= 3 ? "text-primary" : "text-ink"}`}
            >
              {r.position}
            </span>
            <span className="text-[16px] font-medium">{r.username}</span>
            <span className="hidden text-body md:block">
              {r.wins}W · {r.losses}L · {r.draws}D
            </span>
            <span className="tabular text-right text-[18px] font-bold">
              {r.rating}
            </span>
          </li>
        ))}
      </ol>
      {rows && rows.length === 0 ? (
        <p className="mt-8 text-body">No laps on record yet.</p>
      ) : null}
    </>
  );
}

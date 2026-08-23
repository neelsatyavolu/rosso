"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { PublicUser } from "./types";

export type Garage = {
  me: PublicUser;
  friends: PublicUser[];
  incoming: { id: string; from: PublicUser }[];
  outgoing: { id: string; to: PublicUser }[];
  challenges: { id: string; host: PublicUser }[];
  queued: boolean;
  activeDuelId: string | null;
};

export function useGarage(redirectToRace = true) {
  const [data, setData] = useState<Garage | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let timer: number;
    let gone = false;
    const tick = async () => {
      const res = await fetch("/api/me", { cache: "no-store" });
      if (res.status === 401) {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/join");
        return;
      }
      if (!res.ok) {
        timer = window.setTimeout(tick, 1200);
        return;
      }
      const json = (await res.json()) as Garage;
      if (gone) return;
      setData(json);
      if (
        redirectToRace &&
        json.activeDuelId &&
        !pathname.startsWith("/race")
      ) {
        router.push(`/race/${json.activeDuelId}`);
        return;
      }
      timer = window.setTimeout(tick, 1600);
    };
    void tick();
    return () => {
      gone = true;
      window.clearTimeout(timer);
    };
  }, [pathname, redirectToRace, router]);

  return data;
}

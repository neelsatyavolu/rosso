"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
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

const GarageContext = createContext<Garage | null>(null);
let cache: Garage | null = null;

export function clearGarageCache() {
  cache = null;
}

export function GarageProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Garage | null>(cache);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let gone = false;
    let timer = 0;
    const tick = async () => {
      const res = await fetch("/api/me", { cache: "no-store" });
      if (res.status === 401) {
        clearGarageCache();
        await fetch("/api/auth/logout", { method: "POST" });
        if (!gone) router.replace("/join");
        return;
      }
      if (!res.ok) {
        timer = window.setTimeout(tick, 1200);
        return;
      }
      const json = (await res.json()) as Garage;
      if (gone) return;
      cache = json;
      setData(json);
      timer = window.setTimeout(tick, 2500);
    };
    void tick();
    return () => {
      gone = true;
      window.clearTimeout(timer);
    };
  }, [router]);

  useEffect(() => {
    if (!data?.activeDuelId) return;
    if (pathname.startsWith("/race")) return;
    router.replace(`/race/${data.activeDuelId}`);
  }, [data?.activeDuelId, pathname, router]);

  return (
    <GarageContext.Provider value={data}>{children}</GarageContext.Provider>
  );
}

export function useGarage() {
  return useContext(GarageContext);
}

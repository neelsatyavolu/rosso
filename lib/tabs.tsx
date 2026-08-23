"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

export const APP_TABS = ["/home", "/friends", "/grid", "/tower"] as const;

type TabContextValue = {
  tab: string;
  select: (href: string) => void;
};

const TabContext = createContext<TabContextValue | null>(null);

export function TabProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [tab, setTab] = useState(pathname);

  useEffect(() => {
    if (APP_TABS.includes(pathname as (typeof APP_TABS)[number])) {
      setTab(pathname);
    }
  }, [pathname]);

  const select = useCallback((href: string) => {
    setTab(href);
  }, []);

  return (
    <TabContext.Provider value={{ tab, select }}>{children}</TabContext.Provider>
  );
}

export function useTab() {
  const ctx = useContext(TabContext);
  if (!ctx) throw new Error("useTab needs TabProvider");
  return ctx;
}

export function useTabOptional() {
  return useContext(TabContext);
}

export function isAppTab(href: string) {
  return APP_TABS.some((t) => href === t || href.startsWith(`${t}/`));
}

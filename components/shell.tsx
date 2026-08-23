"use client";

import { usePathname } from "next/navigation";
import { MobileDock, SiteNav } from "./nav";

export function Shell({
  username,
  children,
}: {
  username?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div className="min-h-full bg-canvas pb-16 md:pb-0">
      <SiteNav username={username ?? " "} />
      <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-8 md:py-16">
        {children}
      </div>
      <MobileDock pathname={pathname} />
    </div>
  );
}

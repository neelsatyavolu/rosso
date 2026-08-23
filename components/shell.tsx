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
    <div className="min-h-full min-h-dvh bg-canvas pb-[calc(72px+env(safe-area-inset-bottom,0px))] md:pb-0">
      <SiteNav username={username} signedIn />
      <div className="gutter-x mx-auto max-w-[1280px] py-10 md:py-16">
        {children ?? null}
      </div>
      <MobileDock pathname={pathname} />
    </div>
  );
}

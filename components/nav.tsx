"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearGarageCache } from "@/lib/use-garage";
import { Button, Mark } from "./ui";

const LINKS = [
  { href: "/home", label: "Garage" },
  { href: "/friends", label: "Stable" },
  { href: "/grid", label: "Grid" },
  { href: "/tower", label: "Tower" },
];

export function SiteNav({
  username,
  signedIn = false,
}: {
  username?: string;
  signedIn?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const showApp = signedIn || Boolean(username);

  async function logout() {
    clearGarageCache();
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-canvas/95 pt-[env(safe-area-inset-top,0px)] backdrop-blur">
      <div className="gutter-x mx-auto flex h-16 max-w-[1280px] items-center justify-between">
        <Link href={showApp ? "/home" : "/"} className="flex items-center gap-3">
          <Mark className="h-5" />
          <span className="font-display text-[13px] font-semibold uppercase tracking-[0.65px]">
            Flash
          </span>
        </Link>
        {showApp ? (
          <>
            <nav className="hidden items-center gap-8 md:flex">
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  prefetch
                  scroll={false}
                  className={`font-display text-[13px] font-semibold uppercase tracking-[0.65px] ${pathname.startsWith(l.href) ? "text-ink" : "text-body hover:text-ink"}`}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-4">
              <span className="hidden text-[13px] text-body sm:block">
                {username}
              </span>
              <Button variant="ghost" onClick={logout} className="h-10">
                Sign out
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-6">
            <Link
              href="/join"
              className="font-display text-[13px] font-semibold uppercase tracking-[0.65px] text-body hover:text-ink"
            >
              Enter
            </Link>
            <Button href="/join">Take a seat</Button>
          </div>
        )}
      </div>
    </header>
  );
}

export function MobileDock({ pathname }: { pathname: string }) {
  return (
    <nav className="fixed right-0 bottom-0 left-0 z-40 grid grid-cols-4 border-t border-hairline bg-canvas pb-[env(safe-area-inset-bottom,0px)] pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)] md:hidden">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          prefetch
          scroll={false}
          className={`flex h-14 items-center justify-center font-display text-[11px] font-semibold uppercase tracking-[1.1px] ${pathname.startsWith(l.href) ? "text-ink" : "text-body"}`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

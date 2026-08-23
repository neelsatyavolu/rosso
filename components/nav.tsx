"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button, Mark } from "./ui";

const LINKS = [
  { href: "/home", label: "Garage" },
  { href: "/friends", label: "Stable" },
  { href: "/grid", label: "Grid" },
  { href: "/tower", label: "Tower" },
];

export function SiteNav({ username }: { username?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-hairline bg-canvas/95 backdrop-blur">
      <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between px-4 md:px-8">
        <Link href={username ? "/home" : "/"} className="flex items-center gap-3">
          <Mark className="h-5" />
          <span className="font-display text-[13px] font-semibold uppercase tracking-[0.65px]">
            Rosso
          </span>
        </Link>
        {username ? (
          <>
            <nav className="hidden items-center gap-8 md:flex">
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
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
            <Link href="/join">
              <Button>Take a seat</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

export function MobileDock({ pathname }: { pathname: string }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-4 border-t border-hairline bg-canvas md:hidden">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`flex h-14 items-center justify-center font-display text-[11px] font-semibold uppercase tracking-[1.1px] ${pathname.startsWith(l.href) ? "text-ink" : "text-body"}`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

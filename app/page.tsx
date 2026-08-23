import Image from "next/image";
import { Button, Mark, Spec } from "@/components/ui";
import { SiteNav } from "@/components/nav";

export default function Landing() {
  return (
    <div className="grain min-h-full bg-canvas">
      <SiteNav />
      <section className="relative min-h-[88vh] overflow-hidden">
        <Image
          src="/hero.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[20%_center] outline outline-1 outline-white/10"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(24,24,24,0.15)_0%,rgba(24,24,24,0.35)_45%,#181818_92%)]" />
        <div className="relative mx-auto flex min-h-[88vh] max-w-[1280px] flex-col justify-end px-4 pb-16 pt-32 md:px-8 md:pb-24">
          <p className="font-display text-[11px] font-semibold uppercase tracking-[1.1px] text-white/80">
            Mental math · 60-second sprint
          </p>
          <h1 className="mt-4 max-w-4xl font-display text-[48px] font-medium leading-[1.05] tracking-[-1.6px] text-balance md:text-[80px]">
            Sixty seconds.
            <br />
            Same problems.
            <br />
            First across the line.
          </h1>
          <p className="mt-6 max-w-xl text-[14px] leading-6 text-white/80">
            ROSSO is a 1v1 mental math race. You and a friend get the same
            lap of arithmetic — most correct wins. Elo, K=32.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button href="/join">Enter the grid</Button>
            <Button href="/join" variant="outline">
              Take a seat
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-primary px-4 py-24 text-white md:px-8">
        <div className="mx-auto grid max-w-[1280px] gap-8 md:grid-cols-4">
          <Spec value="60s" label="The race" />
          <Spec value="1v1" label="Same problems" />
          <Spec value="K32" label="Elo, ranked" />
          <Spec value="+−×÷" label="Classic mental math" />
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-4 py-24 md:px-8">
        <p className="font-display text-[11px] font-semibold uppercase tracking-[1.1px] text-muted">
          How a lap works
        </p>
        <h2 className="mt-4 max-w-2xl font-display text-[36px] font-medium leading-[1.2] tracking-[-0.36px] text-balance">
          Sign up. Friend a driver. Put them on the grid.
        </h2>
        <div className="mt-16 grid gap-px bg-hairline md:grid-cols-3">
          {[
            {
              n: "01",
              t: "Take a seat",
              d: "Username and password. You start at 1000 Elo — pole is earned, not given.",
            },
            {
              n: "02",
              t: "Build a stable",
              d: "Search drivers, send a request, accept. Online friends show a live mark.",
            },
            {
              n: "03",
              t: "Race",
              d: "60 seconds. Same prompts. Type the answer — it advances when you’re right. Most correct wins.",
            },
          ].map((c) => (
            <article key={c.n} className="bg-canvas p-8">
              <div className="font-display text-[80px] font-bold leading-none tracking-[-1.6px] text-primary">
                {c.n}
              </div>
              <h3 className="mt-6 text-[18px] font-bold leading-tight">{c.t}</h3>
              <p className="mt-3 text-body">{c.d}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-hairline px-4 py-24 text-center md:px-8">
        <Mark className="mx-auto h-8" />
        <h2 className="mx-auto mt-8 max-w-2xl font-display text-[36px] font-medium tracking-[-0.36px] text-balance">
          Lights out, and away we go.
        </h2>
        <div className="mt-10">
          <Button href="/join">Enter the grid</Button>
        </div>
      </section>

      <footer className="border-t border-hairline px-4 py-16 text-[13px] text-body md:px-8">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <span>ROSSO · mental math 1v1</span>
          <span>Same problems. Fastest mind.</span>
        </div>
      </footer>
    </div>
  );
}

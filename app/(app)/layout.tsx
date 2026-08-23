"use client";

import { Shell } from "@/components/shell";
import { GarageProvider, useGarage } from "@/lib/use-garage";

function AppShell({ children }: { children: React.ReactNode }) {
  const data = useGarage();
  return <Shell username={data?.me.username}>{children}</Shell>;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <GarageProvider>
      <AppShell>{children}</AppShell>
    </GarageProvider>
  );
}

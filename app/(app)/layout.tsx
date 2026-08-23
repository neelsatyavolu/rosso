"use client";

import { Shell } from "@/components/shell";
import { GarageProvider, useGarage } from "@/lib/use-garage";
import { TabProvider, useTab } from "@/lib/tabs";
import HomeView from "./home/page";
import FriendsView from "./friends/page";
import GridView from "./grid/page";
import TowerView from "./tower/page";

function AppShell() {
  const data = useGarage();
  const { tab } = useTab();
  return (
    <Shell username={data?.me.username}>
      <div hidden={tab !== "/home"}>
        <HomeView />
      </div>
      <div hidden={tab !== "/friends"}>
        <FriendsView />
      </div>
      <div hidden={tab !== "/grid"}>
        <GridView />
      </div>
      <div hidden={tab !== "/tower"}>
        <TowerView />
      </div>
    </Shell>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  void children;
  return (
    <GarageProvider>
      <TabProvider>
        <AppShell />
      </TabProvider>
    </GarageProvider>
  );
}

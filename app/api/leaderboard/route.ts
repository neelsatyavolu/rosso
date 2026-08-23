import { NextResponse } from "next/server";
import { toPublic } from "@/lib/auth";
import { mutate } from "@/lib/store";
import { BOT_ID } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = Date.now();
  const rows = await mutate((db) =>
    db.users
      .filter((u) => u.id !== BOT_ID && u.passwordHash)
      .sort((a, b) => b.rating - a.rating || b.wins - a.wins)
      .slice(0, 40)
      .map((u, i) => ({ position: i + 1, ...toPublic(u, now) })),
  );
  return NextResponse.json({ rows });
}

import { NextResponse } from "next/server";
import { clearSessionCookie, readSessionId } from "./auth";
import { mutate } from "./store";
import { BOT_ID, type User } from "./types";
import { syncDuel } from "./game";

export async function requireUser(): Promise<
  { user: User } | { error: NextResponse }
> {
  const id = await readSessionId();
  if (!id) {
    return {
      error: NextResponse.json({ error: "Sign in first." }, { status: 401 }),
    };
  }
  const now = Date.now();
  const user = await mutate((db) => {
    const u = db.users.find((x) => x.id === id);
    if (!u || u.id === BOT_ID) return null;
    if (now - u.lastSeen > 4000) u.lastSeen = now;
    for (const duel of db.duels) syncDuel(db, duel, now);
    return u;
  });
  if (!user) {
    await clearSessionCookie();
    return {
      error: NextResponse.json({ error: "Account missing." }, { status: 401 }),
    };
  }
  return { user };
}

import { NextResponse } from "next/server";
import { createDuel, publicDuel, startDuel, syncDuel } from "@/lib/game";
import { requireUser } from "@/lib/session";
import { mutate } from "@/lib/store";
import { BOT_ID } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const body = (await req.json().catch(() => null)) as {
    action?: "challenge" | "queue" | "practice";
    friendId?: string;
  } | null;
  const action = body?.action;
  if (!action) {
    return NextResponse.json({ error: "Missing action." }, { status: 400 });
  }

  const result = await mutate((db) => {
    const now = Date.now();
    for (const d of db.duels) syncDuel(db, d, now);

    const live = db.duels.find(
      (d) =>
        (d.hostId === auth.user.id || d.guestId === auth.user.id) &&
        (d.status === "waiting" ||
          d.status === "countdown" ||
          d.status === "live"),
    );
    if (live) return { duel: publicDuel(live, auth.user.id) };

    if (action === "practice") {
      const duel = createDuel(auth.user.id, BOT_ID, "practice", false);
      db.duels.push(duel);
      return { duel: publicDuel(duel, auth.user.id) };
    }

    if (action === "challenge") {
      const friendId = body?.friendId;
      const allied = db.friendships.some(
        (f) =>
          f.status === "accepted" &&
          ((f.fromId === auth.user.id && f.toId === friendId) ||
            (f.fromId === friendId && f.toId === auth.user.id)),
      );
      if (!friendId || !allied) return { error: "Challenge a friend." };
      const duel = createDuel(auth.user.id, friendId, "challenge", true);
      duel.status = "waiting";
      duel.countdownAt = null;
      duel.startAt = null;
      duel.endsAt = null;
      db.duels.push(duel);
      return { duel: publicDuel(duel, auth.user.id) };
    }

    const waiting = db.duels.find(
      (d) =>
        d.kind === "queue" &&
        d.status === "waiting" &&
        d.hostId !== auth.user.id &&
        !d.guestId,
    );
    if (waiting) {
      waiting.guestId = auth.user.id;
      startDuel(waiting, now);
      const host = db.users.find((u) => u.id === waiting.hostId);
      const me = db.users.find((u) => u.id === auth.user.id);
      if (host) host.queuedAt = null;
      if (me) me.queuedAt = null;
      return { duel: publicDuel(waiting, auth.user.id) };
    }

    const me = db.users.find((u) => u.id === auth.user.id);
    if (me) me.queuedAt = now;
    const duel = createDuel(auth.user.id, null, "queue", true);
    db.duels.push(duel);
    return { duel: publicDuel(duel, auth.user.id) };
  });

  if ("error" in result && result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}

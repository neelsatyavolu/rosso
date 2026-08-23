import { NextResponse } from "next/server";
import { toPublic } from "@/lib/auth";
import { requireUser } from "@/lib/session";
import { mutate } from "@/lib/store";
import { BOT_ID } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const now = Date.now();

  const payload = await mutate((db) => {
    const me = db.users.find((u) => u.id === auth.user.id);
    if (!me) return null;
    const friends = db.friendships
      .filter(
        (f) =>
          f.status === "accepted" &&
          (f.fromId === me.id || f.toId === me.id),
      )
      .map((f) => {
        const otherId = f.fromId === me.id ? f.toId : f.fromId;
        return db.users.find((u) => u.id === otherId);
      })
      .filter((u): u is NonNullable<typeof u> => Boolean(u))
      .map((u) => toPublic(u, now));

    const incoming = db.friendships
      .filter((f) => f.status === "pending" && f.toId === me.id)
      .map((f) => {
        const from = db.users.find((u) => u.id === f.fromId);
        return from
          ? { id: f.id, from: toPublic(from, now) }
          : null;
      })
      .filter(Boolean);

    const outgoing = db.friendships
      .filter((f) => f.status === "pending" && f.fromId === me.id)
      .map((f) => {
        const to = db.users.find((u) => u.id === f.toId);
        return to ? { id: f.id, to: toPublic(to, now) } : null;
      })
      .filter(Boolean);

    const challenges = db.duels
      .filter(
        (d) =>
          d.status === "waiting" &&
          d.kind === "challenge" &&
          d.guestId === me.id,
      )
      .map((d) => {
        const host = db.users.find((u) => u.id === d.hostId);
        return host
          ? { id: d.id, host: toPublic(host, now) }
          : null;
      })
      .filter(Boolean);

    const active = db.duels.find(
      (d) =>
        (d.hostId === me.id || d.guestId === me.id) &&
        (d.status === "waiting" ||
          d.status === "countdown" ||
          d.status === "live"),
    );

    return {
      me: toPublic(me, now),
      friends,
      incoming,
      outgoing,
      challenges,
      queued: Boolean(me.queuedAt),
      activeDuelId: active?.id ?? null,
    };
  });

  if (!payload) {
    return NextResponse.json({ error: "Account missing." }, { status: 401 });
  }
  return NextResponse.json(payload);
}

export async function POST() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  void BOT_ID;
  return NextResponse.json({ ok: true });
}

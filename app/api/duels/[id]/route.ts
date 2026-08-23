import { NextResponse } from "next/server";
import { publicDuel, startDuel, syncDuel } from "@/lib/game";
import { toPublic } from "@/lib/auth";
import { requireUser } from "@/lib/session";
import { mutate } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { id } = await ctx.params;
  const now = Date.now();

  const payload = await mutate((db) => {
    const duel = db.duels.find((d) => d.id === id);
    if (!duel) return null;
    syncDuel(db, duel, now);
    if (duel.hostId !== auth.user.id && duel.guestId !== auth.user.id) {
      return { error: "Not your race." };
    }
    const host = db.users.find((u) => u.id === duel.hostId);
    const guest = duel.guestId
      ? db.users.find((u) => u.id === duel.guestId)
      : null;
    return {
      duel: publicDuel(duel, auth.user.id),
      host: host ? toPublic(host, now) : null,
      guest: guest ? toPublic(guest, now) : null,
      youAreHost: duel.hostId === auth.user.id,
    };
  });

  if (!payload) {
    return NextResponse.json({ error: "Race not found." }, { status: 404 });
  }
  if ("error" in payload && payload.error) {
    return NextResponse.json({ error: payload.error }, { status: 403 });
  }
  return NextResponse.json(payload);
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as {
    action?: "accept" | "decline" | "cancel";
  } | null;

  const result = await mutate((db) => {
    const duel = db.duels.find((d) => d.id === id);
    if (!duel) return { error: "Race not found." };
    const now = Date.now();
    syncDuel(db, duel, now);

    if (body?.action === "cancel" && duel.hostId === auth.user.id) {
      duel.status = "done";
      duel.winnerId = null;
      return { ok: true };
    }
    if (body?.action === "decline" && duel.guestId === auth.user.id) {
      duel.status = "done";
      return { ok: true };
    }
    if (
      body?.action === "accept" &&
      duel.guestId === auth.user.id &&
      duel.status === "waiting"
    ) {
      startDuel(duel, now);
      return { ok: true, duel: publicDuel(duel, auth.user.id) };
    }
    return { error: "Can't do that." };
  });

  if ("error" in result && result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}

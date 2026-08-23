import { NextResponse } from "next/server";
import { publicDuel, syncDuel } from "@/lib/game";
import { requireUser } from "@/lib/session";
import { mutate } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as {
    index?: number;
    value?: string;
  } | null;

  const result = await mutate((db) => {
    const duel = db.duels.find((d) => d.id === id);
    if (!duel) return { error: "Race not found." };
    const now = Date.now();
    syncDuel(db, duel, now);
    if (duel.status !== "live") {
      return { duel: publicDuel(duel, auth.user.id), correct: false };
    }
    const isHost = duel.hostId === auth.user.id;
    const isGuest = duel.guestId === auth.user.id;
    if (!isHost && !isGuest) return { error: "Not your race." };

    const index = isHost ? duel.hostIndex : duel.guestIndex;
    if (body?.index !== index) {
      return { duel: publicDuel(duel, auth.user.id), correct: false };
    }
    const problem = duel.problems[index];
    if (!problem) {
      return { duel: publicDuel(duel, auth.user.id), correct: false };
    }
    const value = Number(body?.value);
    if (!Number.isFinite(value) || value !== problem.answer) {
      return { duel: publicDuel(duel, auth.user.id), correct: false };
    }
    if (isHost) {
      duel.hostScore += 1;
      duel.hostIndex += 1;
    } else {
      duel.guestScore += 1;
      duel.guestIndex += 1;
    }
    syncDuel(db, duel, now);
    return { duel: publicDuel(duel, auth.user.id), correct: true };
  });

  if ("error" in result && result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}

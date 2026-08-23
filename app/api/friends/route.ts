import { NextResponse } from "next/server";
import { normalizeUsername, toPublic } from "@/lib/auth";
import { requireUser } from "@/lib/session";
import { mutate } from "@/lib/store";
import { BOT_ID } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const q = normalizeUsername(
    new URL(req.url).searchParams.get("q") ?? "",
  );
  if (q.length < 2) return NextResponse.json({ users: [] });
  const now = Date.now();
  const users = await mutate((db) =>
    db.users
      .filter(
        (u) =>
          u.id !== auth.user.id &&
          u.id !== BOT_ID &&
          u.username.includes(q),
      )
      .slice(0, 8)
      .map((u) => toPublic(u, now)),
  );
  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const body = (await req.json().catch(() => null)) as {
    userId?: string;
  } | null;
  const userId = body?.userId;
  if (!userId || userId === auth.user.id || userId === BOT_ID) {
    return NextResponse.json({ error: "Pick a real driver." }, { status: 400 });
  }

  const result = await mutate((db) => {
    const other = db.users.find((u) => u.id === userId);
    if (!other) return { error: "No such driver." };
    const existing = db.friendships.find(
      (f) =>
        (f.fromId === auth.user.id && f.toId === userId) ||
        (f.fromId === userId && f.toId === auth.user.id),
    );
    if (existing?.status === "accepted") return { error: "Already allied." };
    if (existing?.status === "pending" && existing.fromId === auth.user.id) {
      return { error: "Request already sent." };
    }
    if (existing?.status === "pending" && existing.toId === auth.user.id) {
      existing.status = "accepted";
      return { ok: true, accepted: true };
    }
    db.friendships.push({
      id: crypto.randomUUID(),
      fromId: auth.user.id,
      toId: userId,
      status: "pending",
      createdAt: Date.now(),
    });
    return { ok: true, accepted: false };
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}

export async function PATCH(req: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const body = (await req.json().catch(() => null)) as {
    id?: string;
    accept?: boolean;
  } | null;
  if (!body?.id) {
    return NextResponse.json({ error: "Missing request." }, { status: 400 });
  }
  await mutate((db) => {
    const f = db.friendships.find(
      (x) => x.id === body.id && x.toId === auth.user.id,
    );
    if (!f) return;
    if (body.accept) f.status = "accepted";
    else db.friendships = db.friendships.filter((x) => x.id !== f.id);
  });
  return NextResponse.json({ ok: true });
}

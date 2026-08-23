import { NextResponse } from "next/server";
import { normalizeUsername, setSessionCookie } from "@/lib/auth";
import { hashPassword } from "@/lib/passwords";
import { mutate } from "@/lib/store";
import { RESERVED_NAMES, START_RATING } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    username?: string;
    password?: string;
  } | null;
  const username = normalizeUsername(body?.username ?? "");
  const password = body?.password ?? "";
  if (!/^[a-z0-9_]{3,16}$/.test(username) || RESERVED_NAMES.has(username)) {
    return NextResponse.json(
      { error: "Username: 3–16 letters, numbers, underscore." },
      { status: 400 },
    );
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password needs at least 6 characters." },
      { status: 400 },
    );
  }

  const passwordHash = await hashPassword(password);
  const user = await mutate((db) => {
    if (db.users.some((u) => u.username === username)) return null;
    const created = {
      id: crypto.randomUUID(),
      username,
      passwordHash,
      rating: START_RATING,
      wins: 0,
      losses: 0,
      draws: 0,
      createdAt: Date.now(),
      lastSeen: Date.now(),
      queuedAt: null,
    };
    db.users.push(created);
    return created;
  });

  if (!user) {
    return NextResponse.json(
      { error: "That seat is taken." },
      { status: 409 },
    );
  }

  await setSessionCookie(user.id);
  return NextResponse.json({ ok: true });
}

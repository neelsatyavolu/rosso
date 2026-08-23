import { NextResponse } from "next/server";
import { normalizeUsername, setSessionCookie } from "@/lib/auth";
import { verifyPassword } from "@/lib/passwords";
import { mutate } from "@/lib/store";
import { BOT_ID } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    username?: string;
    password?: string;
  } | null;
  const username = normalizeUsername(body?.username ?? "");
  const password = body?.password ?? "";

  const user = await mutate((db) =>
    db.users.find((u) => u.username === username && u.id !== BOT_ID) ?? null,
  );
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json(
      { error: "Wrong username or password." },
      { status: 401 },
    );
  }
  await setSessionCookie(user.id);
  return NextResponse.json({ ok: true });
}

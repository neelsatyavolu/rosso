import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { BOT_ID, ONLINE_MS, type PublicUser, type User } from "./types";

const COOKIE = "sixty_session";

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(s);
}

export async function signSession(userId: string) {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
}

export async function readSessionId(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function setSessionCookie(userId: string) {
  const jar = await cookies();
  jar.set(COOKIE, await signSession(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export function toPublic(user: User, now = Date.now()): PublicUser {
  return {
    id: user.id,
    username: user.username,
    rating: user.rating,
    wins: user.wins,
    losses: user.losses,
    draws: user.draws,
    lastSeen: user.lastSeen,
    online: user.id === BOT_ID || now - user.lastSeen < ONLINE_MS,
  };
}

export function normalizeUsername(raw: string) {
  return raw.trim().toLowerCase();
}

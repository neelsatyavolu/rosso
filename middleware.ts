import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/home", "/friends", "/grid", "/race", "/tower"];

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) return null;
  return new TextEncoder().encode(s);
}

async function authed(req: NextRequest) {
  const token = req.cookies.get("rosso_session")?.value;
  const key = secret();
  if (!token || !key) return false;
  try {
    await jwtVerify(token, key);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const ok = await authed(req);
  if (isProtected && !ok) {
    return NextResponse.redirect(new URL("/join", req.url));
  }
  if (pathname === "/join" && ok) {
    return NextResponse.redirect(new URL("/home", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/home",
    "/friends",
    "/grid",
    "/race/:path*",
    "/tower",
    "/join",
  ],
};

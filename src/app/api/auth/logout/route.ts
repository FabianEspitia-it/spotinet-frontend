import { NextResponse } from "next/server";
import { clearedCookie } from "@/lib/auth/cookie-options";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/auth/constants";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  const a = clearedCookie(ACCESS_TOKEN_COOKIE);
  const r = clearedCookie(REFRESH_TOKEN_COOKIE);
  res.cookies.set(a.name, a.value, a.opts);
  res.cookies.set(r.name, r.value, r.opts);
  return res;
}

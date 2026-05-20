import { NextRequest, NextResponse } from "next/server";
import { accessTokenCookie } from "@/lib/auth/cookie-options";
import { REFRESH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { fetchNewAccessToken } from "@/lib/auth/refresh-access-token";

export async function POST(req: NextRequest) {
  const refresh = req.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refresh) {
    return NextResponse.json({ error: "No hay sesión" }, { status: 401 });
  }

  const access = await fetchNewAccessToken(refresh);
  if (!access) {
    const res = NextResponse.json({ error: "Refresh inválido" }, { status: 401 });
    return res;
  }

  const res = NextResponse.json({ ok: true });
  const c = accessTokenCookie(access);
  res.cookies.set(c.name, c.value, c.opts);
  return res;
}

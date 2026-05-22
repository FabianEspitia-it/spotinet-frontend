import { NextRequest, NextResponse } from "next/server";
import {
  applySessionCookiesToResponse,
  clearSessionCookiesOnResponse,
} from "@/lib/auth/apply-session-cookies";
import { REFRESH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { fetchRefreshedSession } from "@/lib/auth/refresh-session";

export async function POST(req: NextRequest) {
  const refresh = req.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refresh) {
    return NextResponse.json({ error: "No hay sesión" }, { status: 401 });
  }

  const session = await fetchRefreshedSession(refresh);
  if (!session) {
    const res = NextResponse.json({ error: "Refresh inválido" }, { status: 401 });
    clearSessionCookiesOnResponse(res);
    return res;
  }

  const res = NextResponse.json({ ok: true });
  applySessionCookiesToResponse(res, session);
  return res;
}

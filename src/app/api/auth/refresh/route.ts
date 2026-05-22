import { NextRequest, NextResponse } from "next/server";
import {
  applySessionCookiesToResponse,
  clearSessionCookiesOnResponse,
} from "@/lib/auth/apply-session-cookies";
import { fetchRefreshedSession } from "@/lib/auth/refresh-session";
import { getRefreshTokenFromRequest } from "@/lib/auth/read-request-cookies";

export async function POST(req: NextRequest) {
  const refresh = getRefreshTokenFromRequest(req);
  if (!refresh) {
    return NextResponse.json({ detail: "No autenticado" }, { status: 401 });
  }

  const session = await fetchRefreshedSession(refresh);
  if (!session) {
    const res = NextResponse.json({ detail: "No autenticado" }, { status: 401 });
    clearSessionCookiesOnResponse(res);
    return res;
  }

  const res = NextResponse.json({ ok: true });
  applySessionCookiesToResponse(res, session);
  return res;
}

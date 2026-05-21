import { NextRequest, NextResponse } from "next/server";
import { applySessionCookiesToResponse } from "@/lib/auth/apply-session-cookies";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/auth/constants";
import {
  isAccessTokenValid,
  normalizeAccessToken,
} from "@/lib/auth/is-access-token-valid";
import { fetchRefreshedSession } from "@/lib/auth/refresh-session";

export const dynamic = "force-dynamic";

/** Devuelve un access token válido, renovándolo con refresh_token si expiró. */
export async function GET(request: NextRequest) {
  const access = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

  if (access && isAccessTokenValid(access)) {
    return NextResponse.json({
      access_token: normalizeAccessToken(access),
    });
  }

  const refresh = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refresh) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await fetchRefreshedSession(refresh);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const res = NextResponse.json({ access_token: session.accessToken });
  applySessionCookiesToResponse(res, session);
  return res;
}

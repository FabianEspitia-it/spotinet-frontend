import { NextRequest, NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { fetchRefreshedSessionAttempt } from "@/lib/auth/refresh-session";
import {
  isAccessTokenValid,
  normalizeAccessToken,
} from "@/lib/auth/is-access-token-valid";

export const dynamic = "force-dynamic";

/** Devuelve el access token de la cookie si sigue válido. Para renovar, usar POST /api/auth/refresh. */
export async function GET(request: NextRequest) {
  const access = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

  if (access && isAccessTokenValid(access)) {
    return NextResponse.json({
      access_token: normalizeAccessToken(access),
    });
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

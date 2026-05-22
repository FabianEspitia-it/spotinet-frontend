import { NextRequest, NextResponse } from "next/server";
import { applySessionCookiesToResponse } from "@/lib/auth/apply-session-cookies";
import { REFRESH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { normalizeAccessToken } from "@/lib/auth/is-access-token-valid";
import { getBackendHostForDiagnose } from "@/lib/env";
import { fetchRefreshedSessionAttempt } from "@/lib/auth/refresh-session";

export async function POST(req: NextRequest) {
  const refresh = req.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refresh) {
    return NextResponse.json({ error: "No hay sesión" }, { status: 401 });
  }

  const result = await fetchRefreshedSessionAttempt(refresh, {
    forwardCookieHeader: req.headers.get("cookie"),
  });
  if (!result.ok) {
    const backendHost = getBackendHostForDiagnose();
    return NextResponse.json(
      {
        error: "Refresh inválido",
        reason: result.reason,
        backendHost,
        ...(result.upstreamStatus != null && {
          upstreamStatus: result.upstreamStatus,
        }),
        ...(result.upstreamDetail && { upstreamDetail: result.upstreamDetail }),
      },
      { status: 401 }
    );
  }

  const session = result.session;

  const res = NextResponse.json({
    ok: true,
    access_token: normalizeAccessToken(session.accessToken),
  });
  applySessionCookiesToResponse(res, session);
  return res;
}

import type { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "./constants";
import {
  accessTokenCookie,
  clearedCookie,
  refreshTokenCookie,
} from "./cookie-options";
import type { RefreshedSession } from "./refresh-session";

export function applySessionCookiesToResponse(
  response: NextResponse,
  session: RefreshedSession
): void {
  clearSessionCookiesOnResponse(response);

  const access = accessTokenCookie(session.accessToken);
  const refresh = refreshTokenCookie(session.refreshToken);
  response.cookies.set(access.name, access.value, access.opts);
  response.cookies.set(refresh.name, refresh.value, refresh.opts);
}

/** Para que los route handlers vean los tokens renovados en la misma petición. */
export function applySessionCookiesToRequest(
  request: NextRequest,
  session: RefreshedSession
): void {
  request.cookies.set(ACCESS_TOKEN_COOKIE, session.accessToken);
  request.cookies.set(REFRESH_TOKEN_COOKIE, session.refreshToken);
}

export function clearSessionCookiesOnResponse(response: NextResponse): void {
  const a = clearedCookie(ACCESS_TOKEN_COOKIE);
  const r = clearedCookie(REFRESH_TOKEN_COOKIE);
  response.cookies.set(a.name, a.value, a.opts);
  response.cookies.set(r.name, r.value, r.opts);
}

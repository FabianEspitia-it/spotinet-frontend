import type { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "./constants";
import {
  accessTokenCookie,
  clearedCookieVariants,
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
): Headers {
  request.cookies.set(ACCESS_TOKEN_COOKIE, session.accessToken);
  request.cookies.set(REFRESH_TOKEN_COOKIE, session.refreshToken);

  const headers = new Headers(request.headers);
  const cookieHeader = request.cookies
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
  if (cookieHeader) {
    headers.set("cookie", cookieHeader);
  }
  return headers;
}

export function clearSessionCookiesOnResponse(response: NextResponse): void {
  for (const variant of clearedCookieVariants(ACCESS_TOKEN_COOKIE)) {
    response.cookies.set(variant.name, variant.value, variant.opts);
  }
  for (const variant of clearedCookieVariants(REFRESH_TOKEN_COOKIE)) {
    response.cookies.set(variant.name, variant.value, variant.opts);
  }
}

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  applySessionCookiesToResponse,
  clearSessionCookiesOnResponse,
} from "@/lib/auth/apply-session-cookies";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/auth/constants";
import {
  isAccessTokenValid,
  isAdminAccessToken,
} from "@/lib/auth/is-access-token-valid";
import { isDashboardPath, isPublicPagePath } from "@/lib/auth/public-paths";
import { fetchRefreshedSession } from "@/lib/auth/refresh-session";

function isPublicPath(pathname: string): boolean {
  if (isPublicPagePath(pathname)) return true;
  if (pathname === "/api/auth/signin") return true;
  if (pathname.startsWith("/api/auth/signin/")) return true;
  if (pathname === "/api/auth/login") return true;
  if (pathname.startsWith("/api/auth/login/")) return true;
  if (pathname === "/api/auth/logout") return true;
  if (pathname.startsWith("/api/auth/logout/")) return true;
  if (pathname === "/api/auth/refresh") return true;
  if (pathname.startsWith("/api/auth/refresh/")) return true;
  if (pathname === "/api/auth/access-token") return true;
  if (pathname.startsWith("/api/auth/access-token/")) return true;
  return false;
}

function isLoginPath(pathname: string): boolean {
  return pathname === "/login" || pathname.startsWith("/login/");
}

function isRefreshApiPath(pathname: string): boolean {
  return (
    pathname === "/api/auth/refresh" ||
    pathname.startsWith("/api/auth/refresh/")
  );
}

function dashboardAccessDeniedResponse(
  request: NextRequest
): NextResponse {
  return NextResponse.redirect(new URL("/", request.url));
}

function redirectToLogin(request: NextRequest): NextResponse {
  const res = NextResponse.redirect(new URL("/login", request.url));
  clearSessionCookiesOnResponse(res);
  return res;
}

async function tryRefreshSession(
  request: NextRequest,
  refreshToken: string
) {
  return fetchRefreshedSession(refreshToken, {
    forwardCookieHeader: request.headers.get("cookie"),
  });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  const valid = isAccessTokenValid(token);

  if (valid) {
    if (isLoginPath(pathname)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (isDashboardPath(pathname) && !isAdminAccessToken(token)) {
      return dashboardAccessDeniedResponse(request);
    }
    return NextResponse.next();
  }

  // /login: renovar en el servidor (sin POST /api/auth/refresh desde el cliente).
  if (refreshToken && isLoginPath(pathname) && !isRefreshApiPath(pathname)) {
    const session = await tryRefreshSession(request, refreshToken);

    if (session) {
      const redirect = NextResponse.redirect(new URL("/", request.url));
      applySessionCookiesToResponse(redirect, session);
      return redirect;
    }

    const response = NextResponse.next();
    clearSessionCookiesOnResponse(response);
    return response;
  }

  // Rutas protegidas con refresh: dejar pasar; SessionRenew renueva en el cliente.
  if (
    refreshToken &&
    !isPublicPagePath(pathname) &&
    !isLoginPath(pathname)
  ) {
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ detail: "No autenticado" }, { status: 401 });
  }

  return redirectToLogin(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|eot)$).*)",
  ],
};

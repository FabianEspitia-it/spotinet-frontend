import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  applySessionCookiesToRequest,
  applySessionCookiesToResponse,
  clearSessionCookiesOnResponse,
} from "@/lib/auth/apply-session-cookies";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/auth/constants";
import { isAccessTokenValid } from "@/lib/auth/is-access-token-valid";
import { isPublicPagePath } from "@/lib/auth/public-paths";
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

/**
 * Renueva access+refresh en el servidor (Vercel → GCP). No aparece en Network del navegador
 * como petición separada; solo Set-Cookie en la respuesta del documento.
 */
function respondWithRefreshedSession(
  request: NextRequest,
  session: { accessToken: string; refreshToken: string },
  redirectTo?: string
): NextResponse {
  const response = redirectTo
    ? NextResponse.redirect(new URL(redirectTo, request.url))
    : NextResponse.next();

  applySessionCookiesToResponse(response, session);
  if (!redirectTo) {
    applySessionCookiesToRequest(request, session);
  }
  return response;
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
    return NextResponse.next();
  }

  if (refreshToken && !isRefreshApiPath(pathname)) {
    const session = await tryRefreshSession(request, refreshToken);

    if (session) {
      if (isLoginPath(pathname)) {
        return respondWithRefreshedSession(request, session, "/");
      }
      if (!isPublicPagePath(pathname)) {
        return respondWithRefreshedSession(request, session);
      }
    }

    if (isLoginPath(pathname)) {
      const response = NextResponse.next();
      clearSessionCookiesOnResponse(response);
      return response;
    }
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

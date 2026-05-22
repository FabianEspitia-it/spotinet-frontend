import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  applySessionCookiesToRequest,
  applySessionCookiesToResponse,
  clearSessionCookiesOnResponse,
} from "@/lib/auth/apply-session-cookies";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/constants";
import { isAccessTokenValid } from "@/lib/auth/is-access-token-valid";
import { isPublicPagePath } from "@/lib/auth/public-paths";
import { getRefreshTokenFromRequest } from "@/lib/auth/read-request-cookies";
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

/** Evita doble POST /users/refresh: documento vs RSC/prefetch en la misma carga. */
function isDocumentNavigation(request: NextRequest): boolean {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/_next")) return false;
  if (request.headers.get("Rsc") === "1") return false;
  if (request.headers.get("Next-Router-Prefetch") === "1") return false;
  if (request.headers.get("Purpose") === "prefetch") return false;

  const dest = request.headers.get("Sec-Fetch-Dest");
  if (dest && dest !== "document" && dest !== "iframe") return false;

  return true;
}

function redirectToLogin(request: NextRequest): NextResponse {
  return NextResponse.redirect(new URL("/login", request.url));
}

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
  const refreshToken = getRefreshTokenFromRequest(request);
  const valid = isAccessTokenValid(token);
  const canRefresh =
    isDocumentNavigation(request) && refreshToken && !isRefreshApiPath(pathname);

  if (valid) {
    if (isLoginPath(pathname)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (canRefresh) {
    const session = await fetchRefreshedSession(refreshToken);

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
    "/((?!_next/static|_next/image|_next/data|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|eot)$).*)",
  ],
};

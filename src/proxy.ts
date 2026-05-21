import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  applySessionCookiesToRequest,
  applySessionCookiesToResponse,
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

function isRefreshApiPath(pathname: string): boolean {
  return (
    pathname === "/api/auth/refresh" ||
    pathname.startsWith("/api/auth/refresh/")
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  const valid = isAccessTokenValid(token);

  if (valid) {
    if (pathname === "/login" || pathname.startsWith("/login/")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Solo rutas protegidas del servidor (p. ej. /dashboard): refresh en proxy.
  // Las páginas públicas renuevan sesión vía SessionRestore en el cliente.
  const needsServerRefresh =
    refreshToken && !isRefreshApiPath(pathname) && !isPublicPath(pathname);

  if (needsServerRefresh) {
    const session = await fetchRefreshedSession(refreshToken);

    if (session) {
      const response = NextResponse.next();
      applySessionCookiesToResponse(response, session);
      applySessionCookiesToRequest(request, session);
      return response;
    }
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ detail: "No autenticado" }, { status: 401 });
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|eot)$).*)",
  ],
};

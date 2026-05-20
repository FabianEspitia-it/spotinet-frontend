import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ACCESS_COOKIE = "access_token";
const REFRESH_COOKIE = "refresh_token";
const ACCESS_MAX_AGE_SECONDS = 15 * 60;
const REFRESH_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function isProd() {
  return process.env.NODE_ENV === "production";
}

function getBackendUrl(): string {
  const url = process.env.BACKEND_API_URL;
  if (!url) throw new Error("BACKEND_API_URL is not set");
  return url.replace(/\/$/, "");
}

/** Rutas accesibles sin sesión válida (además de estáticos excluidos por `matcher`). */
function isPublicPath(pathname: string): boolean {
  if (pathname === "/login" || pathname.startsWith("/login/")) return true;
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

/** Decodifica el payload JWT (Edge-safe, sin `Buffer`). */
function decodeJwtPayload(token: string): { exp?: number } | null {
  const parts = token.split(".");
  if (parts.length !== 3 || !parts[1]) return null;
  try {
    const segment = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = segment.length % 4;
    const padded = pad === 0 ? segment : segment + "=".repeat(4 - pad);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as { exp?: number };
  } catch {
    return null;
  }
}

function isAccessTokenValid(token: string | undefined): boolean {
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") return false;
  const skewMs = 5000;
  return payload.exp * 1000 > Date.now() - skewMs;
}

/**
 * Intenta renovar los tokens usando el refresh_token.
 * Devuelve los nuevos tokens o null si el refresh falla.
 */
async function tryRefreshTokens(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string } | null> {
  try {
    const res = await fetch(`${getBackendUrl()}/users/refresh`, {
      method: "POST",
      headers: {
        Cookie: `refresh_token=${refreshToken}`,
      },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = (await res.json()) as { access_token?: string };
    const newAccessToken = data.access_token;
    if (!newAccessToken) return null;

    // Extraer el nuevo refresh_token del Set-Cookie del backend
    let newRefreshToken: string | null = null;
    const hdrs = res.headers as unknown as { getSetCookie?: () => string[] };
    const setCookies =
      typeof hdrs.getSetCookie === "function"
        ? hdrs.getSetCookie()
        : res.headers.get("set-cookie")
          ? [res.headers.get("set-cookie")!]
          : [];

    for (const sc of setCookies) {
      const firstPart = sc.split(";")[0]?.trim();
      if (!firstPart) continue;
      const [name, ...rest] = firstPart.split("=");
      if (name === REFRESH_COOKIE) {
        newRefreshToken = rest.join("=") || null;
        break;
      }
    }

    return {
      accessToken: newAccessToken.replace(/^Bearer\s+/i, ""),
      refreshToken: newRefreshToken ?? refreshToken,
    };
  } catch {
    return null;
  }
}

/**
 * Aplica los nuevos tokens como cookies en la respuesta y en la request
 * para que los route handlers downstream los vean.
 */
function applyRefreshedTokens(
  request: NextRequest,
  response: NextResponse,
  tokens: { accessToken: string; refreshToken: string }
) {
  // Cookies en la respuesta → el navegador las guarda
  response.cookies.set({
    name: ACCESS_COOKIE,
    value: tokens.accessToken,
    httpOnly: true,
    secure: isProd(),
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_MAX_AGE_SECONDS,
  });
  response.cookies.set({
    name: REFRESH_COOKIE,
    value: tokens.refreshToken,
    httpOnly: true,
    secure: isProd(),
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_MAX_AGE_SECONDS,
  });

  // Cookie en la request → los route handlers la leen en esta misma petición
  request.cookies.set(ACCESS_COOKIE, tokens.accessToken);
  request.cookies.set(REFRESH_COOKIE, tokens.refreshToken);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  const valid = isAccessTokenValid(token);

  if (valid) {
    if (pathname === "/login" || pathname.startsWith("/login/")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Access token expirado pero hay refresh token → intentar renovar
  if (refreshToken) {
    const tokens = await tryRefreshTokens(refreshToken);

    if (tokens) {
      // Redirigir usuarios autenticados fuera de sign-in
      if (pathname === "/login" || pathname.startsWith("/login/")) {
        const redirect = NextResponse.redirect(
          new URL("/", request.url)
        );
        applyRefreshedTokens(request, redirect, tokens);
        return redirect;
      }

      const response = NextResponse.next();
      applyRefreshedTokens(request, response, tokens);
      return response;
    }
  }

  // Sin token válido y sin refresh posible
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
    /*
     * Excluye estáticos de Next y assets comunes; el resto pasa por la proxy.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|eot)$).*)",
  ],
};
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "./constants";

function getSetCookieLines(headers: Headers): string[] {
  const withGetSetCookie = headers as Headers & {
    getSetCookie?: () => string[];
  };
  return typeof withGetSetCookie.getSetCookie === "function"
    ? withGetSetCookie.getSetCookie()
    : headers.get("set-cookie")
      ? [headers.get("set-cookie") as string]
      : [];
}

function parseCookieFromSetCookie(
  headers: Headers,
  cookieName: string
): string | undefined {
  const pattern = new RegExp(`^\\s*${cookieName}=([^;]+)`, "i");
  for (const line of getSetCookieLines(headers)) {
    const m = line.match(pattern);
    if (m) return decodeURIComponent(m[1]);
  }
  return undefined;
}

/** Extrae refresh_token de cabeceras Set-Cookie del backend. */
export function parseRefreshTokenFromSetCookie(
  headers: Headers
): string | undefined {
  return parseCookieFromSetCookie(headers, REFRESH_TOKEN_COOKIE);
}

/** Extrae access_token de cabeceras Set-Cookie del backend. */
export function parseAccessTokenFromSetCookie(
  headers: Headers
): string | undefined {
  return parseCookieFromSetCookie(headers, ACCESS_TOKEN_COOKIE);
}

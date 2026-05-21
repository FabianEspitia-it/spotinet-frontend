import { REFRESH_TOKEN_COOKIE } from "./constants";

/** Extrae refresh_token de cabeceras Set-Cookie del backend. */
export function parseRefreshTokenFromSetCookie(
  headers: Headers
): string | undefined {
  const withGetSetCookie = headers as Headers & {
    getSetCookie?: () => string[];
  };
  const lines =
    typeof withGetSetCookie.getSetCookie === "function"
      ? withGetSetCookie.getSetCookie()
      : headers.get("set-cookie")
        ? [headers.get("set-cookie") as string]
        : [];

  for (const line of lines) {
    const m = line.match(new RegExp(`^\\s*${REFRESH_TOKEN_COOKIE}=([^;]+)`, "i"));
    if (m) return decodeURIComponent(m[1]);
  }
  return undefined;
}

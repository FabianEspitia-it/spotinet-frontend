import type { NextRequest } from "next/server";
import { REFRESH_TOKEN_COOKIE } from "./constants";
import { normalizeRefreshToken } from "./normalize-refresh-token";

function decodeJwtExp(token: string): number | null {
  const parts = token.split(".");
  if (parts.length !== 3 || !parts[1]) return null;

  try {
    const segment = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = segment.length % 4;
    const padded = pad === 0 ? segment : segment + "=".repeat(4 - pad);
    const payload = JSON.parse(atob(padded)) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

/** Elige el refresh_token con exp más lejano si hay cookies duplicadas (host vs .domain). */
export function getRefreshTokenFromRequest(
  request: NextRequest
): string | undefined {
  const candidates = new Set<string>();

  const fromJar = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (fromJar) candidates.add(fromJar);

  const raw = request.headers.get("cookie");
  if (raw) {
    for (const match of raw.matchAll(/refresh_token=([^;]+)/gi)) {
      candidates.add(decodeURIComponent(match[1].trim()));
    }
  }

  let bestJwt: string | undefined;
  let bestExp = -1;
  let fallback: string | undefined;

  for (const rawToken of candidates) {
    const token = normalizeRefreshToken(rawToken);
    if (!token) continue;

    fallback ??= token;

    const exp = decodeJwtExp(token);
    if (exp !== null && exp > bestExp) {
      bestExp = exp;
      bestJwt = token;
    }
  }

  return bestJwt ?? fallback;
}

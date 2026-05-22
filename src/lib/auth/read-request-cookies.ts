import type { NextRequest } from "next/server";
import { REFRESH_TOKEN_COOKIE } from "./constants";
import {
  isAccessTokenValid,
  normalizeAccessToken,
} from "./is-access-token-valid";

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

  let best: string | undefined;
  let bestExp = 0;

  for (const rawToken of candidates) {
    const token = normalizeAccessToken(rawToken);
    if (!isAccessTokenValid(token)) continue;

    const parts = token.split(".");
    if (parts.length !== 3 || !parts[1]) continue;

    try {
      const segment = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const pad = segment.length % 4;
      const padded = pad === 0 ? segment : segment + "=".repeat(4 - pad);
      const payload = JSON.parse(atob(padded)) as { exp?: number };
      if (typeof payload.exp === "number" && payload.exp >= bestExp) {
        bestExp = payload.exp;
        best = token;
      }
    } catch {
      /* siguiente candidato */
    }
  }

  return best;
}

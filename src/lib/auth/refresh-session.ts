import { REFRESH_TOKEN_COOKIE } from "./constants";
import { normalizeRefreshToken } from "./normalize-refresh-token";
import { parseSessionFromRefreshResponse } from "./parse-session-from-refresh-response";
import { fetchBackendApi } from "@/server/fetch-backend-api";

export type RefreshedSession = {
  accessToken: string;
  refreshToken: string;
};

async function fetchRefreshedSessionOnce(
  rawRefreshToken: string
): Promise<RefreshedSession | null> {
  const refreshToken = normalizeRefreshToken(rawRefreshToken);
  if (!refreshToken) return null;

  try {
    const res = await fetchBackendApi("/users/refresh", {
      method: "POST",
      headers: {
        Cookie: `${REFRESH_TOKEN_COOKIE}=${refreshToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) return null;

    try {
      const parsed = await parseSessionFromRefreshResponse(res);
      if (!parsed.accessToken) return null;

      return {
        accessToken: parsed.accessToken,
        refreshToken: parsed.refreshToken ?? refreshToken,
      };
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

/** Prueba cada refresh_token hasta que el backend acepte uno (rotación + cookies duplicadas). */
export async function resolveRefreshedSession(
  refreshTokens: string[]
): Promise<RefreshedSession | null> {
  const seen = new Set<string>();

  for (const raw of refreshTokens) {
    const refreshToken = normalizeRefreshToken(raw);
    if (!refreshToken || seen.has(refreshToken)) continue;
    seen.add(refreshToken);

    const session = await fetchRefreshedSessionOnce(refreshToken);
    if (session) return session;
  }

  return null;
}

/** Renueva la sesión con POST /users/refresh. */
export async function fetchRefreshedSession(
  refreshToken: string
): Promise<RefreshedSession | null> {
  return fetchRefreshedSessionOnce(refreshToken);
}

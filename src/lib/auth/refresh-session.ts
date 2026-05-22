import { REFRESH_TOKEN_COOKIE } from "./constants";
import { normalizeRefreshToken } from "./normalize-refresh-token";
import { parseSessionFromRefreshResponse } from "./parse-session-from-refresh-response";
import { fetchBackendApi } from "@/server/fetch-backend-api";

export type RefreshedSession = {
  accessToken: string;
  refreshToken: string;
};

const inflightByRefreshToken = new Map<
  string,
  Promise<RefreshedSession | null>
>();

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

/** Renueva la sesión con POST /users/refresh (solo envía refresh_token, sin otras cookies). */
export async function fetchRefreshedSession(
  refreshToken: string
): Promise<RefreshedSession | null> {
  const key = normalizeRefreshToken(refreshToken);
  const existing = inflightByRefreshToken.get(key);
  if (existing) return existing;

  const promise = fetchRefreshedSessionOnce(refreshToken).finally(() => {
    if (inflightByRefreshToken.get(key) === promise) {
      inflightByRefreshToken.delete(key);
    }
  });

  inflightByRefreshToken.set(key, promise);
  return promise;
}

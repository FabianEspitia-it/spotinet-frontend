import { REFRESH_TOKEN_COOKIE } from "./constants";
import { parseSessionFromRefreshResponse } from "./parse-session-from-refresh-response";
import { fetchBackendApi } from "@/server/fetch-backend-api";

export type RefreshedSession = {
  accessToken: string;
  refreshToken: string;
};

/** Evita múltiples POST /users/refresh en paralelo con el mismo token (rotación). */
const inflightByRefreshToken = new Map<
  string,
  Promise<RefreshedSession | null>
>();

async function fetchRefreshedSessionOnce(
  refreshToken: string
): Promise<RefreshedSession | null> {
  try {
    const res = await fetchBackendApi("/users/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${REFRESH_TOKEN_COOKIE}=${refreshToken}`,
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

/** Renueva la sesión con POST /users/refresh usando la cookie refresh_token. */
export async function fetchRefreshedSession(
  refreshToken: string
): Promise<RefreshedSession | null> {
  const existing = inflightByRefreshToken.get(refreshToken);
  if (existing) return existing;

  const promise = fetchRefreshedSessionOnce(refreshToken).finally(() => {
    if (inflightByRefreshToken.get(refreshToken) === promise) {
      inflightByRefreshToken.delete(refreshToken);
    }
  });

  inflightByRefreshToken.set(refreshToken, promise);
  return promise;
}

import { REFRESH_TOKEN_COOKIE } from "./constants";
import { normalizeAccessToken } from "./is-access-token-valid";
import { parseAccessFromRefreshResponse } from "./parse-access-from-refresh-response";
import { parseRefreshTokenFromSetCookie } from "./parse-set-cookie";
import { fetchBackendApi } from "@/server/fetch-backend-api";

export type RefreshedSession = {
  accessToken: string;
  refreshToken: string;
};

/** Renueva la sesión con POST /users/refresh usando la cookie refresh_token. */
export async function fetchRefreshedSession(
  refreshToken: string
): Promise<RefreshedSession | null> {
  try {
    const res = await fetchBackendApi("/users/refresh", {
      method: "POST",
      headers: {
        Cookie: `${REFRESH_TOKEN_COOKIE}=${encodeURIComponent(refreshToken)}`,
      },
    });
    if (!res.ok) return null;

    const newRefresh =
      parseRefreshTokenFromSetCookie(res.headers) ?? refreshToken;

    let accessToken: string;
    try {
      accessToken = normalizeAccessToken(
        await parseAccessFromRefreshResponse(res)
      );
    } catch {
      return null;
    }

    if (!accessToken) return null;

    return { accessToken, refreshToken: newRefresh };
  } catch {
    return null;
  }
}

import { REFRESH_TOKEN_COOKIE } from "./constants";
import { parseAccessFromRefreshResponse } from "./parse-access-from-refresh-response";
import { fetchBackendApi } from "@/server/fetch-backend-api";

/** Calls POST /users/refresh with refresh_token cookie; returns new access token or null. */
export async function fetchNewAccessToken(
  refreshToken: string
): Promise<string | null> {
  try {
    const res = await fetchBackendApi("/users/refresh", {
      method: "POST",
      headers: {
        Cookie: `${REFRESH_TOKEN_COOKIE}=${encodeURIComponent(refreshToken)}`,
      },
    });
    if (!res.ok) return null;
    return await parseAccessFromRefreshResponse(res);
  } catch {
    return null;
  }
}

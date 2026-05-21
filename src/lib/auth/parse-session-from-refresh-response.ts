import { normalizeAccessToken } from "./is-access-token-valid";
import { parseRefreshTokenFromSetCookie } from "./parse-set-cookie";

type ParsedRefreshResponse = {
  accessToken: string;
  refreshToken?: string;
};

/** Lee access (+ refresh opcional) del body y/o Set-Cookie de POST /users/refresh. */
export async function parseSessionFromRefreshResponse(
  res: Response
): Promise<ParsedRefreshResponse> {
  const refreshFromHeader = parseRefreshTokenFromSetCookie(res.headers);
  const ct = res.headers.get("content-type") ?? "";

  if (ct.includes("application/json")) {
    const data: unknown = await res.json();

    if (typeof data === "string") {
      const accessToken = normalizeAccessToken(data);
      if (!accessToken) throw new Error("Empty refresh response");
      return { accessToken, refreshToken: refreshFromHeader };
    }

    if (data && typeof data === "object") {
      const o = data as Record<string, unknown>;
      const accessRaw = o.access_token ?? o.accessToken ?? o.token;
      const refreshRaw =
        o.refresh_token ?? o.refreshToken ?? refreshFromHeader;

      if (typeof accessRaw !== "string") {
        throw new Error("Refresh response did not include an access token");
      }

      return {
        accessToken: normalizeAccessToken(accessRaw),
        refreshToken:
          typeof refreshRaw === "string" ? refreshRaw : refreshFromHeader,
      };
    }

    throw new Error("Refresh response did not include an access token");
  }

  const text = (await res.text()).trim();
  if (!text) throw new Error("Empty refresh response");

  return {
    accessToken: normalizeAccessToken(text),
    refreshToken: refreshFromHeader,
  };
}

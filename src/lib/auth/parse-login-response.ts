function refreshFromSetCookieHeaders(headers: Headers): string | undefined {
  const withGetSetCookie = headers as Headers & { getSetCookie?: () => string[] };
  const lines =
    typeof withGetSetCookie.getSetCookie === "function"
      ? withGetSetCookie.getSetCookie()
      : headers.get("set-cookie")
        ? [headers.get("set-cookie") as string]
        : [];

  for (const line of lines) {
    const m = line.match(/^\s*refresh_token=([^;]+)/i);
    if (m) return decodeURIComponent(m[1]);
  }
  return undefined;
}

/** Reads access (and optionally refresh) token from backend login response. */
export async function parseLoginTokens(res: Response): Promise<{
  accessToken: string;
  refreshToken?: string;
}> {
  const refreshFromCookie = refreshFromSetCookieHeaders(res.headers);

  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    const data: unknown = await res.json();
    if (typeof data === "string") {
      return { accessToken: data, refreshToken: refreshFromCookie };
    }
    if (data && typeof data === "object") {
      const o = data as Record<string, unknown>;
      const access =
        o.access_token ?? o.accessToken ?? o.token ?? o.access;
      const refresh =
        o.refresh_token ?? o.refreshToken ?? refreshFromCookie;
      if (typeof access === "string") {
        return {
          accessToken: access,
          refreshToken: typeof refresh === "string" ? refresh : refreshFromCookie,
        };
      }
    }
    throw new Error("Login JSON response did not include a recognizable access token");
  }

  const text = (await res.text()).trim();
  if (!text) {
    throw new Error("Empty login response");
  }
  return { accessToken: text, refreshToken: refreshFromCookie };
}

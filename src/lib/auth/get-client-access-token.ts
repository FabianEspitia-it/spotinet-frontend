import { refreshSessionFromClient } from "./refresh-client";

async function fetchAccessTokenFromCookie(): Promise<string | null> {
  const res = await fetch("/api/auth/access-token", {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) return null;

  try {
    const data = (await res.json()) as { access_token?: string };
    const token = data.access_token?.trim();
    return token || null;
  } catch {
    return null;
  }
}

/**
 * Lee el access desde la cookie (GET /api/auth/access-token).
 * Si expiró, renueva con POST /api/auth/refresh y vuelve a leer la cookie.
 */
export async function getClientAccessToken(): Promise<string | null> {
  const token = await fetchAccessTokenFromCookie();
  if (token) return token;

  const refreshed = await refreshSessionFromClient();
  if (!refreshed) return null;

  return fetchAccessTokenFromCookie();
}

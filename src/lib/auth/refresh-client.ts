import { isAccessTokenValid } from "./is-access-token-valid";

/** Una sola renovación en vuelo desde el cliente (evita doble POST con rotación de refresh). */
let inflightRefresh: Promise<string | null> | null = null;

let cachedAccess: string | null = null;

/** POST /api/auth/refresh: setea cookies y devuelve el access token del cuerpo. */
export function refreshSessionFromClient(): Promise<string | null> {
  if (cachedAccess && isAccessTokenValid(cachedAccess)) {
    return Promise.resolve(cachedAccess);
  }

  if (inflightRefresh) return inflightRefresh;

  inflightRefresh = fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
  })
    .then(async (res) => {
      if (!res.ok) return null;
      try {
        const data = (await res.json()) as { access_token?: string };
        const token = data.access_token?.trim() || null;
        if (token && isAccessTokenValid(token)) {
          cachedAccess = token;
        }
        return token;
      } catch {
        return null;
      }
    })
    .catch(() => null)
    .finally(() => {
      inflightRefresh = null;
    });

  return inflightRefresh;
}

/** Limpia caché en memoria (p. ej. tras logout). */
export function clearCachedAccessToken(): void {
  cachedAccess = null;
  inflightRefresh = null;
}

/** Una sola renovación en vuelo desde el cliente (evita doble POST con rotación de refresh). */
let inflightRefresh: Promise<string | null> | null = null;

/** POST /api/auth/refresh: setea cookies y devuelve el access token del cuerpo. */
export function refreshSessionFromClient(): Promise<string | null> {
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
        return data.access_token?.trim() || null;
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

export function clearCachedAccessToken(): void {
  inflightRefresh = null;
}

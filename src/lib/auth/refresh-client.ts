/** Una sola renovación en vuelo (evita doble POST con rotación de refresh). */
let inflightRefresh: Promise<boolean> | null = null;

/** POST /api/auth/refresh: renueva cookies httpOnly. No devuelve el access en el body. */
export function refreshSessionFromClient(): Promise<boolean> {
  if (inflightRefresh) return inflightRefresh;

  inflightRefresh = fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
  })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      inflightRefresh = null;
    });

  return inflightRefresh;
}

export function clearCachedAccessToken(): void {
  inflightRefresh = null;
}

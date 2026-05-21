/** Rutas accesibles sin sesión válida en el proxy (auth vía refresh en cliente). */
export const PUBLIC_PAGE_PATHS = [
  "/",
  "/login",
  "/password_reset",
  "/netflix_verification_code",
  "/amazon_code",
  "/session_netflix_code",
  "/home_or_temporal",
  "/session_code",
  "/hbo_session_code",
] as const;

export function isPublicPagePath(pathname: string): boolean {
  return PUBLIC_PAGE_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

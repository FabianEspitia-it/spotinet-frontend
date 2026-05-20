/**
 * URL base del backend expuesta al navegador (solo flujos de códigos de streaming).
 * Debe apuntar al mismo host que `BACKEND_API_URL`.
 */
export function getPublicBackendBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_BACKEND_API_URL?.replace(/\/$/, "");
  if (!base) {
    throw new Error("NEXT_PUBLIC_BACKEND_API_URL is not configured");
  }
  return base;
}

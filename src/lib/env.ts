/**
 * URL base del backend. Server-only (sin prefijo `NEXT_PUBLIC_`),
 * por lo que solo debe leerse desde Server Actions, Route Handlers,
 * Server Components o middleware.
 */
export function getBackendBaseUrl(): string {
  const base = process.env.BACKEND_API_URL?.replace(/\/$/, "");
  if (!base) {
    throw new Error("BACKEND_API_URL is not configured");
  }
  return base;
}

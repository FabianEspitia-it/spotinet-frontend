import { refreshSessionFromClient } from "./refresh-client";

/** Comprueba sesión sin devolver el JWT (solo cookie httpOnly en el servidor). */
export async function hasValidClientSession(): Promise<boolean> {
  const res = await fetch("/api/auth/access-token", {
    credentials: "include",
    cache: "no-store",
  });
  return res.ok;
}

/** Renueva con refresh si hace falta; no expone el access en el cliente. */
export async function ensureClientSession(): Promise<boolean> {
  if (await hasValidClientSession()) return true;
  return refreshSessionFromClient();
}

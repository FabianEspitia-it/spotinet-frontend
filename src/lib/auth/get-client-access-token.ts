import { refreshSessionFromClient } from "./refresh-client";

/**
 * Obtiene access vía POST /api/auth/refresh (cookies httpOnly + token en la respuesta).
 */
export async function getClientAccessToken(): Promise<string | null> {
  return refreshSessionFromClient();
}

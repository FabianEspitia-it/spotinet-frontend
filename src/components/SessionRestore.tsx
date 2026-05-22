"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Al cargar la app, renueva la sesión si hay refresh_token pero falta access.
 * El proxy también renueva en el servidor; esto cubre recargas donde el refresh
 * del proxy no aplica cookies visibles al cliente (p. ej. página estática /login).
 */
export function SessionRestore() {
  const router = useRouter();
  const pathname = usePathname();
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    void (async () => {
      try {
        const res = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
        });
        if (
          res.ok &&
          (pathname === "/login" || pathname.startsWith("/login/"))
        ) {
          router.replace("/");
          router.refresh();
        }
      } catch {
        // Sin refresh_token o expirado: la UI pública sigue funcionando.
      }
    })();
  }, [pathname, router]);

  return null;
}

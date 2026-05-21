"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Al abrir la app (p. ej. tras cerrar el navegador), renueva la sesión con
 * una sola petición. Evita carreras del proxy en la carga inicial.
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
        if (res.ok && (pathname === "/login" || pathname.startsWith("/login/"))) {
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

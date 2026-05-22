"use client";

import { refreshSessionFromClient } from "@/lib/auth/refresh-client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/** Al cargar, renueva sesión con POST /api/auth/refresh si hay refresh_token. */
export function SessionRestore() {
  const router = useRouter();
  const pathname = usePathname();
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    void (async () => {
      try {
        const token = await refreshSessionFromClient();
        if (
          token &&
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

"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Si falta access pero hay refresh, pide token al BFF sin repetir POST /users/refresh
 * cuando el access aún es válido (evita invalidar refresh por rotación en prod).
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
        const res = await fetch("/api/auth/access-token", {
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

"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Si falta access válido, POST /api/auth/refresh setea access_token (y refresh) en cookies.
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
        const hasAccess = await fetch("/api/auth/access-token", {
          credentials: "include",
          cache: "no-store",
        });
        if (hasAccess.ok) return;

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

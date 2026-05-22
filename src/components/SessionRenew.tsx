"use client";

import { refreshSessionFromClient } from "@/lib/auth/refresh-client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

function isLoginPath(pathname: string): boolean {
  return pathname === "/login" || pathname.startsWith("/login/");
}

/**
 * Si el access expiró o se borró pero hay refresh, renueva vía POST /api/auth/refresh.
 * En /login no hace nada (el proxy ya maneja la sesión).
 */
export function SessionRenew() {
  const router = useRouter();
  const pathname = usePathname();
  const ranForPath = useRef<string | null>(null);

  useEffect(() => {
    if (isLoginPath(pathname)) return;
    if (ranForPath.current === pathname) return;
    ranForPath.current = pathname;

    void (async () => {
      try {
        const accessRes = await fetch("/api/auth/access-token", {
          credentials: "include",
          cache: "no-store",
        });
        if (accessRes.ok) return;

        const ok = await refreshSessionFromClient();
        if (!ok) {
          router.replace("/login");
        }
      } catch {
        router.replace("/login");
      }
    })();
  }, [pathname, router]);

  return null;
}

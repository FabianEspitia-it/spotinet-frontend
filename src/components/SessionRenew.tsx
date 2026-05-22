"use client";

import { ensureClientSession } from "@/lib/auth/session-client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

function isLoginPath(pathname: string): boolean {
  return pathname === "/login" || pathname.startsWith("/login/");
}

function isDashboardPath(pathname: string): boolean {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

/**
 * GET /api/auth/access-token y, si hace falta, POST /api/auth/refresh (visible en Network).
 */
export function SessionRenew() {
  const router = useRouter();
  const pathname = usePathname();
  const ranForPath = useRef<string | null>(null);

  useEffect(() => {
    if (isLoginPath(pathname) || isDashboardPath(pathname)) return;
    if (ranForPath.current === pathname) return;
    ranForPath.current = pathname;

    void (async () => {
      try {
        const ok = await ensureClientSession();
        if (!ok) {
          router.replace("/login");
          return;
        }
        router.refresh();
      } catch {
        router.replace("/login");
      }
    })();
  }, [pathname, router]);

  return null;
}

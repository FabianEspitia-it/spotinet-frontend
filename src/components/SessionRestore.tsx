"use client";

import { refreshSessionFromClient } from "@/lib/auth/refresh-client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/** En /login, renueva con refresh y redirige a inicio si ya hay sesión. */
export function SessionRestore() {
  const router = useRouter();
  const pathname = usePathname();
  const attempted = useRef(false);

  useEffect(() => {
    const onLogin =
      pathname === "/login" || pathname.startsWith("/login/");
    if (!onLogin) {
      attempted.current = false;
      return;
    }

    if (attempted.current) return;
    attempted.current = true;

    void (async () => {
      try {
        const token = await refreshSessionFromClient();
        if (token) {
          router.replace("/");
          router.refresh();
        }
      } catch {
        // Sin refresh_token: permanece en login.
      }
    })();
  }, [pathname, router]);

  return null;
}

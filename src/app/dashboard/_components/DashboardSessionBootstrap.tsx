"use client";

import Loader from "@/components/Loader";
import { ensureClientSession } from "@/lib/auth/session-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** GET access-token → POST refresh; luego refresh del servidor con cookies nuevas. */
export default function DashboardSessionBootstrap() {
  const router = useRouter();

  useEffect(() => {
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
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-principal_blue">
      <Loader />
    </div>
  );
}

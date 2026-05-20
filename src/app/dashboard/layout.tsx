import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import DashboardShell from "./_components/DashboardShell";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/constants";
import { fetchBackendApi } from "@/server/fetch-backend-api";

export const dynamic = "force-dynamic";

async function isAdminMessage(res: Response): Promise<boolean> {
  try {
    const data = (await res.clone().json()) as { detail?: unknown };
    const detail =
      typeof data?.detail === "string" ? data.detail.toLowerCase() : "";
    return detail.includes("admin privileges required");
  } catch {
    return false;
  }
}

async function ensureAdmin() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    notFound();
  }

  let res: Response;
  try {
    res = await fetchBackendApi("/users", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    return;
  }

  if (res.status === 403 || (await isAdminMessage(res))) {
    notFound();
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  await ensureAdmin();
  return <DashboardShell>{children}</DashboardShell>;
}

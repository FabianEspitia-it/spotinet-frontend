import { NextResponse } from "next/server";
import { getBackendHostForDiagnose } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * Comprueba qué backend ve el servidor en Vercel (sin secretos).
 * GET https://www.spotinetshop.com/api/auth/diagnose
 */
export async function GET() {
  const backendHost = getBackendHostForDiagnose();

  return NextResponse.json({
    backendConfigured: backendHost != null,
    backendHost,
    nodeEnv: process.env.NODE_ENV ?? "unknown",
  });
}

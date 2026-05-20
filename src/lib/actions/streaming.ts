"use server";

import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/constants";
import { getBackendBaseUrl } from "@/lib/env";

export type StreamingResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number };

export type CodeResponse = { code: string };
export type LinkResponse = { link: string };

type Credentials = { email: string; password: string };

type Provider = "netflix" | "disney" | "prime" | "hbo";

function buildUrl(provider: Provider, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getBackendBaseUrl()}/${provider}${normalized}`;
}

/**
 * Lee el access token de la cookie httpOnly (puesta por el flujo de login).
 * Devuelve `null` si la sesión expiró o no existe.
 */
async function readAccessToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
}

async function postJson<T>(
  url: string,
  body: unknown
): Promise<StreamingResult<T>> {
  const access = await readAccessToken();
  if (!access) {
    return { ok: false, status: 401 };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access}`,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!res.ok) {
      return { ok: false, status: res.status };
    }

    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch (error) {
    console.error("postJson error", error);
    return { ok: false, status: 0 };
  }
}

async function getJson<T>(url: string): Promise<StreamingResult<T>> {
  const access = await readAccessToken();
  if (!access) {
    return { ok: false, status: 401 };
  }

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return { ok: false, status: res.status };
    }

    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch (error) {
    console.error("getJson error", error);
    return { ok: false, status: 0 };
  }
}

export async function requestNetflixSessionCode(
  credentials: Credentials
): Promise<StreamingResult<CodeResponse>> {
  return postJson<CodeResponse>(
    buildUrl("netflix", "/session_code/"),
    credentials
  );
}

export async function requestNetflixVerificationCode(
  credentials: Credentials
): Promise<StreamingResult<CodeResponse>> {
  return postJson<CodeResponse>(
    buildUrl("netflix", "/verification_code/"),
    credentials
  );
}

export async function requestNetflixPasswordReset(
  credentials: Credentials
): Promise<StreamingResult<LinkResponse>> {
  return postJson<LinkResponse>(
    buildUrl("netflix", "/password_reset/"),
    credentials
  );
}

export async function requestNetflixHomeOrTemporal(
  email: string
): Promise<StreamingResult<LinkResponse>> {
  return getJson<LinkResponse>(
    buildUrl(
      "netflix",
      `/home_code_or_temporal_access/${encodeURIComponent(email)}`
    )
  );
}

export async function requestHboSessionCode(
  credentials: Credentials
): Promise<StreamingResult<CodeResponse>> {
  return postJson<CodeResponse>(buildUrl("hbo", "/code/"), credentials);
}

export async function requestDisneySessionCode(
  credentials: Credentials
): Promise<StreamingResult<CodeResponse>> {
  return postJson<CodeResponse>(
    buildUrl("disney", "/session_code/"),
    credentials
  );
}

export async function requestPrimeSessionCode(
  email: string
): Promise<StreamingResult<CodeResponse>> {
  return getJson<CodeResponse>(
    buildUrl("prime", `/session_code/${encodeURIComponent(email)}`)
  );
}

import { getClientAccessToken } from "@/lib/auth/get-client-access-token";
import { getBackendBaseUrl } from "@/lib/env";

export type StreamingResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number };

export type CodeResponse = { code: string };
export type LinkResponse = { link: string };

type Provider = "netflix" | "disney" | "prime" | "hbo";

function buildUrl(provider: Provider, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getBackendBaseUrl()}/${provider}${normalized}`;
}

async function authHeaders(): Promise<Headers | null> {
  const access = await getClientAccessToken();
  if (!access) return null;

  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("Authorization", `Bearer ${access}`);
  return headers;
}

async function postJson<T>(
  url: string,
  body: unknown
): Promise<StreamingResult<T>> {
  const headers = await authHeaders();
  if (!headers) {
    return { ok: false, status: 401 };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
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
  const headers = await authHeaders();
  if (!headers) {
    return { ok: false, status: 401 };
  }

  try {
    const res = await fetch(url, {
      method: "GET",
      headers,
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

export function requestNetflixSessionCode(
  email: string
): Promise<StreamingResult<CodeResponse>> {
  return postJson<CodeResponse>(buildUrl("netflix", "/session_code/"), {
    email,
  });
}

export function requestNetflixVerificationCode(
  email: string
): Promise<StreamingResult<CodeResponse>> {
  return postJson<CodeResponse>(
    buildUrl("netflix", "/verification_code/"),
    { email }
  );
}

export function requestHboSessionCode(
  email: string
): Promise<StreamingResult<CodeResponse>> {
  return postJson<CodeResponse>(buildUrl("hbo", "/code/"), { email });
}

export function requestDisneySessionCode(
  email: string
): Promise<StreamingResult<CodeResponse>> {
  return postJson<CodeResponse>(buildUrl("disney", "/session_code/"), {
    email,
  });
}

export function requestPrimeSessionCode(
  email: string
): Promise<StreamingResult<CodeResponse>> {
  return getJson<CodeResponse>(
    buildUrl("prime", `/session_code/${encodeURIComponent(email)}`)
  );
}

export function requestNetflixPasswordReset(
  email: string
): Promise<StreamingResult<LinkResponse>> {
  return postJson<LinkResponse>(buildUrl("netflix", "/password_reset/"), {
    email,
  });
}

export function requestNetflixHomeOrTemporal(
  email: string
): Promise<StreamingResult<LinkResponse>> {
  return getJson<LinkResponse>(
    buildUrl(
      "netflix",
      `/home_code_or_temporal_access/${encodeURIComponent(email)}`
    )
  );
}

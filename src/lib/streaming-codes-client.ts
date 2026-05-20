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

async function postJson<T>(
  url: string,
  body: unknown
): Promise<StreamingResult<T>> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
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
  credentials: Credentials
): Promise<StreamingResult<CodeResponse>> {
  return postJson<CodeResponse>(
    buildUrl("netflix", "/session_code/"),
    credentials
  );
}

export function requestNetflixVerificationCode(
  credentials: Credentials
): Promise<StreamingResult<CodeResponse>> {
  return postJson<CodeResponse>(
    buildUrl("netflix", "/verification_code/"),
    credentials
  );
}

export function requestHboSessionCode(
  credentials: Credentials
): Promise<StreamingResult<CodeResponse>> {
  return postJson<CodeResponse>(buildUrl("hbo", "/code/"), credentials);
}

export function requestDisneySessionCode(
  credentials: Credentials
): Promise<StreamingResult<CodeResponse>> {
  return postJson<CodeResponse>(
    buildUrl("disney", "/session_code/"),
    credentials
  );
}

export function requestPrimeSessionCode(
  email: string
): Promise<StreamingResult<CodeResponse>> {
  return getJson<CodeResponse>(
    buildUrl("prime", `/session_code/${encodeURIComponent(email)}`)
  );
}

export function requestNetflixPasswordReset(
  credentials: Credentials
): Promise<StreamingResult<LinkResponse>> {
  return postJson<LinkResponse>(
    buildUrl("netflix", "/password_reset/"),
    credentials
  );
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

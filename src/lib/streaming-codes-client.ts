export type StreamingResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number };

export type CodeResponse = { code: string };
export type LinkResponse = { link: string };

function buildUpstreamUrl(path: string): string {
  const normalized = path.startsWith("/") ? path.slice(1) : path;
  return `/api/upstream/${normalized}`;
}

async function postJson<T>(
  path: string,
  body: unknown
): Promise<StreamingResult<T>> {
  try {
    const res = await fetch(buildUpstreamUrl(path), {
      method: "POST",
      credentials: "include",
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

async function getJson<T>(path: string): Promise<StreamingResult<T>> {
  try {
    const res = await fetch(buildUpstreamUrl(path), {
      method: "GET",
      credentials: "include",
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
  return postJson<CodeResponse>("netflix/session_code/", { email });
}

export function requestNetflixVerificationCode(
  email: string
): Promise<StreamingResult<CodeResponse>> {
  return postJson<CodeResponse>("netflix/verification_code/", { email });
}

export function requestHboSessionCode(
  email: string
): Promise<StreamingResult<CodeResponse>> {
  return postJson<CodeResponse>("hbo/code/", { email });
}

export function requestDisneySessionCode(
  email: string
): Promise<StreamingResult<CodeResponse>> {
  return postJson<CodeResponse>("disney/session_code/", { email });
}

export function requestPrimeSessionCode(
  email: string
): Promise<StreamingResult<CodeResponse>> {
  return getJson<CodeResponse>(
    `prime/session_code/${encodeURIComponent(email)}`
  );
}

export function requestNetflixPasswordReset(
  email: string
): Promise<StreamingResult<LinkResponse>> {
  return postJson<LinkResponse>("netflix/password_reset/", { email });
}

export function requestNetflixHomeOrTemporal(
  email: string
): Promise<StreamingResult<LinkResponse>> {
  return getJson<LinkResponse>(
    `netflix/home_code_or_temporal_access/${encodeURIComponent(email)}`
  );
}

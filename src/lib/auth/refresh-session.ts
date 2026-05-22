import { REFRESH_TOKEN_COOKIE } from "./constants";
import { normalizeRefreshToken } from "./normalize-refresh-token";
import { parseSessionFromRefreshResponse } from "./parse-session-from-refresh-response";
import { fetchBackendApi } from "@/server/fetch-backend-api";

export type RefreshedSession = {
  accessToken: string;
  refreshToken: string;
};

export type RefreshFailureReason = "network" | "upstream" | "parse";

export type RefreshAttemptResult =
  | { ok: true; session: RefreshedSession }
  | {
      ok: false;
      reason: RefreshFailureReason;
      upstreamStatus?: number;
      upstreamDetail?: string;
    };

export type RefreshAttemptOptions = {
  /** Cabecera Cookie del navegador → se reenvía al backend. */
  forwardCookieHeader?: string | null;
};

const inflightByRefreshToken = new Map<
  string,
  Promise<RefreshAttemptResult>
>();

async function readUpstreamDetail(res: Response): Promise<string | undefined> {
  const raw = await res.text().catch(() => "");
  const trimmed = raw.trim().slice(0, 300);
  return trimmed || undefined;
}

function buildRefreshHeaders(
  refreshToken: string,
  forwardCookieHeader?: string | null
): HeadersInit {
  const cookie =
    forwardCookieHeader?.trim() ||
    `${REFRESH_TOKEN_COOKIE}=${refreshToken}`;

  return {
    Cookie: cookie,
    "Content-Type": "application/json",
  };
}

async function fetchRefreshedSessionOnce(
  rawRefreshToken: string,
  options?: RefreshAttemptOptions
): Promise<RefreshAttemptResult> {
  const refreshToken = normalizeRefreshToken(rawRefreshToken);
  if (!refreshToken) {
    return { ok: false, reason: "upstream", upstreamStatus: 400 };
  }

  try {
    const res = await fetchBackendApi("/users/refresh", {
      method: "POST",
      headers: buildRefreshHeaders(
        refreshToken,
        options?.forwardCookieHeader
      ),
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      return {
        ok: false,
        reason: "upstream",
        upstreamStatus: res.status,
        upstreamDetail: await readUpstreamDetail(res),
      };
    }

    try {
      const parsed = await parseSessionFromRefreshResponse(res);
      if (!parsed.accessToken) {
        return { ok: false, reason: "parse" };
      }
      return {
        ok: true,
        session: {
          accessToken: parsed.accessToken,
          refreshToken: parsed.refreshToken ?? refreshToken,
        },
      };
    } catch {
      return { ok: false, reason: "parse" };
    }
  } catch {
    return { ok: false, reason: "network" };
  }
}

export async function fetchRefreshedSession(
  refreshToken: string,
  options?: RefreshAttemptOptions
): Promise<RefreshedSession | null> {
  const result = await fetchRefreshedSessionAttempt(refreshToken, options);
  return result.ok ? result.session : null;
}

export async function fetchRefreshedSessionAttempt(
  refreshToken: string,
  options?: RefreshAttemptOptions
): Promise<RefreshAttemptResult> {
  const key = normalizeRefreshToken(refreshToken);
  const existing = inflightByRefreshToken.get(key);
  if (existing) return existing;

  const promise = fetchRefreshedSessionOnce(refreshToken, options).finally(() => {
    if (inflightByRefreshToken.get(key) === promise) {
      inflightByRefreshToken.delete(key);
    }
  });

  inflightByRefreshToken.set(key, promise);
  return promise;
}

import {
  ACCESS_MAX_AGE_SEC,
  ACCESS_TOKEN_COOKIE,
  REFRESH_MAX_AGE_SEC,
  REFRESH_TOKEN_COOKIE,
} from "./constants";

const isProd = process.env.NODE_ENV === "production";

type CookieOpts = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
};

export function accessTokenCookie(value: string): { name: string; value: string; opts: CookieOpts } {
  return {
    name: ACCESS_TOKEN_COOKIE,
    value,
    opts: {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: ACCESS_MAX_AGE_SEC,
    },
  };
}

export function refreshTokenCookie(value: string): { name: string; value: string; opts: CookieOpts } {
  return {
    name: REFRESH_TOKEN_COOKIE,
    value,
    opts: {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: REFRESH_MAX_AGE_SEC,
    },
  };
}

export function clearedCookie(name: string): { name: string; value: string; opts: CookieOpts } {
  return {
    name,
    value: "",
    opts: {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    },
  };
}

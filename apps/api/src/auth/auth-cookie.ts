import type { CookieOptions, Response } from "express";

export const REFRESH_COOKIE_NAME = "bidra_refresh_token";

function getBooleanEnv(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) {
    return defaultValue;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

export function getRefreshCookieOptions(expiresAt: Date): CookieOptions {
  const secure = getBooleanEnv(process.env.AUTH_COOKIE_SECURE, process.env.NODE_ENV !== "development");
  const sameSite = (process.env.AUTH_COOKIE_SAMESITE || "lax") as CookieOptions["sameSite"];

  return {
    httpOnly: true,
    secure,
    sameSite,
    domain: process.env.AUTH_COOKIE_DOMAIN || undefined,
    path: process.env.AUTH_COOKIE_PATH || "/",
    expires: expiresAt,
    maxAge: Math.max(0, expiresAt.getTime() - Date.now()),
  };
}

export function setRefreshCookie(response: Response, token: string, expiresAt: Date): void {
  response.cookie(REFRESH_COOKIE_NAME, token, getRefreshCookieOptions(expiresAt));
}

export function clearRefreshCookie(response: Response): void {
  response.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: getBooleanEnv(process.env.AUTH_COOKIE_SECURE, process.env.NODE_ENV !== "development"),
    sameSite: (process.env.AUTH_COOKIE_SAMESITE || "lax") as CookieOptions["sameSite"],
    domain: process.env.AUTH_COOKIE_DOMAIN || undefined,
    path: process.env.AUTH_COOKIE_PATH || "/",
  });
}

export function getCookieValue(cookieHeader: string | undefined, cookieName: string): string | null {
  if (!cookieHeader) {
    return null;
  }

  for (const cookie of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = cookie.trim().split("=");

    if (rawName === cookieName) {
      return decodeURIComponent(rawValue.join("="));
    }
  }

  return null;
}
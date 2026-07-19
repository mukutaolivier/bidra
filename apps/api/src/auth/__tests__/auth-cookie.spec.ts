import { describe, expect, it, vi } from "vitest";
import { clearRefreshCookie, getCookieValue, getRefreshCookieOptions, REFRESH_COOKIE_NAME, setRefreshCookie } from "../auth-cookie";

describe("auth-cookie helpers", () => {
  it("creates HttpOnly refresh cookie options", () => {
    const expiresAt = new Date(Date.now() + 30_000);
    const options = getRefreshCookieOptions(expiresAt);

    expect(options.httpOnly).toBe(true);
    expect(options.expires).toEqual(expiresAt);
    expect(options.maxAge).toBeGreaterThan(0);
  });

  it("sets and clears refresh cookie with expected name", () => {
    const response = {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as any;

    setRefreshCookie(response, "token-value", new Date(Date.now() + 60_000));
    clearRefreshCookie(response);

    expect(response.cookie).toHaveBeenCalledWith(
      REFRESH_COOKIE_NAME,
      "token-value",
      expect.objectContaining({ httpOnly: true })
    );
    expect(response.clearCookie).toHaveBeenCalledWith(
      REFRESH_COOKIE_NAME,
      expect.objectContaining({ httpOnly: true })
    );
  });

  it("reads cookie value from header", () => {
    const header = `a=1; ${REFRESH_COOKIE_NAME}=token%2Bvalue; b=2`;
    expect(getCookieValue(header, REFRESH_COOKIE_NAME)).toBe("token+value");
    expect(getCookieValue(undefined, REFRESH_COOKIE_NAME)).toBeNull();
  });
});

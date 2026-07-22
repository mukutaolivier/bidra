import { describe, it, expect, vi, beforeEach } from "vitest";
import { UnauthorizedException } from "@nestjs/common";
import { REFRESH_COOKIE_NAME } from "../auth-cookie";

vi.mock("../auth.service", () => ({
  AuthService: class AuthService {},
}));

describe("AuthController", () => {
  const authService = {
    login: vi.fn(),
    refreshTokens: vi.fn(),
    logout: vi.fn(),
  } as any;

  const makeResponse = () => ({
    cookie: vi.fn(),
    clearCookie: vi.fn(),
  });

  let controller: any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function buildController() {
    const { AuthController } = await import("../auth.controller");
    return new AuthController(authService);
  }

  it("login sets HttpOnly refresh cookie and does not expose refresh token in body", async () => {
    controller = await buildController();
    const response = makeResponse();
    const expiresAt = new Date(Date.now() + 60_000);

    authService.login.mockResolvedValue({
      user: { id: "u1", email: "test@example.com" },
      tokens: {
        accessToken: "access-token",
        refreshToken: "refresh-token",
        refreshTokenExpiresAt: expiresAt,
      },
    });

    const payload = await controller.login("test@example.com", "password", true, "127.0.0.1", "agent", response as any);

    expect(payload).toEqual({
      user: { id: "u1", email: "test@example.com" },
      accessToken: "access-token",
    });
    expect((payload as any).refreshToken).toBeUndefined();

    expect(response.cookie).toHaveBeenCalledTimes(1);
    const [cookieName, cookieValue, cookieOptions] = response.cookie.mock.calls[0];
    expect(cookieName).toBe(REFRESH_COOKIE_NAME);
    expect(cookieValue).toBe("refresh-token");
    expect(cookieOptions.httpOnly).toBe(true);
  });

  it("refresh reads token from cookie and rotates using auth service", async () => {
    controller = await buildController();
    const response = makeResponse();
    const expiresAt = new Date(Date.now() + 60_000);

    authService.refreshTokens.mockResolvedValue({
      user: { id: "u1", email: "test@example.com" },
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
      refreshTokenExpiresAt: expiresAt,
    });

    const req = {
      headers: {
        cookie: `foo=bar; ${REFRESH_COOKIE_NAME}=token-1`,
      },
    };

    const payload = await controller.refresh(req, "127.0.0.1", "agent", response as any);

    expect(authService.refreshTokens).toHaveBeenCalledWith("token-1", "127.0.0.1", "agent");
    expect(payload).toEqual({
      user: { id: "u1", email: "test@example.com" },
      accessToken: "new-access-token",
    });
    expect(response.cookie).toHaveBeenCalledTimes(1);
  });

  it("refresh rejects when cookie is missing", async () => {
    controller = await buildController();
    const response = makeResponse();

    const req = {
      headers: {},
    };

    await expect(controller.refresh(req, "127.0.0.1", "agent", response as any)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(authService.refreshTokens).not.toHaveBeenCalled();
  });

  it("logout revokes session and clears refresh cookie", async () => {
    controller = await buildController();
    const response = makeResponse();

    authService.logout.mockResolvedValue({ message: "logged out" });

    const req = {
      headers: {
        cookie: `${REFRESH_COOKIE_NAME}=token-2`,
      },
      user: {
        id: "u1",
        sessionId: "s1",
      },
    };

    const payload = await controller.logout(req, response as any);

    expect(authService.logout).toHaveBeenCalledWith("u1", "s1", "token-2");
    expect(response.clearCookie).toHaveBeenCalledTimes(1);
    expect(payload).toEqual({ message: "logged out" });
  });
});

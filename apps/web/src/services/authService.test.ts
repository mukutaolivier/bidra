import { beforeEach, describe, expect, it, vi } from "vitest";
import { authService } from "./authService";

function jsonResponse(status: number, payload: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (key: string) => (key.toLowerCase() === "content-type" ? "application/json" : null),
    },
    json: async () => payload,
  } as Response;
}

describe("authService security/session behavior", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    authService.clearSession();
  });

  it("bootstrap calls refresh endpoint with credentials", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/auth/refresh")) {
        expect(init?.credentials).toBe("include");
        expect(init?.method).toBe("POST");
        return jsonResponse(200, {
          user: { id: "u1", email: "u1@example.com" },
          accessToken: "token-new",
        });
      }
      if (url.endsWith("/auth/me")) {
        return jsonResponse(200, { id: "u1", email: "u1@example.com" });
      }
      return jsonResponse(404, { message: "not found" });
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await authService.bootstrap();

    expect(result.error).toBeNull();
    expect(result.user?.id).toBe("u1");
    expect(fetchMock).toHaveBeenCalled();
  });

  it("shares a single refresh request for concurrent 401 responses", async () => {
    authService.setAccessToken("old-access-token");

    let refreshCalls = 0;
    let meCalls = 0;

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/auth/refresh")) {
        refreshCalls += 1;
        return jsonResponse(200, {
          user: { id: "u1", email: "u1@example.com" },
          accessToken: "new-access-token",
        });
      }
      if (url.endsWith("/auth/me")) {
        meCalls += 1;
        if (meCalls <= 2) {
          return jsonResponse(401, { message: "expired" });
        }
        return jsonResponse(200, { id: "u1", email: "u1@example.com" });
      }
      return jsonResponse(404, { message: "not found" });
    });

    vi.stubGlobal("fetch", fetchMock);

    const [first, second] = await Promise.all([authService.getCurrentUser(), authService.getCurrentUser()]);

    expect(first.error).toBeNull();
    expect(second.error).toBeNull();
    expect(refreshCalls).toBe(1);
    expect(meCalls).toBeGreaterThanOrEqual(3);
  });

  it("retries original request only once after a 401", async () => {
    authService.setAccessToken("old-access-token");

    let meCalls = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/auth/refresh")) {
        return jsonResponse(200, {
          user: { id: "u1", email: "u1@example.com" },
          accessToken: "new-access-token",
        });
      }
      if (url.endsWith("/auth/me")) {
        meCalls += 1;
        if (meCalls === 1) {
          return jsonResponse(401, { message: "expired" });
        }
        return jsonResponse(200, { id: "u1", email: "u1@example.com" });
      }
      return jsonResponse(404, { message: "not found" });
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await authService.getCurrentUser();

    expect(result.error).toBeNull();
    expect(meCalls).toBe(2);
  });

  it("failed refresh clears auth state", async () => {
    authService.setAccessToken("old-access-token");

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { message: "expired" }))
      .mockResolvedValueOnce(jsonResponse(401, { message: "refresh failed" }))
      .mockResolvedValueOnce(jsonResponse(401, { message: "still unauthorized" }));

    vi.stubGlobal("fetch", fetchMock);

    const first = await authService.getCurrentUser();
    expect(first.user).toBeNull();
    expect(first.error?.code).toBe("401");

    await authService.getCurrentUser();

    const secondCallInit = fetchMock.mock.calls[2][1] as RequestInit;
    const headers = new Headers(secondCallInit?.headers || {});
    expect(headers.get("Authorization")).toBeNull();
  });

  it("signOut calls backend and does not store refresh tokens in browser storage", async () => {
    const localSetItem = vi.spyOn(window.localStorage.__proto__, "setItem");
    const sessionSetItem = vi.spyOn(window.sessionStorage.__proto__, "setItem");

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/auth/login")) {
        return jsonResponse(200, {
          user: { id: "u1", email: "u1@example.com" },
          accessToken: "access-token",
        });
      }
      if (url.endsWith("/auth/logout")) {
        expect(init?.method).toBe("POST");
        expect(init?.credentials).toBe("include");
        return jsonResponse(200, { message: "ok" });
      }
      return jsonResponse(404, { message: "not found" });
    });

    vi.stubGlobal("fetch", fetchMock);

    await authService.signIn("u1@example.com", "password", true);
    await authService.signOut();

    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/auth\/logout$/), expect.any(Object));
    expect(localSetItem).not.toHaveBeenCalled();
    expect(sessionSetItem).not.toHaveBeenCalled();
  });
});

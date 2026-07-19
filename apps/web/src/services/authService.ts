export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
  emailVerified?: boolean;
  sessionId?: string;
}

export interface AuthSession {
  id: string;
  deviceName?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt: string;
  lastActivityAt: string;
  expiresAt: string;
  revokedAt?: string | null;
  revokedReason?: string | null;
  reuseDetectedAt?: string | null;
}

export interface AuthError {
  message: string;
  code?: string;
}

interface LoginResponse {
  user: AuthUser;
  accessToken: string;
}

interface RegisterResponse {
  user: AuthUser;
}

interface RefreshResponse {
  user: AuthUser;
  accessToken: string;
}

interface ApiErrorPayload {
  message?: string | string[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function normalizeMessage(message: ApiErrorPayload["message"]): string {
  if (Array.isArray(message)) {
    return message[0] || "Request failed";
  }

  return message || "Request failed";
}

class BidraAuthClient {
  private accessToken: string | null = null;
  private refreshPromise: Promise<string | null> | null = null;

  setAccessToken(accessToken: string | null): void {
    this.accessToken = accessToken;
  }

  clearSession(): void {
    this.accessToken = null;
  }

  private async request<T>(path: string, init: RequestInit = {}, allowRetry = true): Promise<T> {
    const headers = new Headers(init.headers || {});

    if (!headers.has("Content-Type") && init.body) {
      headers.set("Content-Type", "application/json");
    }

    if (this.accessToken && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${this.accessToken}`);
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: "include",
      headers,
    });

    if (response.status === 401 && allowRetry && path !== "/auth/refresh") {
      const refreshed = await this.refreshAccessToken();

      if (refreshed) {
        return this.request<T>(path, init, false);
      }

      this.clearSession();
    }

    const isJson = response.headers.get("content-type")?.includes("application/json");
    const payload = isJson ? await response.json().catch(() => null) : null;

    if (!response.ok) {
      const errorPayload = payload as ApiErrorPayload | null;

      throw {
        message: normalizeMessage(errorPayload?.message),
        code: String(response.status),
      } satisfies AuthError;
    }

    return payload as T;
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      const isJson = response.headers.get("content-type")?.includes("application/json");
      const payload = isJson ? await response.json().catch(() => null) : null;

      if (!response.ok || !payload) {
        this.clearSession();
        return null;
      }

      const data = payload as RefreshResponse;
      this.accessToken = data.accessToken;
      return data.accessToken;
    })();

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  async bootstrap(): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const token = await this.refreshAccessToken();

      if (!token) {
        return { user: null, error: null };
      }

      const user = await this.getCurrentUser();
      return user;
    } catch {
      return { user: null, error: null };
    }
  }

  async signUp(
    email: string,
    password: string,
    name: string
  ): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const data = await this.request<RegisterResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, name }),
      });

      return { user: data.user, error: null };
    } catch (error) {
      return { user: null, error: error as AuthError };
    }
  }

  async signIn(
    email: string,
    password: string,
    rememberMe = false
  ): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const data = await this.request<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, rememberMe }),
      });

      this.accessToken = data.accessToken;
      return { user: data.user, error: null };
    } catch (error) {
      return { user: null, error: error as AuthError };
    }
  }

  async getCurrentUser(): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const data = await this.request<AuthUser>("/auth/me", { method: "GET" });
      return { user: data, error: null };
    } catch (error) {
      return { user: null, error: error as AuthError };
    }
  }

  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      await this.request<{ message: string }>("/auth/logout", { method: "POST" });
    } catch {
      // Best-effort logout; clear local state even if the server already invalidated it.
    }

    this.clearSession();
    return { error: null };
  }

  async forgotPassword(email: string): Promise<{ message: string; error: AuthError | null }> {
    try {
      const data = await this.request<{ message: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      return { message: data.message, error: null };
    } catch (error) {
      return { message: "", error: error as AuthError };
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string; error: AuthError | null }> {
    try {
      const data = await this.request<{ message: string }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword }),
      });

      return { message: data.message, error: null };
    } catch (error) {
      return { message: "", error: error as AuthError };
    }
  }

  async verifyEmail(token: string): Promise<{ message: string; error: AuthError | null }> {
    try {
      const data = await this.request<{ message: string }>(`/auth/verify-email?token=${encodeURIComponent(token)}`, {
        method: "GET",
      });

      return { message: data.message, error: null };
    } catch (error) {
      return { message: "", error: error as AuthError };
    }
  }

  async resendVerification(email: string): Promise<{ message: string; error: AuthError | null }> {
    try {
      const data = await this.request<{ message: string }>("/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      return { message: data.message, error: null };
    } catch (error) {
      return { message: "", error: error as AuthError };
    }
  }

  async getSessions(): Promise<{ sessions: AuthSession[]; error: AuthError | null }> {
    try {
      const sessions = await this.request<AuthSession[]>("/auth/sessions", { method: "GET" });
      return { sessions, error: null };
    } catch (error) {
      return { sessions: [], error: error as AuthError };
    }
  }

  async revokeSession(sessionId: string): Promise<{ message: string; error: AuthError | null }> {
    try {
      const data = await this.request<{ message: string }>(`/auth/sessions/${sessionId}`, {
        method: "DELETE",
      });

      return { message: data.message, error: null };
    } catch (error) {
      return { message: "", error: error as AuthError };
    }
  }

  async revokeOtherSessions(): Promise<{ message: string; error: AuthError | null }> {
    try {
      const data = await this.request<{ message: string }>("/auth/sessions/revoke-others", {
        method: "POST",
      });

      return { message: data.message, error: null };
    } catch (error) {
      return { message: "", error: error as AuthError };
    }
  }

  async logoutAll(): Promise<{ message: string; error: AuthError | null }> {
    try {
      const data = await this.request<{ message: string }>("/auth/logout-all", {
        method: "POST",
      });

      return { message: data.message, error: null };
    } catch (error) {
      return { message: "", error: error as AuthError };
    }
  }
}

export const authClient = new BidraAuthClient();

export const authService = {
  bootstrap: () => authClient.bootstrap(),
  signUp: (email: string, password: string, name: string) => authClient.signUp(email, password, name),
  signIn: (email: string, password: string, rememberMe = false) => authClient.signIn(email, password, rememberMe),
  getCurrentUser: () => authClient.getCurrentUser(),
  signOut: () => authClient.signOut(),
  forgotPassword: (email: string) => authClient.forgotPassword(email),
  resetPassword: (token: string, newPassword: string) => authClient.resetPassword(token, newPassword),
  verifyEmail: (token: string) => authClient.verifyEmail(token),
  resendVerification: (email: string) => authClient.resendVerification(email),
  getSessions: () => authClient.getSessions(),
  revokeSession: (sessionId: string) => authClient.revokeSession(sessionId),
  revokeOtherSessions: () => authClient.revokeOtherSessions(),
  logoutAll: () => authClient.logoutAll(),
  setAccessToken: (accessToken: string | null) => authClient.setAccessToken(accessToken),
  clearSession: () => authClient.clearSession(),
};
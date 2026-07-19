"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { authService, type AuthSession, type AuthUser } from "@/services/authService";

interface AuthContextValue {
  user: AuthUser | null;
  sessions: AuthSession[];
  loading: boolean;
  initialized: boolean;
  refresh: () => Promise<void>;
  signIn: typeof authService.signIn;
  signUp: typeof authService.signUp;
  signOut: typeof authService.signOut;
  forgotPassword: typeof authService.forgotPassword;
  resetPassword: typeof authService.resetPassword;
  verifyEmail: typeof authService.verifyEmail;
  resendVerification: typeof authService.resendVerification;
  revokeSession: typeof authService.revokeSession;
  revokeOtherSessions: typeof authService.revokeOtherSessions;
  logoutAll: typeof authService.logoutAll;
  reloadSessions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const refresh = useCallback(async () => {
    const result = await authService.bootstrap();
    setUser(result.user);
  }, []);

  const reloadSessions = useCallback(async () => {
    const result = await authService.getSessions();
    if (!result.error) {
      setSessions(result.sessions);
    }
  }, []);

  const signOut = useCallback(async () => {
    const result = await authService.signOut();
    setUser(null);
    setSessions([]);
    return result;
  }, []);

  const revokeSession = useCallback(async (sessionId: string) => {
    const result = await authService.revokeSession(sessionId);
    await reloadSessions();
    return result;
  }, [reloadSessions]);

  const revokeOtherSessions = useCallback(async () => {
    const result = await authService.revokeOtherSessions();
    await reloadSessions();
    return result;
  }, [reloadSessions]);

  const logoutAll = useCallback(async () => {
    const result = await authService.logoutAll();
    setUser(null);
    setSessions([]);
    return result;
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      const result = await authService.bootstrap();

      if (!active) {
        return;
      }

      setUser(result.user);
      setLoading(false);
      setInitialized(true);

      if (result.user) {
        const sessionsResult = await authService.getSessions();
        if (active && !sessionsResult.error) {
          setSessions(sessionsResult.sessions);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const value: AuthContextValue = {
    user,
    sessions,
    loading,
    initialized,
    refresh,
    signIn: authService.signIn,
    signUp: authService.signUp,
    signOut,
    forgotPassword: authService.forgotPassword,
    resetPassword: authService.resetPassword,
    verifyEmail: authService.verifyEmail,
    resendVerification: authService.resendVerification,
    revokeSession,
    revokeOtherSessions,
    logoutAll,
    reloadSessions,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
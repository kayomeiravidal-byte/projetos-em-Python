import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { authApi, AuthResponse } from "../api/authApi";
import { tokenStore } from "./tokenStore";
import { decodeClaims, JwtClaims } from "./jwt";
import { setOnAuthFailure } from "../api/httpClient";

interface AuthContextValue {
  claims: JwtClaims | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (organizationName: string, name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (code: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [claims, setClaims] = useState<JwtClaims | null>(() => {
    const token = tokenStore.getAccessToken();
    return token ? decodeClaims(token) : null;
  });

  useEffect(() => {
    setOnAuthFailure(() => setClaims(null));
  }, []);

  function applyAuthResponse(response: AuthResponse) {
    tokenStore.setTokens(response.accessToken, response.refreshToken);
    setClaims(decodeClaims(response.accessToken));
  }

  async function login(email: string, password: string) {
    applyAuthResponse(await authApi.login({ email, password }));
  }

  async function register(organizationName: string, name: string, email: string, password: string) {
    applyAuthResponse(await authApi.register({ organizationName, name, email, password }));
  }

  function logout() {
    const refreshToken = tokenStore.getRefreshToken();
    if (refreshToken) {
      authApi.logout(refreshToken).catch(() => {});
    }
    tokenStore.clear();
    setClaims(null);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      claims,
      isAuthenticated: !!claims,
      login,
      register,
      logout,
      hasPermission: (code) => claims?.permissions.includes(code) ?? false,
    }),
    [claims]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}

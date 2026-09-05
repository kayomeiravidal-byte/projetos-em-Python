import { createHttpClient } from "./httpClient";

const AUTH_BASE_URL = import.meta.env.VITE_AUTH_API_URL;

export const authHttp = createHttpClient(AUTH_BASE_URL, AUTH_BASE_URL);

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface OrgUser {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

export const authApi = {
  register: (data: { organizationName: string; name: string; email: string; password: string }) =>
    authHttp.post<AuthResponse>("/api/auth/register", data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    authHttp.post<AuthResponse>("/api/auth/login", data).then((r) => r.data),

  logout: (refreshToken: string) => authHttp.post("/api/auth/logout", { refreshToken }),

  listOrgUsers: () => authHttp.get<OrgUser[]>("/api/org/users").then((r) => r.data),

  createOrgUser: (data: { name: string; email: string; password: string; role: string }) =>
    authHttp.post<OrgUser>("/api/org/users", data).then((r) => r.data),

  updateOrgUser: (id: number, data: { role?: string; active?: boolean }) =>
    authHttp.put<OrgUser>(`/api/org/users/${id}`, data).then((r) => r.data),
};

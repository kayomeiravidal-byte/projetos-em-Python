import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { tokenStore } from "../auth/tokenStore";

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let onAuthFailure: (() => void) | null = null;

export function setOnAuthFailure(handler: () => void) {
  onAuthFailure = handler;
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(authBaseUrl: string): Promise<string | null> {
  const refreshToken = tokenStore.getRefreshToken();
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post(`${authBaseUrl}/api/auth/refresh`, { refreshToken });
    tokenStore.setTokens(data.accessToken, data.refreshToken);
    return data.accessToken as string;
  } catch {
    return null;
  }
}

export function createHttpClient(baseURL: string, authBaseUrl: string): AxiosInstance {
  const client = axios.create({ baseURL });

  client.interceptors.request.use((config) => {
    const token = tokenStore.getAccessToken();
    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const original = error.config as RetryableConfig | undefined;
      if (error.response?.status === 401 && original && !original._retry) {
        original._retry = true;
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken(authBaseUrl).finally(() => {
            refreshPromise = null;
          });
        }
        const newToken = await refreshPromise;
        if (newToken) {
          original.headers.set("Authorization", `Bearer ${newToken}`);
          return client(original);
        }
        tokenStore.clear();
        onAuthFailure?.();
      }
      return Promise.reject(error);
    }
  );

  return client;
}

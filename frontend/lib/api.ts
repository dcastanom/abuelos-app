import axios, { AxiosRequestConfig } from "axios";

let _accessToken: string | null = null;
let _onRefreshFail: (() => void) | null = null;

export function setAccessToken(token: string | null): void {
  _accessToken = token;
}

export function setRefreshFailCallback(fn: () => void): void {
  _onRefreshFail = fn;
}

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

interface RetryConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

type QueueItem = { resolve: (token: string) => void; reject: (err: unknown) => void };
let _isRefreshing = false;
let _queue: QueueItem[] = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original: RetryConfig = error.config ?? {};

    if (error.response?.status === 401 && !original._retry) {
      if (_isRefreshing) {
        return new Promise((resolve, reject) => {
          _queue.push({ resolve, reject });
        }).then((token) => {
          original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
          return api(original);
        });
      }

      original._retry = true;
      _isRefreshing = true;

      try {
        const { data } = await api.post<{ access_token: string }>("/api/v1/auth/refresh");
        setAccessToken(data.access_token);
        _queue.forEach((p) => p.resolve(data.access_token));
        _queue = [];
        original.headers = {
          ...original.headers,
          Authorization: `Bearer ${data.access_token}`,
        };
        return api(original);
      } catch (refreshError) {
        _queue.forEach((p) => p.reject(refreshError));
        _queue = [];
        setAccessToken(null);
        _onRefreshFail?.();
        return Promise.reject(refreshError);
      } finally {
        _isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

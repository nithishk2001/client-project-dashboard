import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// withCredentials so the HttpOnly refresh token cookie gets sent
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

// Keep the access token in memory (not localStorage) and attach it to
// every request automatically.
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// If a request fails with 401, try refreshing the access token once,
// then retry the original request.
let isRefreshing = false;
let pendingRequests: Array<() => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Wait for the in-flight refresh to finish, then retry
        return new Promise((resolve) => {
          pendingRequests.push(() => resolve(api(originalRequest)));
        });
      }

      isRefreshing = true;

      try {
        const res = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        setAccessToken(res.data.accessToken);

        pendingRequests.forEach((cb) => cb());
        pendingRequests = [];

        return api(originalRequest);
      } catch (refreshError) {
        setAccessToken(null);
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

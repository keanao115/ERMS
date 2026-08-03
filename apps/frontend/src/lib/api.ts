import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Session storage is the STRICT and ONLY source of truth for active authentication sessions.
 * No localStorage fallback is used, forcing sessions to expire when the browser window/tab is closed.
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('erms_access_token');
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('erms_refresh_token');
}

export function getAuthUser(): any | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem('erms_user');
  return raw ? JSON.parse(raw) : null;
}

export function clearAuthSession() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem('erms_access_token');
  sessionStorage.removeItem('erms_refresh_token');
  sessionStorage.removeItem('erms_user');
  sessionStorage.removeItem('erms_server_boot_id');
  sessionStorage.removeItem('erms_clock_modal_dismissed');
  localStorage.removeItem('erms_access_token');
  localStorage.removeItem('erms_refresh_token');
  localStorage.removeItem('erms_user');
}

export function purgeLegacyLocalStorageAuth() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('erms_access_token');
  localStorage.removeItem('erms_refresh_token');
  localStorage.removeItem('erms_user');
}

export async function verifyServerInstance(): Promise<boolean> {
  if (typeof window === 'undefined') return true;
  const storedBootId = sessionStorage.getItem('erms_server_boot_id');
  if (!storedBootId) return false;

  try {
    const res = await axios.get(`${API_BASE_URL}/auth/instance`);
    if (res.data?.serverBootId && res.data.serverBootId !== storedBootId) {
      clearAuthSession();
      return false;
    }
    return true;
  } catch {
    clearAuthSession();
    return false;
  }
}

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && typeof window !== 'undefined') {
      originalRequest._retry = true;
      const refreshToken = getRefreshToken();

      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRefreshToken, serverBootId } = res.data;

          sessionStorage.setItem('erms_access_token', accessToken);
          if (newRefreshToken) {
            sessionStorage.setItem('erms_refresh_token', newRefreshToken);
          }
          if (serverBootId) {
            sessionStorage.setItem('erms_server_boot_id', serverBootId);
          }

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshErr) {
          clearAuthSession();
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      } else {
        clearAuthSession();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

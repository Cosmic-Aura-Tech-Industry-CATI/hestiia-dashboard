/**
 * Centralized API Client for Hestiiya Admin Dashboard
 * Connects directly to Hestiiya Modular Backend
 */

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

let isRefreshing = false;
let refreshSubscribers: ((newToken: string) => void)[] = [];

function onTokenRefreshed(newToken: string) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (newToken: string) => void) {
  refreshSubscribers.push(cb);
}

export const AUTH_STORAGE_KEYS = {
  TOKEN: 'hestiia_admin_token',
  REFRESH_TOKEN: 'hestiia_admin_refresh_token',
  USER: 'hestiia_admin_user',
} as const;

export function saveAuthSession(payload: { token: string; refreshToken?: string; user?: unknown }) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, payload.token);
  if (payload.refreshToken) {
    localStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, payload.refreshToken);
  }
  if (payload.user !== undefined) {
    localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(payload.user));
  }
}

export function clearAuthSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
  localStorage.removeItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN);
}

export function getCachedAuthUser<T = any>(): T | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(AUTH_STORAGE_KEYS.USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function isStaffRole(role?: string): boolean {
  return (role || '').toUpperCase() === 'STAFF';
}

export class ApiClient {
  private static baseURL = process.env.NEXT_PUBLIC_API_URL || '/api';

  public static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = getAuthToken();
    const headers = new Headers(options.headers || {});

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const url = `${this.baseURL}${endpoint}`;

    try {
      const res = await fetch(url, {
        ...options,
        headers,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Handle 401 Unauthorized for protected endpoints
        const isAuthRoute =
          endpoint.includes('/auth/login') ||
          endpoint.includes('/auth/refresh') ||
          endpoint.includes('/auth/forgot-password') ||
          endpoint.includes('/auth/reset-password') ||
          endpoint.includes('/auth/verify-otp');

        if (res.status === 401 && !isAuthRoute && typeof window !== 'undefined') {
          const refreshToken = localStorage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);

          if (refreshToken) {
            // Attempt silent token refresh
            if (!isRefreshing) {
              isRefreshing = true;
              try {
                const refreshRes = await fetch(`${this.baseURL}/auth/refresh`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ refreshToken }),
                });

                const refreshData = await refreshRes.json().catch(() => ({}));
                if (refreshRes.ok && (refreshData.accessToken || refreshData.token)) {
                  const newAccessToken = refreshData.accessToken || refreshData.token;
                  saveAuthSession({
                    token: newAccessToken,
                    refreshToken: refreshData.refreshToken,
                    user: refreshData.user,
                  });
                  isRefreshing = false;
                  onTokenRefreshed(newAccessToken);

                  // Retry the original failed request with the new token
                  headers.set('Authorization', `Bearer ${newAccessToken}`);
                  const retryRes = await fetch(url, { ...options, headers });
                  const retryData = await retryRes.json().catch(() => ({}));
                  if (!retryRes.ok) {
                    throw new ApiError(retryData.message || `Request failed with status ${retryRes.status}`, retryRes.status, retryData);
                  }
                  return retryData as T;
                } else {
                  throw new Error('Refresh token invalid');
                }
              } catch {
                isRefreshing = false;
                refreshSubscribers = [];
                clearAuthSession();
                if (!window.location.pathname.includes('/login')) {
                  window.location.href = '/login?expired=true';
                }
                throw new ApiError('Session expired. Please sign in again.', 401);
              }
            } else {
              // Queue request while another refresh is in progress
              return new Promise<T>((resolve, reject) => {
                addRefreshSubscriber(async (newToken: string) => {
                  try {
                    headers.set('Authorization', `Bearer ${newToken}`);
                    const retryRes = await fetch(url, { ...options, headers });
                    const retryData = await retryRes.json().catch(() => ({}));
                    if (!retryRes.ok) {
                      reject(new ApiError(retryData.message || `Request failed with status ${retryRes.status}`, retryRes.status, retryData));
                    } else {
                      resolve(retryData as T);
                    }
                  } catch (e) {
                    reject(e);
                  }
                });
              });
            }
          } else {
            // No refresh token available
            clearAuthSession();
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login?expired=true';
            }
          }
        }

        throw new ApiError(data.message || `Request failed with status ${res.status}`, res.status, data);
      }

      return data as T;
    } catch (err: any) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(err.message || 'Network error occurred. Please verify backend server is reachable.', 0);
    }
  }

  public static get<T>(endpoint: string, headers?: HeadersInit): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  public static post<T>(endpoint: string, body?: any, headers?: HeadersInit): Promise<T> {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body),
      headers,
    });
  }

  public static put<T>(endpoint: string, body?: any, headers?: HeadersInit): Promise<T> {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: isFormData ? body : JSON.stringify(body),
      headers,
    });
  }

  public static patch<T>(endpoint: string, body?: any, headers?: HeadersInit): Promise<T> {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: isFormData ? body : JSON.stringify(body),
      headers,
    });
  }

  public static delete<T>(endpoint: string, headers?: HeadersInit): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }
}

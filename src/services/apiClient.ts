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

export class ApiClient {
  private static baseURL = process.env.NEXT_PUBLIC_API_URL || '/api';

  public static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('hestiia_admin_token') : null;
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
        // Handle 401 Unauthorized for Admin endpoints
        if (res.status === 401 && endpoint.includes('/admin') && typeof window !== 'undefined') {
          const isAuthRoute = endpoint.includes('/auth/login') || endpoint.includes('/auth/refresh');
          const refreshToken = localStorage.getItem('hestiia_admin_refresh_token');

          if (!isAuthRoute && refreshToken) {
            // Attempt silent token refresh
            if (!isRefreshing) {
              isRefreshing = true;
              try {
                const refreshRes = await fetch(`${this.baseURL}/admin/auth/refresh`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ refreshToken }),
                });

                const refreshData = await refreshRes.json().catch(() => ({}));
                if (refreshRes.ok && (refreshData.accessToken || refreshData.token)) {
                  const newAccessToken = refreshData.accessToken || refreshData.token;
                  localStorage.setItem('hestiia_admin_token', newAccessToken);
                  if (refreshData.refreshToken) {
                    localStorage.setItem('hestiia_admin_refresh_token', refreshData.refreshToken);
                  }
                  if (refreshData.user) {
                    localStorage.setItem('hestiia_admin_user', JSON.stringify(refreshData.user));
                  }
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
              } catch (refreshErr) {
                isRefreshing = false;
                refreshSubscribers = [];
                localStorage.removeItem('hestiia_admin_token');
                localStorage.removeItem('hestiia_admin_refresh_token');
                localStorage.removeItem('hestiia_admin_user');
                if (!window.location.pathname.includes('/login')) {
                  window.location.href = '/admin/login?expired=true';
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
            // No refresh token available or auth route failed
            localStorage.removeItem('hestiia_admin_token');
            localStorage.removeItem('hestiia_admin_refresh_token');
            localStorage.removeItem('hestiia_admin_user');
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/admin/login?expired=true';
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

import { ApiClient } from '../../../services/apiClient';
import { AdminUser } from '../../../types';

export const authService = {
  login: async (credentials: { username: string; password: string }) => {
    return ApiClient.post<{ success: boolean; token: string; user: AdminUser; message: string }>(
      '/admin/auth/login',
      credentials
    );
  },

  getMe: async () => {
    return ApiClient.get<{ success: boolean; user: AdminUser }>('/admin/auth/me');
  },

  logout: async () => {
    return ApiClient.post<{ success: boolean; message: string }>('/admin/auth/logout');
  },

  changePassword: async (passwords: { currentPassword: string; newPassword: string }) => {
    return ApiClient.post<{ success: boolean; message: string }>('/admin/auth/change-password', passwords);
  },

  getUsers: async () => {
    return ApiClient.get<{ success: boolean; users: AdminUser[] }>('/admin/auth/users');
  },

  createUser: async (userData: any) => {
    return ApiClient.post<{ success: boolean; user: AdminUser; message: string }>('/admin/auth/users', userData);
  },
};

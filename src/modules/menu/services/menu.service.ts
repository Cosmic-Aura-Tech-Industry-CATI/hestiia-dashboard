import { ApiClient } from '../../../services/apiClient';
import { FoodItem } from '../../../types';

export interface MenuQueryParams {
  category?: string;
  available?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const menuService = {
  getAll: async (params?: MenuQueryParams) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.available) query.set('available', params.available);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    return ApiClient.get<{ success: boolean; dishes: FoodItem[]; total: number; page: number; totalPages: number }>(
      `/admin/menu/admin/all?${query.toString()}`
    );
  },

  create: async (dish: Partial<FoodItem>) => {
    return ApiClient.post<{ success: boolean; dish: FoodItem; message: string }>('/admin/menu/admin', dish);
  },

  update: async (id: string, updates: Partial<FoodItem>) => {
    return ApiClient.put<{ success: boolean; dish: FoodItem; message: string }>(`/admin/menu/admin/${id}`, updates);
  },

  toggleAvailability: async (id: string, available?: boolean) => {
    return ApiClient.patch<{ success: boolean; dish: FoodItem; message: string }>(`/admin/menu/admin/${id}/availability`, { available });
  },

  delete: async (id: string) => {
    return ApiClient.delete<{ success: boolean; archived?: boolean; message: string }>(`/admin/menu/admin/${id}`);
  },
};

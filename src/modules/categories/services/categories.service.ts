import { ApiClient } from '../../../services/apiClient';
import { FoodCategory } from '../../../types';

export const categoriesService = {
  getAll: async () => {
    return ApiClient.get<{ success: boolean; categories: FoodCategory[] }>('/admin/categories/admin/all');
  },

  create: async (category: Partial<FoodCategory>) => {
    return ApiClient.post<{ success: boolean; category: FoodCategory; message: string }>('/admin/categories/admin', category);
  },

  update: async (id: string, updates: Partial<FoodCategory>) => {
    return ApiClient.put<{ success: boolean; category: FoodCategory; message: string }>(`/admin/categories/admin/${id}`, updates);
  },

  delete: async (id: string) => {
    return ApiClient.delete<{ success: boolean; message: string }>(`/admin/categories/admin/${id}`);
  },
};

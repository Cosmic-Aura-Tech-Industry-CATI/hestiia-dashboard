import { ApiClient } from '../../../services/apiClient';
import { Promotion } from '../../../types';

export const promotionsService = {
  getAll: async () => {
    return ApiClient.get<{ success: boolean; promotions: Promotion[] }>('/admin/promotions/admin/all');
  },

  create: async (promo: Partial<Promotion>) => {
    return ApiClient.post<{ success: boolean; promotion: Promotion; message: string }>('/admin/promotions/admin', promo);
  },

  update: async (id: string, updates: Partial<Promotion>) => {
    return ApiClient.put<{ success: boolean; promotion: Promotion; message: string }>(
      `/admin/promotions/admin/${id}`,
      updates
    );
  },

  delete: async (id: string) => {
    return ApiClient.delete<{ success: boolean; message: string }>(`/admin/promotions/admin/${id}`);
  },
};

import { ApiClient } from '../../../services/apiClient';
import { RestaurantSettings } from '../../../types';

export const settingsService = {
  get: async () => {
    return ApiClient.get<{ success: boolean; settings: RestaurantSettings }>('/admin/settings/admin');
  },

  update: async (settings: Partial<RestaurantSettings>) => {
    return ApiClient.put<{ success: boolean; settings: RestaurantSettings; message: string }>(
      '/admin/settings/admin',
      settings
    );
  },
};

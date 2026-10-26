import { ApiClient } from '../../../services/apiClient';
import { GalleryPhoto } from '../../../types';

export const galleryService = {
  getAll: async () => {
    return ApiClient.get<{ success: boolean; gallery: GalleryPhoto[] }>('/admin/gallery/admin/all');
  },

  create: async (photo: Partial<GalleryPhoto>) => {
    return ApiClient.post<{ success: boolean; photo: GalleryPhoto; message: string }>('/admin/gallery/admin', photo);
  },

  update: async (id: string, updates: Partial<GalleryPhoto>) => {
    return ApiClient.put<{ success: boolean; photo: GalleryPhoto; message: string }>(
      `/admin/gallery/admin/${id}`,
      updates
    );
  },

  delete: async (id: string) => {
    return ApiClient.delete<{ success: boolean; message: string }>(`/admin/gallery/admin/${id}`);
  },
};

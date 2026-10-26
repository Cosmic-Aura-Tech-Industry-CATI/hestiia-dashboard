import { ApiClient } from '../../../services/apiClient';

export const uploadService = {
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return ApiClient.post<{ success: boolean; url: string; filename: string; message: string }>(
      '/admin/upload',
      formData
    );
  },
};
